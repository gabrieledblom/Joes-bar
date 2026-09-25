import type { Order } from "@/lib/db/schema";
import { orenTillKronor } from "@/lib/pengar";
import { bestallning, restaurang } from "@/data/restaurang";

const ELKS_URL = "https://api.46elks.com/a1/sms";

/**
 * Sms-kvitto via 46elks. Basic Auth, formulärkodad kropp.
 * Utan nycklar loggas meddelandet i stället för att skickas, så att hela
 * flödet går att testa innan kontot finns.
 */
export async function skickaSmsKvitto(order: Order): Promise<boolean> {
  if (!order.kundTelefon) return false;
  return skickaSms(order.kundTelefon, byggSmsText(order));
}

/** Sms till gästen när köket avbrutit ordern och pengarna går tillbaka. */
export async function skickaSmsAterbetald(order: Order): Promise<boolean> {
  if (!order.kundTelefon) return false;
  const text = [
    `${restaurang.namn}: vi har tyvärr fått avbryta order ${order.ordernummer}.`,
    `${orenTillKronor(order.summaOren)} kr betalas tillbaka till samma kort eller Swish inom några bankdagar.`,
    restaurang.telefon ? `Frågor? Ring ${restaurang.telefon}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return skickaSms(order.kundTelefon, text);
}

async function skickaSms(till: string, text: string): Promise<boolean> {
  const anvandare = process.env.ELKS_API_USERNAME;
  const losenord = process.env.ELKS_API_PASSWORD;
  const avsandare = (process.env.ELKS_SMS_FROM ?? "JoesBar").slice(0, 11);

  if (!anvandare || !losenord) {
    console.info(`[46elks mock] Till ${till} från ${avsandare}:\n${text}`);
    return false;
  }

  const kropp = new URLSearchParams({
    from: avsandare,
    to: till,
    message: text,
  });

  const svar = await fetch(ELKS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${anvandare}:${losenord}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: kropp,
  });

  if (!svar.ok) {
    const detalj = await svar.text();
    console.error(`46elks svarade ${svar.status}: ${detalj}`);
    return false;
  }
  return true;
}

/**
 * Sms debiteras per påbörjat segment, så texten hålls kort. Rätterna
 * listas alltid; noteringar utelämnas eftersom köket har dem och gästen
 * redan vet vad hen skrev.
 */
function byggSmsText(order: Order): string {
  const rader = order.rader
    .map((r) => {
      const tillagg = [
        r.protein,
        r.tillbehor,
        r.sideNamn ? `Med ${r.sideNamn}` : null,
        ...(r.tillvalNamn ?? []),
      ]
        .filter(Boolean)
        .join(", ");
      return `${r.antal}x ${r.namn}${tillagg ? ` (${tillagg})` : ""}`;
    })
    .join(", ");

  const hamtning =
    order.typ === "bord"
      ? `Bord ${order.bordsnummer}`
      : `Hämtas om ca ${bestallning.tillagningsminuter} min`;

  return [
    `${restaurang.namn}: order ${order.ordernummer} betald.`,
    rader,
    `Summa ${orenTillKronor(order.summaOren)} kr.`,
    hamtning + ".",
  ].join("\n");
}
