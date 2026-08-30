"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart";
import { restaurang } from "@/data/restaurang";

const publikNyckel = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publikNyckel ? loadStripe(publikNyckel) : null;

export function Betalning() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const clientSecret = params.get("cs");

  // Betalningsfönstret ärver sajtens mörka tema. Utan detta står ett vitt
  // kortformulär mitt i en mörk sida.
  const utseende = useMemo(
    () =>
      ({
        theme: "night" as const,
        variables: {
          colorPrimary: "#ff2e88",
          colorBackground: "#1c1130",
          colorText: "#f5eefb",
          colorDanger: "#ff7a2f",
          borderRadius: "4px",
          fontFamily: "system-ui, sans-serif",
        },
      }),
    [],
  );

  if (!clientSecret || !orderId) {
    return (
      <Meddelande
        rubrik="Betalningen kunde inte startas"
        text="Gå tillbaka till kassan och försök igen."
      />
    );
  }

  if (!stripePromise) {
    return (
      <Meddelande
        rubrik="Betalning inte konfigurerad"
        text="Nyckeln NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY saknas. Se README."
      />
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: utseende, locale: "sv" }}
    >
      <BetalFormular orderId={orderId} />
    </Elements>
  );
}

function BetalFormular({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toem } = useCart();
  const [fel, setFel] = useState("");
  const [skickar, setSkickar] = useState(false);
  const [redo, setRedo] = useState(false);

  // Gästen kommer tillbaka hit från Swish-appen eller 3D Secure. Är
  // betalningen klar ska varukorgen inte ligga kvar.
  useEffect(() => {
    if (!stripe) return;
    const cs = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret",
    );
    if (!cs) return;
    stripe.retrievePaymentIntent(cs).then(({ paymentIntent }) => {
      if (paymentIntent?.status === "succeeded") toem();
    });
  }, [stripe, toem]);

  async function skicka(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSkickar(true);
    setFel("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${restaurang.url}/order/${orderId}`,
      },
    });

    // Vi kommer bara hit om betalningen inte krävde en omdirigering.
    // Lyckade betalningar landar på return_url i stället.
    if (error) {
      setFel(
        error.message ?? "Betalningen gick inte igenom. Försök igen.",
      );
      setSkickar(false);
    }
  }

  return (
    <form onSubmit={skicka} className="mt-8">
      <div className="rounded-jb border border-jb-linje bg-jb-yta p-5 sm:p-6">
        <p className="text-sm text-jb-dampad">
          Du betalar till{" "}
          <strong className="text-jb-text">{restaurang.namn}</strong>
        </p>

        <div className="mt-5">
          <PaymentElement onReady={() => setRedo(true)} />
        </div>

        {!redo ? (
          <div
            aria-busy="true"
            aria-label="Laddar betalsätt"
            className="mt-5 space-y-3"
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-jb bg-jb-yta-hog"
              />
            ))}
          </div>
        ) : null}
      </div>

      <Swishmarke />

      {fel ? (
        <p
          role="alert"
          className="mt-5 rounded-jb border border-jb-orange/50 bg-jb-orange/10 px-4 py-3 text-sm text-jb-text"
        >
          {fel}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || skickar}
        className="mt-6 w-full rounded-jb bg-jb-rosa px-6 py-4 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.99] disabled:opacity-60"
      >
        {skickar ? "Behandlar betalningen..." : "Slutför betalning"}
      </button>
    </form>
  );
}

/**
 * Stripes Swish-villkor kräver att Swish-märket visas i kassan.
 * Märket ritas här i stället för att laddas från en extern server, så att
 * det aldrig försvinner för att en URL slutar svara.
 */
function Swishmarke() {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-jb border border-jb-linje px-4 py-3">
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="Swish"
      >
        <defs>
          <linearGradient id="swish-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef2b2d" />
            <stop offset="50%" stopColor="#a3195b" />
            <stop offset="100%" stopColor="#4a1c8c" />
          </linearGradient>
        </defs>
        <path
          fill="url(#swish-g)"
          d="M20 3.5c-9.1 0-16.5 7.4-16.5 16.5 0 3.1.9 6.1 2.4 8.6l-2.1 7.9 8.1-2.1c2.4 1.3 5.2 2.1 8.1 2.1 9.1 0 16.5-7.4 16.5-16.5S29.1 3.5 20 3.5Zm0 5.6a11 11 0 0 1 9.6 5.7l-4.4 2.5a5.9 5.9 0 0 0-9.7-.6l-4.5-2.6A11 11 0 0 1 20 9.1Zm0 21.8a11 11 0 0 1-9.6-5.7l4.4-2.5a5.9 5.9 0 0 0 9.7.6l4.5 2.6a11 11 0 0 1-9 5Z"
        />
      </svg>
      <p className="text-sm text-jb-dampad">
        Betala med Swish eller kort. Väljer du Swish öppnas appen i din
        telefon.
      </p>
    </div>
  );
}

function Meddelande({ rubrik, text }: { rubrik: string; text: string }) {
  return (
    <div className="mt-8 rounded-jb border border-jb-orange/50 bg-jb-orange/10 px-5 py-6">
      <p className="jb-display text-xl text-jb-text">{rubrik}</p>
      <p className="mt-2 text-sm text-jb-dampad">{text}</p>
    </div>
  );
}
