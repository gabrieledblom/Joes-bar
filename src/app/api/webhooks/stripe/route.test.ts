import { beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import {
  hamtaOrder,
  skapaOrderMedNummer,
  uppdateraOrder,
} from "@/lib/db/orders";

const HEMLIGHET = "whsec_testhemlighet";
process.env.STRIPE_WEBHOOK_SECRET = HEMLIGHET;

const riktigStripe = new Stripe("sk_test_ingen_riktig_nyckel");
vi.mock("@/lib/stripe", () => ({ stripe: () => riktigStripe }));

const skickaKvitto = vi.fn(async () => ({ epost: true, sms: false }));
vi.mock("@/lib/kvitto", () => ({ skickaKvitto: () => skickaKvitto() }));

const { POST } = await import("./route");

let nummer = 5000;
async function nyOrder(pi: string | null = "pi_test") {
  const order = await skapaOrderMedNummer(
    {
      status: "vantar_betalning",
      kundNamn: "Test",
      kundEpost: "test@example.se",
      typ: "avhamtning",
      rader: [],
      summaOren: 18300,
    },
    () => `JB-${nummer++}`,
  );
  if (pi) await uppdateraOrder(order.id, { stripePaymentIntentId: pi });
  return order;
}

function intent(over: Record<string, unknown> = {}) {
  return {
    id: "pi_test",
    object: "payment_intent",
    amount: 18300,
    amount_received: 18300,
    payment_method: null,
    metadata: {},
    ...over,
  };
}

async function skicka(typ: string, objekt: object, signaturHemlighet = HEMLIGHET) {
  const kropp = JSON.stringify({
    id: `evt_${Math.random().toString(36).slice(2)}`,
    object: "event",
    type: typ,
    data: { object: objekt },
  });
  const signatur = Stripe.webhooks.generateTestHeaderString({
    payload: kropp,
    secret: signaturHemlighet,
  });
  return POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": signatur },
      body: kropp,
    }),
  );
}

beforeEach(() => {
  skickaKvitto.mockClear();
});

describe("Stripe-webhooken", () => {
  it("flyttar en betald order till köket och skickar kvitto", async () => {
    const order = await nyOrder("pi_1");
    const svar = await skicka("payment_intent.succeeded", intent({ id: "pi_1" }));
    expect(svar.status).toBe(200);
    const efter = await hamtaOrder(order.id);
    expect(efter?.status).toBe("ny");
    expect(efter?.betald).toBeInstanceOf(Date);
    expect(skickaKvitto).toHaveBeenCalledOnce();
  });

  it("skickar bara ett kvitto när Stripe levererar samma händelse två gånger", async () => {
    await nyOrder("pi_2");
    await skicka("payment_intent.succeeded", intent({ id: "pi_2" }));
    await skicka("payment_intent.succeeded", intent({ id: "pi_2" }));
    expect(skickaKvitto).toHaveBeenCalledOnce();
  });

  it("avvisar en händelse med fel signatur och rör inte ordern", async () => {
    const order = await nyOrder("pi_3");
    const svar = await skicka(
      "payment_intent.succeeded",
      intent({ id: "pi_3" }),
      "whsec_fel",
    );
    expect(svar.status).toBe(400);
    expect((await hamtaOrder(order.id))?.status).toBe("vantar_betalning");
  });

  it("avvisar ett anrop helt utan signatur", async () => {
    const svar = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(svar.status).toBe(400);
  });

  it("hittar ordern via metadata om betalningens id inte hann sparas", async () => {
    const order = await nyOrder(null);
    await skicka(
      "payment_intent.succeeded",
      intent({ id: "pi_4", metadata: { orderId: order.id } }),
    );
    const efter = await hamtaOrder(order.id);
    expect(efter?.status).toBe("ny");
    expect(efter?.stripePaymentIntentId).toBe("pi_4");
  });

  it("tar emot betalningen även om ordern hunnit stängas", async () => {
    const order = await nyOrder("pi_5");
    await skicka("payment_intent.canceled", intent({ id: "pi_5" }));
    expect((await hamtaOrder(order.id))?.status).toBe("avbruten");
    await skicka("payment_intent.succeeded", intent({ id: "pi_5" }));
    expect((await hamtaOrder(order.id))?.status).toBe("ny");
  });

  it("stänger aldrig en redan betald order när betalningen sedan 'avbryts'", async () => {
    const order = await nyOrder("pi_6");
    await skicka("payment_intent.succeeded", intent({ id: "pi_6" }));
    await skicka("payment_intent.canceled", intent({ id: "pi_6" }));
    expect((await hamtaOrder(order.id))?.status).toBe("ny");
  });

  it("stänger ordern vid full återbetalning men inte vid delåterbetalning", async () => {
    const order = await nyOrder("pi_7");
    await skicka("payment_intent.succeeded", intent({ id: "pi_7" }));

    await skicka("charge.refunded", {
      id: "ch_1",
      object: "charge",
      payment_intent: "pi_7",
      amount: 18300,
      amount_refunded: 4700,
    });
    expect((await hamtaOrder(order.id))?.status).toBe("ny");

    await skicka("charge.refunded", {
      id: "ch_1",
      object: "charge",
      payment_intent: "pi_7",
      amount: 18300,
      amount_refunded: 18300,
    });
    expect((await hamtaOrder(order.id))?.status).toBe("avbruten");
  });

  it("svarar 200 på händelser den inte bryr sig om", async () => {
    const svar = await skicka("customer.created", { id: "cus_1" });
    expect(svar.status).toBe(200);
  });
});
