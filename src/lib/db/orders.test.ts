import { describe, expect, it } from "vitest";
import {
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

describe("markeraBetald", () => {
  it("släpper bara igenom första leveransen från Stripe", async () => {
    const order = await skapaOrderMedNummer(orderdata, () => "JB-4444");
    const data = { betald: new Date(), betaldMed: "card" };

    const forsta = await markeraBetald(order.id, data);
    const andra = await markeraBetald(order.id, data);

    expect(forsta?.status).toBe("ny");
    expect(andra).toBeUndefined();
  });

  it("rör inte en avbruten order", async () => {
    const order = await skapaOrderMedNummer(orderdata, () => "JB-5555");
    await uppdateraOrder(order.id, { status: "avbruten" });
    expect(
      await markeraBetald(order.id, { betald: new Date(), betaldMed: null }),
    ).toBeUndefined();
  });
});
