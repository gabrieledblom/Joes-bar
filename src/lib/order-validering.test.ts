import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  kravKontaktvag,
  kundordersSchema,
  normaliseraTelefon,
  OrderFel,
  valideraOchRaknaOm,
} from "./order-validering";
import { hittaRatt } from "@/data/menu-data";

// Hela den riktiga menyn är numera fullt prissatt, så testet för "rätt utan
// pris" nedan kan inte längre peka på en riktig rätt. I stället läggs en
// påhittad, oprissatt rätt in vid sidan av den riktiga menyn - spärren mot
// att beställa något utan pris måste fungera igen nästa gång en ny rätt
// läggs in innan priset är klart.
vi.mock("@/data/menu-data", async (importOriginal) => {
  const verklig = await importOriginal<typeof import("@/data/menu-data")>();
  const testRattUtanPris = {
    id: "test-utan-pris",
    kategori: "sides" as const,
    namn: "Test utan pris",
    beskrivning: "Bara för test",
    pris: null,
    tillganglig: true,
  };
  return {
    ...verklig,
    hittaRatt: (id: string) =>
      id === testRattUtanPris.id ? testRattUtanPris : verklig.hittaRatt(id),
  };
});

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

describe("side till smash-burgare", () => {
  it("lägger på sidens pris på burgarens styckpris", () => {
    const { rader, summaOren } = valideraOchRaknaOm(
      order({
        rader: [
          { rattId: "burgare-joes-og", antal: 1, sideId: "side-pommes" },
        ],
      }),
    );
    // Joe's OG kostar 147 kr, Pommes 47 kr.
    expect(rader[0].styckprisOren).toBe(19400);
    expect(rader[0].sideNamn).toBe("Pommes");
    expect(summaOren).toBe(19400);
  });

  it("går bra utan side ('bara burgare')", () => {
    const { rader } = valideraOchRaknaOm(
      order({ rader: [{ rattId: "burgare-joes-og", antal: 1 }] }),
    );
    expect(rader[0].styckprisOren).toBe(14700);
    expect(rader[0].sideNamn).toBeUndefined();
  });

  it("avvisar en side till en rätt som inte har sideval", () => {
    expect(() =>
      valideraOchRaknaOm(
        order({
          rader: [
            { rattId: "pizza-the-classic", antal: 1, sideId: "side-pommes" },
          ],
        }),
      ),
    ).toThrow(/side/);
  });

  it("avvisar en side som inte finns", () => {
    expect(() =>
      valideraOchRaknaOm(
        order({
          rader: [
            { rattId: "burgare-joes-og", antal: 1, sideId: "hittepa" },
          ],
        }),
      ),
    ).toThrow(OrderFel);
  });
});

describe("ris eller pommes till Tallrik", () => {
  it("kräver ett val av tillbehör", () => {
    expect(() =>
      valideraOchRaknaOm(
        order({
          rader: [{ rattId: "kebab-tallrik", antal: 1, protein: "Kebab" }],
        }),
      ),
    ).toThrow(/ris eller pommes/i);
  });

  it("släpper igenom med protein och tillbehör valda", () => {
    const { rader } = valideraOchRaknaOm(
      order({
        rader: [
          {
            rattId: "kebab-tallrik",
            antal: 1,
            protein: "Gyros",
            tillbehor: "Ris",
          },
        ],
      }),
    );
    expect(rader[0].tillbehor).toBe("Ris");
  });
});

describe("rätter som inte går att beställa", () => {
  it("avvisar en rätt utan pris", () => {
    expect(() =>
      valideraOchRaknaOm(
        order({ rader: [{ rattId: "test-utan-pris", antal: 1 }] }),
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
