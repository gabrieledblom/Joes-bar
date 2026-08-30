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

  const text = byggSmsText(order);
  const anvandare = process.env.ELKS_API_USERNAME;
  const losenord = process.env.ELKS_API_PASSWORD;
  const avsandare = (process.env.ELKS_SMS_FROM ?? "JoesBar").slice(0, 11);

  if (!anvandare || !losenord) {
    console.info(
      `[46elks mock] Till ${order.kundTelefon} från ${avsandare}:\n${text}`,
    );
    return false;
  }

  const kropp = new URLSearchParams({
    from: avsandare,
    to: order.kundTelefon,
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
    .map((r) => `${r.antal}x ${r.namn}${r.protein ? ` (${r.protein})` : ""}`)
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
