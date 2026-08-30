import { describe, expect, it } from "vitest";
import {
  garAttBestalla,
  kategorier,
  menyn,
  ratterIKategori,
} from "./menu-data";

describe("menyns data", () => {
  it("har unika id:n", () => {
    const idn = menyn.map((r) => r.id);
    expect(new Set(idn).size).toBe(idn.length);
  });

  it("har bara kategorier som finns i listan", () => {
    const kanda = new Set(kategorier.map((k) => k.id));
    for (const ratt of menyn) {
      expect(kanda.has(ratt.kategori)).toBe(true);
    }
  });

  it("har namn och beskrivning på varje rätt", () => {
    for (const ratt of menyn) {
      expect(ratt.namn.length).toBeGreaterThan(0);
      expect(ratt.beskrivning.length).toBeGreaterThan(0);
    }
  });

  it("har bara positiva heltalspriser eller null", () => {
    for (const ratt of menyn) {
      if (ratt.pris === null) continue;
      expect(Number.isInteger(ratt.pris)).toBe(true);
      expect(ratt.pris).toBeGreaterThan(0);
    }
  });

  it("har rätter i varje kategori", () => {
    for (const kategori of kategorier) {
      expect(ratterIKategori(kategori.id).length).toBeGreaterThan(0);
    }
  });
});

describe("garAttBestalla", () => {
  it("stoppar rätter utan pris", () => {
    const utanPris = menyn.find((r) => r.pris === null)!;
    expect(garAttBestalla(utanPris)).toBe(false);
  });

  it("släpper igenom prissatta rätter i lager", () => {
    const medPris = menyn.find((r) => r.pris !== null && r.tillganglig)!;
    expect(garAttBestalla(medPris)).toBe(true);
  });
});
