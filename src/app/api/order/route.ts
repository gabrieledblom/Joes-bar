import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe, harStripe } from "@/lib/stripe";
import { skapaOrder, uppdateraOrder } from "@/lib/db/orders";
import { nyttOrdernummer } from "@/lib/ordernummer";
import {
  kravKontaktvag,
  kundordersSchema,
  OrderFel,
  valideraOchRaknaOm,
} from "@/lib/order-validering";
import { bestallning, restaurang } from "@/data/restaurang";

export const runtime = "nodejs";

/**
 * Skapar ordern i läget "vantar_betalning" och returnerar en PaymentIntent
 * att betala med. Ordern når aldrig köksskärmen härifrån: först när Stripes
 * webhook bekräftar betalningen flyttas den till "ny". Annars skulle en
 * avbruten betalning ge köket mat att laga som ingen betalat för.
 */
export async function POST(request: Request) {
  if (!bestallning.aktiv) {
    return NextResponse.json(
      { fel: "Onlinebeställning är tillfälligt stängd." },
      { status: 503 },
    );
  }

  let kropp: unknown;
  try {
    kropp = await request.json();
  } catch {
    return NextResponse.json({ fel: "Ogiltig begäran." }, { status: 400 });
  }

  const tolkad = kundordersSchema.safeParse(kropp);
  if (!tolkad.success) {
    const forsta = tolkad.error.issues[0];
    return NextResponse.json(
      { fel: forsta?.message ?? "Kontrollera uppgifterna." },
      { status: 400 },
    );
  }

  try {
    // Uppgifterna kontrolleras före Stripe, så att ett tomt telefonfält ger
    // ett begripligt fel även innan betalningen är konfigurerad.
    const { telefon, epost } = kravKontaktvag(tolkad.data);
    const { rader, summaOren } = valideraOchRaknaOm(tolkad.data);

    if (!harStripe()) {
      return NextResponse.json(
        {
          fel: "Betalningen är inte konfigurerad än. Ring oss så tar vi din beställning.",
        },
        { status: 503 },
      );
    }

    const ordernummer = nyttOrdernummer();

    const order = await skapaOrder({
      ordernummer,
      status: "vantar_betalning",
      kundNamn: tolkad.data.namn,
      kundTelefon: telefon,
      kundEpost: epost,
      typ: tolkad.data.typ,
      bordsnummer: tolkad.data.typ === "bord" ? tolkad.data.bordsnummer : null,
      notering: tolkad.data.notering || null,
      rader,
      summaOren,
    });

    const paymentIntent = await stripe().paymentIntents.create({
      amount: summaOren,
      currency: bestallning.valuta,
      // Vilka metoder som visas styrs i Stripe Dashboard under Payment
      // methods. Både Kort och Swish måste vara påslagna där.
      automatic_payment_methods: { enabled: true },
      // Syns för gästen i bankappen och i Swish. Stripes Swish-villkor
      // kräver att företagsnamnet framgår vid betalningen.
      statement_descriptor_suffix: "JOES BAR",
      description: `${restaurang.namn} order ${ordernummer}`,
      metadata: {
        orderId: order.id,
        ordernummer,
      },
    });

    await uppdateraOrder(order.id, {
      stripePaymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      orderId: order.id,
      ordernummer,
      clientSecret: paymentIntent.client_secret,
      summaOren,
    });
  } catch (error) {
    if (error instanceof OrderFel) {
      return NextResponse.json({ fel: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { fel: "Kontrollera uppgifterna." },
        { status: 400 },
      );
    }
    console.error("Kunde inte skapa order", error);
    return NextResponse.json(
      { fel: "Något gick fel. Försök igen eller ring oss." },
      { status: 500 },
    );
  }
}
