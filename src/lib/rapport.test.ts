import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/db/schema";
import { sammanstall, tillCsv } from "./rapport";

function order(over: Partial<Order>): Order {
  return {
    id: crypto.randomUUID(),
    ordernummer: "JB-1234",
    status: "levererad",
    kundNamn: "Elin",
    kundTelefon: "+46704128831",
    kundEpost: null,
    typ: "avhamtning",
    bordsnummer: null,
    notering: null,
    rader: [{ rattId: "pizza-capri", namn: "Capri", antal: 2, styckprisOren: 12100, notering: "" }],
    summaOren: 24200,
    stripePaymentIntentId: "pi_1",
    betaldMed: "swish",
    kvittoEpostSkickat: null,
    kvittoSmsSkickat: null,
    skapad: new Date("2026-09-25T15:00:00Z"),
    betald: new Date("2026-09-25T15:01:00Z"),
    uppdaterad: new Date("2026-09-25T15:30:00Z"),
    ...over,
  };
}

describe("dagsrapport", () => {
  it("räknar netto per betalsätt och håller isär återbetalningar", () => {
    const rapport = sammanstall([
      order({ summaOren: 24200, betaldMed: "swish" }),
      order({ summaOren: 11300, betaldMed: "card" }),
      order({ summaOren: 14700, betaldMed: "card", status: "avbruten" }),
      order({ summaOren: 9900, betald: null, status: "avbruten" }),
    ]);
    expect(rapport.antalBetalda).toBe(2);
    expect(rapport.nettoOren).toBe(35500);
    expect(rapport.antalAterbetalda).toBe(1);
    expect(rapport.aterbetaltOren).toBe(14700);
    expect(rapport.perBetalsatt).toEqual({ Swish: 24200, Kort: 11300 });
  });
});

describe("csv-export", () => {
  it("är läsbar i svenska Excel och saknar personuppgifter", () => {
    const csv = tillCsv([order({})]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("2026-09-25;17:01;JB-1234;Betald;Swish;242,00;2x Capri");
    expect(csv).not.toContain("Elin");
    expect(csv).not.toContain("+46704128831");
  });
});
