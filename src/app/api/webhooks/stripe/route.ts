import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { hamtaOrderViaPaymentIntent, uppdateraOrder } from "@/lib/db/orders";
import { skickaEpostKvitto } from "@/lib/kvitto/epost";
import { skickaSmsKvitto } from "@/lib/kvitto/sms";

export const runtime = "nodejs";

/**
 * Enda stället där en order blir betald. Klienten får aldrig markera en
 * order som betald - då skulle vem som helst kunna posta "betald" och få
 * mat gratis. Signaturen bevisar att anropet kommer från Stripe.
 *
 * VIKTIGT VID DRIFTSÄTTNING: STRIPE_WEBHOOK_SECRET kan bara skapas efter
 * första deployen, när den riktiga URL:en finns. Utan den svarar den här
 * endpointen 500 och betalningar går igenom utan att någon order når köket.
 * Se README, avsnitt "Driftsättning i rätt ordning".
 */
export async function POST(request: Request) {
  const hemlighet = process.env.STRIPE_WEBHOOK_SECRET;
  if (!hemlighet) {
    console.error("STRIPE_WEBHOOK_SECRET saknas. Webhooken kan inte verifieras.");
    return NextResponse.json({ fel: "Webhook inte konfigurerad" }, { status: 500 });
  }

  const signatur = request.headers.get("stripe-signature");
  if (!signatur) {
    return NextResponse.json({ fel: "Signatur saknas" }, { status: 400 });
  }

  const raKropp = await request.text();

  let handelse: Stripe.Event;
  try {
    handelse = stripe().webhooks.constructEvent(raKropp, signatur, hemlighet);
  } catch (error) {
    console.error("Webhooksignaturen gick inte att verifiera", error);
    return NextResponse.json({ fel: "Ogiltig signatur" }, { status: 400 });
  }

  try {
    switch (handelse.type) {
      case "payment_intent.succeeded":
        await hanteraBetald(handelse.data.object);
        break;
      case "payment_intent.payment_failed":
      case "payment_intent.canceled":
        await hanteraAvbruten(handelse.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    // 500 får Stripe att försöka igen. Bättre en dubblett vi kan hantera
    // än en betald order som aldrig nådde köket.
    console.error(`Kunde inte hantera ${handelse.type}`, error);
    return NextResponse.json({ fel: "Kunde inte hanteras" }, { status: 500 });
  }

  return NextResponse.json({ mottagen: true });
}

async function hanteraBetald(intent: Stripe.PaymentIntent) {
  const order = await hamtaOrderViaPaymentIntent(intent.id);
  if (!order) {
    console.error(`Ingen order hittad för PaymentIntent ${intent.id}`);
    return;
  }

  // Stripe kan leverera samma händelse flera gånger. Utan den här spärren
  // får gästen ett nytt sms varje gång.
  if (order.status !== "vantar_betalning") return;

  const uppdaterad = await uppdateraOrder(order.id, {
    status: "ny",
    betald: new Date(),
    betaldMed: intent.payment_method_types?.[0] ?? null,
  });
  if (!uppdaterad) return;

  // Kvittona får inte fälla webhooken: ordern är betald och ligger i köket
  // även om ett sms fastnar hos operatören.
  const [epost, sms] = await Promise.allSettled([
    skickaEpostKvitto(uppdaterad),
    skickaSmsKvitto(uppdaterad),
  ]);

  await uppdateraOrder(order.id, {
    kvittoEpostSkickat:
      epost.status === "fulfilled" && epost.value ? new Date() : null,
    kvittoSmsSkickat:
      sms.status === "fulfilled" && sms.value ? new Date() : null,
  });
}

async function hanteraAvbruten(intent: Stripe.PaymentIntent) {
  const order = await hamtaOrderViaPaymentIntent(intent.id);
  if (!order || order.status !== "vantar_betalning") return;
  await uppdateraOrder(order.id, { status: "avbruten" });
}
