import { describe, expect, it } from "vitest";
import { formateraKlockslag, oppetStatus, stockholmstid } from "./oppettider";

/**
 * Tiderna anges i UTC och räknas om till Järna. Sommartid i Sverige är
 * UTC+2, vintertid UTC+1, så testerna anger UTC-tiden som ger önskad
 * svensk klockslag.
 */
function utc(iso: string): Date {
  return new Date(iso);
}

describe("stockholmstid", () => {
  it("räknar om från UTC till svensk sommartid", () => {
    // Onsdag 2026-07-01 12:00 UTC = 14:00 i Järna
    const { dag, minut } = stockholmstid(utc("2026-07-01T12:00:00Z"));
    expect(dag).toBe("wed");
    expect(minut).toBe(14 * 60);
  });

  it("räknar om från UTC till svensk vintertid", () => {
    // Onsdag 2026-01-07 12:00 UTC = 13:00 i Järna
    const { minut } = stockholmstid(utc("2026-01-07T12:00:00Z"));
    expect(minut).toBe(13 * 60);
  });

  it("ger rätt veckodag när svensk tid passerat midnatt men UTC inte har", () => {
    // Fredag 23:30 UTC = lördag 01:30 i Järna (sommartid)
    const { dag } = stockholmstid(utc("2026-07-03T23:30:00Z"));
    expect(dag).toBe("sat");
  });
});

describe("öppet eller stängt", () => {
  it("är stängt på måndagar", () => {
    // Måndag 2026-07-06 16:00 i Järna
    const status = oppetStatus(utc("2026-07-06T14:00:00Z"));
    expect(status.oppet).toBe(false);
  });

  it("är öppet en onsdag eftermiddag", () => {
    // Onsdag 18:00 i Järna, öppet 14:30-23:00
    const status = oppetStatus(utc("2026-07-01T16:00:00Z"));
    expect(status.oppet).toBe(true);
    expect(status.stangerKl).toBe("23:00");
  });

  it("är stängt precis innan öppning", () => {
    // Onsdag 14:00 i Järna
    const status = oppetStatus(utc("2026-07-01T12:00:00Z"));
    expect(status.oppet).toBe(false);
    expect(status.oppnarKl).toBe("14:30");
  });

  it("är öppet i samma minut som öppning", () => {
    // Onsdag 14:30 i Järna
    expect(oppetStatus(utc("2026-07-01T12:30:00Z")).oppet).toBe(true);
  });

  it("är stängt i samma minut som stängning", () => {
    // Onsdag 23:00 i Järna
    expect(oppetStatus(utc("2026-07-01T21:00:00Z")).oppet).toBe(false);
  });
});

describe("stängning efter midnatt", () => {
  it("räknar natt mot lördag som fredagens pass", () => {
    // Lördag 00:15 i Järna, fredagen stänger 01:00
    const status = oppetStatus(utc("2026-07-03T22:15:00Z"));
    expect(status.oppet).toBe(true);
    expect(status.stangerKl).toBe("01:00");
  });

  it("är stängt efter att fredagspasset tagit slut", () => {
    // Lördag 02:00 i Järna, lördagen öppnar 13:00
    const status = oppetStatus(utc("2026-07-04T00:00:00Z"));
    expect(status.oppet).toBe(false);
    expect(status.oppnarKl).toBe("13:00");
  });
});

describe("andel genom passet", () => {
  it("börjar nära noll vid öppning", () => {
    const status = oppetStatus(utc("2026-07-01T12:35:00Z"));
    expect(status.andel).toBeLessThan(0.05);
  });

  it("slutar nära ett strax före stängning", () => {
    // Onsdag 22:50 i Järna
    const status = oppetStatus(utc("2026-07-01T20:50:00Z"));
    expect(status.andel).toBeGreaterThan(0.95);
  });

  it("håller sig alltid inom 0 och 1", () => {
    for (let timme = 0; timme < 24; timme++) {
      const status = oppetStatus(
        utc(`2026-07-01T${String(timme).padStart(2, "0")}:00:00Z`),
      );
      expect(status.andel).toBeGreaterThanOrEqual(0);
      expect(status.andel).toBeLessThanOrEqual(1);
    }
  });
});

describe("formateraKlockslag", () => {
  it("visar 25:00 som 01:00", () => {
    expect(formateraKlockslag(25 * 60)).toBe("01:00");
  });

  it("lämnar vanliga tider orörda", () => {
    expect(formateraKlockslag(14 * 60 + 30)).toBe("14:30");
  });
});
