import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hamtaOrder,
  markeraBetald,
  skapaOrderMedNummer,
  uppdateraOrder,
} from "@/lib/db/orders";
import { rensaObetalda } from "./rensning";

// Minnesläge. Stripe är avstängt utom i testerna som slår på det.
const stripeMock = vi.hoisted(() => ({
  pa: false,
  retrieve: async (): Promise<{ status: string }> => ({ status: "canceled" }),
}));
vi.mock("@/lib/stripe", () => ({
  harStripe: () => stripeMock.pa,
  stripe: () => ({
    paymentIntents: {
      retrieve: () => stripeMock.retrieve(),
      cancel: async () => ({}),
    },
  }),
}));

afterEach(() => {
  stripeMock.pa = false;
});

const orderdata = {
  status: "vantar_betalning" as const,
  kundNamn: "Test",
  typ: "avhamtning" as const,
  rader: [],
  summaOren: 10000,
};

describe("rensning av obetalda beställningar", () => {
  it("raderar gamla obetalda men aldrig betalda", async () => {
    const obetald = await skapaOrderMedNummer(orderdata, () => "JB-7001");
    const betald = await skapaOrderMedNummer(orderdata, () => "JB-7002");
    await markeraBetald(betald.id, { betald: new Date(), betaldMed: "card" });

    const omTreDagar = new Date(Date.now() + 3 * 24 * 3_600_000);
    await rensaObetalda(omTreDagar);

    expect(await hamtaOrder(obetald.id)).toBeUndefined();
    expect(await hamtaOrder(betald.id)).toBeDefined();
  });

  it("låter färska obetalda vara, gästen kan fortfarande betala", async () => {
    const farsk = await skapaOrderMedNummer(orderdata, () => "JB-7003");
    await rensaObetalda(new Date());
    expect(await hamtaOrder(farsk.id)).toBeDefined();
  });

  it("raderar en order vars betalning inte finns i Stripe-kontot", async () => {
    // T.ex. en testorder från sandlådan efter bytet till skarpa nycklar.
    const gammal = await skapaOrderMedNummer(orderdata, () => "JB-7004");
    await uppdateraOrder(gammal.id, { stripePaymentIntentId: "pi_sandlada" });
    stripeMock.pa = true;
    stripeMock.retrieve = async () => {
      throw Object.assign(new Error("No such payment_intent"), {
        code: "resource_missing",
      });
    };

    await rensaObetalda(new Date(Date.now() + 3 * 24 * 3_600_000));
    expect(await hamtaOrder(gammal.id)).toBeUndefined();
  });

  it("låter ordern vara om Stripe inte svarar", async () => {
    const order = await skapaOrderMedNummer(orderdata, () => "JB-7005");
    await uppdateraOrder(order.id, { stripePaymentIntentId: "pi_natfel" });
    stripeMock.pa = true;
    stripeMock.retrieve = async () => {
      throw Object.assign(new Error("Timeout"), { code: undefined });
    };
    const fel = vi.spyOn(console, "error").mockImplementation(() => {});

    await rensaObetalda(new Date(Date.now() + 3 * 24 * 3_600_000));
    expect(await hamtaOrder(order.id)).toBeDefined();
    fel.mockRestore();
  });
});
