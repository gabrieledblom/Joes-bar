import type { Order } from "@/lib/db/schema";
import { skickaEpostAterbetald, skickaEpostKvitto } from "./epost";
import { skickaSmsAterbetald, skickaSmsKvitto } from "./sms";

export interface Utskick {
  epost: boolean;
  sms: boolean;
}

/**
 * Gästen får ett meddelande, inte två: e-post om den finns, annars sms.
 * Går e-posten inte iväg (Resend nere, felskriven adress) och gästen även
 * angett mobilnummer, skickas ett sms i stället så att kvittot ändå kommer
 * fram.
 */
async function skickaEtt(
  order: Order,
  epost: (o: Order) => Promise<boolean>,
  sms: (o: Order) => Promise<boolean>,
): Promise<Utskick> {
  const epostGick = order.kundEpost ? await forsok(() => epost(order)) : false;
  if (epostGick) return { epost: true, sms: false };
  const smsGick = order.kundTelefon ? await forsok(() => sms(order)) : false;
  return { epost: false, sms: smsGick };
}

/** Kvittot efter en betald order. */
export function skickaKvitto(order: Order): Promise<Utskick> {
  return skickaEtt(order, skickaEpostKvitto, skickaSmsKvitto);
}

/** Beskedet när köket avbrutit en betald order och pengarna går tillbaka. */
export function meddelaAterbetald(order: Order): Promise<Utskick> {
  return skickaEtt(order, skickaEpostAterbetald, skickaSmsAterbetald);
}

/** Längre än så väntar vi inte på en leverantör. Webhooken måste hinna svara Stripe. */
export const UTSKICK_TIDSGRANS_MS = 12_000;

/** Ett utskick får varken fälla eller hänga anropet som gör det. */
async function forsok(skicka: () => Promise<boolean>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tidsgrans = new Promise<boolean>((klar) => {
    timer = setTimeout(() => {
      console.error("Utskicket till gästen tog för lång tid och avbröts");
      klar(false);
    }, UTSKICK_TIDSGRANS_MS);
  });
  try {
    return await Promise.race([skicka(), tidsgrans]);
  } catch (fel) {
    console.error("Kunde inte skicka meddelande till gästen", fel);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
