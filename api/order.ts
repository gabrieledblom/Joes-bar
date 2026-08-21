/**
 * POST /api/order  (Vercel Function, Node-runtime med Web-handler)
 *
 * Tar emot en beställning, validerar allt på servern (priser räknas ALLTID
 * om från menyn – klientens siffror används aldrig), skickar SMS till
 * restaurangen och kunden via 46elks och loggar ordern via src/lib/store
 * (Upstash Redis i drift, in-memory lokalt).
 *
 * Utan ELKS_API_USERNAME/ELKS_API_PASSWORD körs SMS i mock-läge (loggas i
 * funktionsloggen) – utom i produktion, där beställningar då stängs av
 * med ett tydligt fel i stället för att låtsas lyckas.
 */
import { z } from 'zod';
import { ordering } from '../src/config/ordering';
import { harTelefon, site } from '../src/config/site';
import { nuIStockholm, valideraHamtningstid } from '../src/lib/hours';
import { normaliseraMobil } from '../src/lib/phone';
import { beraknaOrder, type BeraknadRad } from '../src/lib/pricing';
import { orderStore } from '../src/lib/store';

const TRETTIO_DAGAR_SEK = 30 * 86_400;

const OrderSchema = z.object({
  namn: z.string().trim().min(2).max(60),
  mobil: z.string().max(20),
  pickupAt: z.string().max(20),
  kommentar: z.string().max(300).optional().default(''),
  /** Honeypot – människor lämnar det tomt */
  webbplats: z.string().optional().default(''),
  rader: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        antal: z.number().int().min(1).max(99),
        tillval: z.string().max(40).optional(),
      }),
    )
    .min(1)
    .max(30),
});

const svar = (status: number, body: object): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const fel = (status: number, text: string): Response => svar(status, { ok: false, fel: text });

/* ---------------------------------------------------------------- SMS -- */

interface SmsResultat {
  ok: boolean;
  mock: boolean;
}

async function skickaSms(till: string, text: string): Promise<SmsResultat> {
  const anvandare = process.env.ELKS_API_USERNAME;
  const losenord = process.env.ELKS_API_PASSWORD;
  if (!anvandare || !losenord) {
    console.log(`[SMS mock] till ${till}:\n${text}`);
    return { ok: true, mock: true };
  }
  try {
    const res = await fetch('https://api.46elks.com/a1/sms', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${anvandare}:${losenord}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ from: ordering.smsAvsandare, to: till, message: text }),
    });
    if (!res.ok) console.error(`46elks svarade ${res.status}: ${await res.text()}`);
    return { ok: res.ok, mock: false };
  } catch (e) {
    console.error('46elks-anrop misslyckades', e);
    return { ok: false, mock: false };
  }
}

const kundSms = (namn: string, nr: string, tid: string, summa: number): string =>
  [
    `${site.namn}: Tack ${namn}! Order #${nr} mottagen.`,
    `Hämtas ${tid}. Summa ${summa} kr, betalas på plats.`,
    harTelefon ? `Frågor? Ring ${site.telefon}.` : 'Frågor? Hör av dig i baren.',
  ].join('\n');

const restaurangSms = (
  nr: string,
  tid: string,
  rader: BeraknadRad[],
  summa: number,
  namn: string,
  mobil: string,
  kommentar: string,
): string =>
  [
    `NY ORDER #${nr} – hämtas ${tid}`,
    ...rader.map((r) => `${r.antal}x ${r.namn}${r.tillval ? ` (${r.tillval})` : ''}`),
    `Summa: ${summa} kr`,
    `Kund: ${namn}, ${mobil}`,
    `Kommentar: ${kommentar || '-'}`,
  ].join('\n');

/* ------------------------------------------------------------- Handler -- */

export async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return fel(405, 'Metoden stöds inte.');

  if (!ordering.aktiv) return fel(503, 'Onlinebeställningen är tillfälligt stängd. Ring oss så hjälper vi dig.');

  // I produktion utan SMS-nycklar: stäng hellre än att låtsas skicka.
  const harNycklar = Boolean(process.env.ELKS_API_USERNAME && process.env.ELKS_API_PASSWORD);
  if (!harNycklar && process.env.VERCEL_ENV === 'production') {
    return fel(503, 'Onlinebeställningen är inte aktiverad ännu. Ring oss så tar vi din beställning direkt.');
  }

  let data: z.infer<typeof OrderSchema>;
  try {
    data = OrderSchema.parse(await req.json());
  } catch {
    return fel(400, 'Kontrollera uppgifterna och försök igen.');
  }

  // Honeypot ifyllt = bot. Inget låtsas-kvitto – bara ett neutralt fel.
  if (data.webbplats !== '') return fel(400, 'Något gick fel. Försök igen.');

  const store = orderStore();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'okand';
  const antalDennaTimme = await store.okaRaknare(`rate:${ip}`, 3_600);
  if (antalDennaTimme > ordering.maxOrdrarPerIpPerTimme) {
    return fel(429, 'För många beställningar från din uppkoppling den senaste timmen. Ring oss i stället.');
  }

  const mobil = normaliseraMobil(data.mobil);
  if (!mobil) return fel(400, 'Ange ett svenskt mobilnummer (07XXXXXXXX eller +467XXXXXXXX).');

  const berakning = beraknaOrder(data.rader);
  if (!berakning.ok) return fel(400, berakning.fel);
  if (berakning.summa > ordering.maxOrderVarde) {
    return fel(400, `Beställningar över ${ordering.maxOrderVarde} kr tar vi gärna per telefon – ring oss så ordnar vi det.`);
  }

  const nu = nuIStockholm();
  const tidskoll = valideraHamtningstid(data.pickupAt, nu);
  if (!tidskoll.ok) return fel(400, tidskoll.skal);

  const lopnr = await store.okaRaknare(`seq:${nu.datum}`, 2 * 86_400);
  const nr = String(lopnr);

  // Logga FÖRST – loggen är restaurangens säkerhetsnät om ett SMS försvinner.
  // Full post (med personuppgifter) försvinner automatiskt efter 30 dagar;
  // arkivposten utan personuppgifter blir kvar för bokföringskontroll.
  const arkivpost = {
    ordernummer: nr,
    tidsstampel: new Date().toISOString(),
    hamtas: data.pickupAt,
    rader: berakning.rader.map((r) => ({ antal: r.antal, namn: r.namn, tillval: r.tillval ?? null, radpris: r.radpris })),
    summa: berakning.summa,
    smsStatus: 'skickas',
  };
  const loggpost = { ...arkivpost, namn: data.namn, mobil, kommentar: data.kommentar };
  const loggNyckel = `order:${nu.datum}:${lopnr}`;
  const arkivNyckel = `orderarkiv:${nu.datum}:${lopnr}`;
  await store.sattJson(loggNyckel, loggpost, TRETTIO_DAGAR_SEK);
  await store.sattJson(arkivNyckel, arkivpost);

  const sattSmsStatus = async (status: string) => {
    await store.sattJson(loggNyckel, { ...loggpost, smsStatus: status }, TRETTIO_DAGAR_SEK);
    await store.sattJson(arkivNyckel, { ...arkivpost, smsStatus: status });
  };

  // Restaurangens SMS är det kritiska – utan det finns ingen order.
  const restaurangTill = process.env.ORDER_SMS_TO || site.telefonE164;
  if (!restaurangTill) {
    await sattSmsStatus('stoppad-saknar-mottagare');
    return fel(503, 'Onlinebeställningen är inte aktiverad ännu. Ring oss så tar vi din beställning direkt.');
  }
  const tillRestaurang = await skickaSms(
    restaurangTill,
    restaurangSms(nr, tidskoll.label, berakning.rader, berakning.summa, data.namn, mobil, data.kommentar),
  );
  if (!tillRestaurang.ok) {
    await sattSmsStatus('misslyckades');
    return fel(
      502,
      `Beställningen kom inte fram till köket. Ring oss${harTelefon ? ` på ${site.telefon}` : ''} så tar vi den direkt.`,
    );
  }

  // Kundens SMS är bäst-möjligt: ordern finns redan hos köket.
  const tillKund = await skickaSms(mobil, kundSms(data.namn, nr, tidskoll.label, berakning.summa));
  await sattSmsStatus(tillKund.ok ? (tillRestaurang.mock ? 'mock' : 'skickade') : 'kund-sms-misslyckades');

  return svar(200, { ok: true, ordernummer: nr, tid: tidskoll.label, summa: berakning.summa });
}

export const POST = handler;
