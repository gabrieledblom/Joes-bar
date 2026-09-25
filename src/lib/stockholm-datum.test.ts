import { describe, expect, it } from "vitest";
import {
  dygnetsGranser,
  manadensGranser,
  stockholmDatum,
  stockholmKlockslag,
} from "./stockholm-datum";

describe("kalenderdagar i Järna", () => {
  it("börjar dygnet vid svensk midnatt på sommaren", () => {
    const { fran, till } = dygnetsGranser("2026-07-03");
    expect(fran.toISOString()).toBe("2026-07-02T22:00:00.000Z");
    expect(till.toISOString()).toBe("2026-07-03T22:00:00.000Z");
  });

  it("börjar dygnet vid svensk midnatt på vintern", () => {
    const { fran } = dygnetsGranser("2026-01-15");
    expect(fran.toISOString()).toBe("2026-01-14T23:00:00.000Z");
  });

  it("räknar en betalning 00:30 till nästa kalenderdag", () => {
    const tid = new Date("2026-07-03T22:30:00Z"); // lördag 00:30
    expect(stockholmDatum(tid)).toBe("2026-07-04");
    expect(stockholmKlockslag(tid)).toBe("00:30");
  });

  it("klarar dygnet när sommartiden slutar", () => {
    // 25 oktober 2026 har 25 timmar i Sverige.
    const { fran, till } = dygnetsGranser("2026-10-25");
    expect((till.getTime() - fran.getTime()) / 3_600_000).toBe(25);
  });

  it("ger en hel månad", () => {
    const { fran, till } = manadensGranser("2026-09");
    expect(fran.toISOString()).toBe("2026-08-31T22:00:00.000Z");
    expect(till.toISOString()).toBe("2026-09-30T22:00:00.000Z");
  });
});
