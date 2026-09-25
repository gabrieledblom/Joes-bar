import { hamtaGamlaObetalda, raderaObetaldOrder } from "@/lib/db/orders";
import { harStripe, stripe } from "@/lib/stripe";

/** Obetalda beställningar sparas så här länge, sedan raderas de. */
const SPARAS_TIMMAR = 48;
/** Hur ofta en serverinstans som mest letar efter något att rensa. */
const HOGST_VAR_MS = 60 * 60 * 1000;

let senast = 0;

/**
 * Tar bort påbörjade beställningar som aldrig betalades. De innehåller namn
 * och telefonnummer, och integritetspolicyn lovar att de inte sparas.
 *
 * Betalningen hos Stripe stängs först. En order raderas aldrig om Stripe
 * säger att pengarna faktiskt dragits - då har webhooken missat den, och den
 * ska till köket, inte bort.
 */
export async function rensaObetalda(nu: Date = new Date()): Promise<number> {
  const aldreAn = new Date(nu.getTime() - SPARAS_TIMMAR * 3_600_000);
  let raderade = 0;

  for (const order of await hamtaGamlaObetalda(aldreAn)) {
    const intentId = order.stripePaymentIntentId;
    if (intentId && harStripe()) {
      try {
        const intent = await stripe().paymentIntents.retrieve(intentId);
        if (intent.status === "succeeded" || intent.status === "processing") {
          console.error(
            `Order ${order.ordernummer} är obetald hos oss men "${intent.status}" hos Stripe. Kolla webhooken.`,
          );
          continue;
        }
        if (intent.status !== "canceled") {
          await stripe().paymentIntents.cancel(intentId);
        }
      } catch (fel) {
        console.error(`Kunde inte stänga betalningen för ${order.ordernummer}`, fel);
        continue;
      }
    }
    await raderaObetaldOrder(order.id);
    raderade++;
  }
  return raderade;
}

/** Rensar som mest en gång i timmen per serverinstans, ofarligt att anropa ofta. */
export async function rensaIBland(): Promise<void> {
  if (Date.now() - senast < HOGST_VAR_MS) return;
  senast = Date.now();
  try {
    await rensaObetalda();
  } catch (fel) {
    console.error("Rensningen av obetalda ordrar misslyckades", fel);
  }
}
