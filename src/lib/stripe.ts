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
    cachad = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cachad;
}

export function harStripe(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
