import { describe, expect, it } from "vitest";
import { hamtaOrder, markeraBetald, skapaOrderMedNummer } from "@/lib/db/orders";
import { rensaObetalda } from "./rensning";

// Minnesläge och ingen Stripe-nyckel: rensningen rör bara vår egen databas.
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
});
