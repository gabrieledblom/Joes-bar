import { NextResponse } from "next/server";
import { hamtaOrder, uppdateraOrder } from "@/lib/db/orders";
import { harStripe, stripe } from "@/lib/stripe";
import { skickaEpostAterbetald } from "@/lib/kvitto/epost";
import { skickaSmsAterbetald } from "@/lib/kvitto/sms";

export const runtime = "nodejs";

/**
 * Köket avbryter en betald order och betalar tillbaka hela beloppet via
 * Stripe. Delåterbetalningar görs i Stripes dashboard.
 *
 * En återbetald order får status "avbruten" men behåller sitt betald-datum:
 * så skiljs den från en order som aldrig betalades, och bokföringen ser
 * både betalningen och återbetalningen.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await hamtaOrder(id);
  if (!order) {
    return NextResponse.json({ fel: "Ordern finns inte." }, { status: 404 });
  }
  if (!order.betald) {
    return NextResponse.json({ fel: "Ordern är inte betald." }, { status: 409 });
  }
  if (order.status === "avbruten") {
    return NextResponse.json({ status: "avbruten" });
  }
  if (!order.stripePaymentIntentId || !harStripe()) {
    return NextResponse.json(
      { fel: "Återbetalningen går inte att göra härifrån. Gör den i Stripe." },
      { status: 503 },
    );
  }

  try {
    // Samma nyckel vid dubbelklick eller omförsök: Stripe gör då bara en
    // återbetalning, aldrig två.
    await stripe().refunds.create(
      { payment_intent: order.stripePaymentIntentId },
      { idempotencyKey: `aterbetala-${order.id}` },
    );
  } catch (fel) {
    const kod = (fel as { code?: string }).code;
    if (kod !== "charge_already_refunded") {
      console.error(`Återbetalning misslyckades för ${order.ordernummer}`, fel);
      return NextResponse.json(
        {
          fel: "Stripe kunde inte betala tillbaka. Försök igen eller gör det i Stripe.",
        },
        { status: 502 },
      );
    }
  }

  const uppdaterad = await uppdateraOrder(id, { status: "avbruten" });
  if (uppdaterad) {
    // Meddelandet till gästen får inte fälla återbetalningen, som redan är gjord.
    await Promise.allSettled([
      skickaSmsAterbetald(uppdaterad),
      skickaEpostAterbetald(uppdaterad),
    ]);
  }

  return NextResponse.json({ status: "avbruten" });
}
