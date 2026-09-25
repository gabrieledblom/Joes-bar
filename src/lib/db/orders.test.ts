import { describe, expect, it } from "vitest";
import {
  hamtaKoksordrar,
  hamtaOrder,
  markeraBetald,
  skapaOrderMedNummer,
  uppdateraOrder,
} from "./orders";

// Utan DATABASE_URL körs orderlagret i minnesläge, samma kod som i drift.
const orderdata = {
  status: "vantar_betalning" as const,
  kundNamn: "Test",
  typ: "avhamtning" as const,
  rader: [],
  summaOren: 10000,
};

describe("ordernummer", () => {
  it("drar ett nytt nummer om det första redan är taget", async () => {
    await skapaOrderMedNummer(orderdata, () => "JB-1111");
    const nummer = ["JB-1111", "JB-2222"];
    const order = await skapaOrderMedNummer(orderdata, () => nummer.shift()!);
    expect(order.ordernummer).toBe("JB-2222");
  });

  it("ger upp i stället för att loopa för evigt", async () => {
    await skapaOrderMedNummer(orderdata, () => "JB-3333");
    await expect(
      skapaOrderMedNummer(orderdata, () => "JB-3333", 5),
    ).rejects.toThrow(/ordernummer/);
  });
});

describe("hamtaOrder", () => {
  it("svarar 'finns inte' på en felskriven länk i stället för att krascha", async () => {
    expect(await hamtaOrder("abc")).toBeUndefined();
    expect(await hamtaOrder("../../etc")).toBeUndefined();
  });
});

describe("köksskärmen", () => {
  it("visar en order som skapades i förrgår men betalades nyss", async () => {
    const order = await skapaOrderMedNummer(orderdata, () => "JB-8001");
    await uppdateraOrder(order.id, {
      skapad: new Date(Date.now() - 2 * 24 * 3_600_000),
    });
    await markeraBetald(order.id, { betald: new Date(), betaldMed: "swish" });
    const ordrar = await hamtaKoksordrar();
    expect(ordrar.map((o) => o.id)).toContain(order.id);
  });
});

describe("markeraBetald", () => {
  it("släpper bara igenom första leveransen från Stripe", async () => {
    const order = await skapaOrderMedNummer(orderdata, () => "JB-4444");
    const data = { betald: new Date(), betaldMed: "card" };

    const forsta = await markeraBetald(order.id, data);
    const andra = await markeraBetald(order.id, data);

    expect(forsta?.status).toBe("ny");
    expect(andra).toBeUndefined();
  });

  it("tar emot en betalning även om ordern hunnit avbrytas", async () => {
    // Har Stripe dragit pengarna ska maten lagas - även om ordern t.ex.
    // stängts efter ett nekat kort innan gästen betalade med ett annat.
    const order = await skapaOrderMedNummer(orderdata, () => "JB-5555");
    await uppdateraOrder(order.id, { status: "avbruten" });
    const betald = await markeraBetald(order.id, {
      betald: new Date(),
      betaldMed: "card",
    });
    expect(betald?.status).toBe("ny");
  });

  it("väcker aldrig liv i en återbetald order", async () => {
    const order = await skapaOrderMedNummer(orderdata, () => "JB-6666");
    await uppdateraOrder(order.id, { status: "avbruten", betald: new Date() });
    expect(
      await markeraBetald(order.id, { betald: new Date(), betaldMed: null }),
    ).toBeUndefined();
  });
});
