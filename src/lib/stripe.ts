import Stripe from "stripe";

let cachad: Stripe | null = null;

/**
 * Stripe-klienten skapas först vid anrop. Byggsteget har inga nycklar och
 * ska inte behöva några.
 */
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY saknas. Hämta nyckeln i Stripe Dashboard och lägg in den i Vercel.",
    );
  }
  if (!cachad) {
    // Ett hängande anrop ska ge gästen ett felmeddelande efter en halv minut,
    // inte hålla kassan låst. Stripe-biblioteket försöker om på nätverksfel.
    cachad = new Stripe(process.env.STRIPE_SECRET_KEY, {
      timeout: 20_000,
      maxNetworkRetries: 2,
    });
  }
  return cachad;
}

export function harStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
