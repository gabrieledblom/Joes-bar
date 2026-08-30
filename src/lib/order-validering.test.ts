import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  kravKontaktvag,
  kundordersSchema,
  normaliseraTelefon,
  OrderFel,
  valideraOchRaknaOm,
} from "./order-validering";
import { hittaRatt } from "@/data/menu-data";

type Inmatning = Partial<z.input<typeof kundordersSchema>>;

function order(over: Inmatning = {}) {
  return kundordersSchema.parse({
    namn: "Elin Sandberg",
    telefon: "070-412 88 31",
    epost: "",
    typ: "avhamtning",
    bordsnummer: null,
    notering: "",
    rader: [{ rattId: "pizza-the-classic", antal: 2 }],
    ...over,
  });
}

describe("prisberäkning på servern", () => {
  it("räknar om priset från menyn, inte från klienten", () => {
    const { summaOren, rader } = valideraOchRaknaOm(order());
    // The Classic kostar 113 kr, två stycken.
    expect(summaOren).toBe(22600);
    expect(rader[0].styckprisOren).toBe(11300);
  });

  it("fryser rättens namn och pris på ordern", () => {
    const { rader } = valideraOchRaknaOm(order());
    expect(rader[0].namn).toBe(hittaRatt("pizza-the-classic")!.namn);
  });

  it("summerar flera rader", () => {
    const { summaOren } = valideraOchRaknaOm(
      order({
        rader: [
          { rattId: "pizza-the-classic", antal: 1 },
          { rattId: "side-pommes", antal: 3 },
        ],
      }),
    );
    expect(summaOren).toBe(11300 + 3 * 4700);
  });
});

describe("rätter som inte går att beställa", () => {
  it("avvisar en rätt utan pris", () => {
    expect(() =>
      valideraOchRaknaOm(
        order({ rader: [{ rattId: "burgare-joes-original", antal: 1 }] }),
      ),
    ).toThrow(OrderFel);
  });

  it("avvisar en rätt som inte finns", () => {
    expect(() =>
      valideraOchRaknaOm(order({ rader: [{ rattId: "hittepa", antal: 1 }] })),
    ).toThrow(OrderFel);
  });

  it("kräver protein till kebabrätter", () => {
    expect(() =>
      valideraOchRaknaOm(order({ rader: [{ rattId: "kebab-rulle", antal: 1 }] })),
    ).toThrow(/Välj protein/);
  });

  it("släpper igenom kebab med valt protein", () => {
    const { rader } = valideraOchRaknaOm(
      order({
        rader: [{ rattId: "kebab-rulle", antal: 1, protein: "Falafel" }],
      }),
    );
    expect(rader[0].protein).toBe("Falafel");
  });
});

describe("bordsbeställning", () => {
  it("kräver bordsnummer", () => {
    expect(() =>
      valideraOchRaknaOm(order({ typ: "bord", bordsnummer: null })),
    ).toThrow(/bordsnummer/i);
  });

  it("accepterar ett giltigt bordsnummer", () => {
    expect(() =>
      valideraOchRaknaOm(order({ typ: "bord", bordsnummer: 7 })),
    ).not.toThrow();
  });
});

describe("telefonnummer", () => {
  it.each([
    ["070-412 88 31", "+46704128831"],
    ["0704128831", "+46704128831"],
    ["+46 70 412 88 31", "+46704128831"],
    ["0046704128831", "+46704128831"],
  ])("normaliserar %s", (inmatning, forvantat) => {
    expect(normaliseraTelefon(inmatning)).toBe(forvantat);
  });

  it("avvisar skräp", () => {
    expect(normaliseraTelefon("hej")).toBeNull();
  });
});

describe("kontaktväg för kvittot", () => {
  it("kräver telefon eller e-post", () => {
    expect(() => kravKontaktvag(order({ telefon: "", epost: "" }))).toThrow(
      OrderFel,
    );
  });

  it("godtar bara e-post", () => {
    const { epost, telefon } = kravKontaktvag(
      order({ telefon: "", epost: "Elin@Example.SE" }),
    );
    expect(epost).toBe("elin@example.se");
    expect(telefon).toBeNull();
  });

  it("avvisar ett ifyllt men trasigt nummer", () => {
    expect(() =>
      kravKontaktvag(order({ telefon: "12", epost: "elin@example.se" })),
    ).toThrow(/Mobilnumret/);
  });
});
