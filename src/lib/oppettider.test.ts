import { describe, expect, it } from "vitest";
import {
  formateraKlockslag,
  kanBestalla,
  oppetStatus,
  stockholmstid,
} from "./oppettider";

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
  it("är öppet på måndagar", () => {
    // Måndag 2026-07-06 16:00 i Järna, öppet 11:00-21:00
    const status = oppetStatus(utc("2026-07-06T14:00:00Z"));
    expect(status.oppet).toBe(true);
    expect(status.stangerKl).toBe("21:00");
  });

  it("är stängt på natten mellan två pass", () => {
    // Måndag 03:00 i Järna - söndagen stängde 21:00, måndagen öppnar 11:00
    const status = oppetStatus(utc("2026-07-06T01:00:00Z"));
    expect(status.oppet).toBe(false);
    expect(status.oppnarKl).toBe("11:00");
  });

  it("är öppet en onsdag eftermiddag", () => {
    // Onsdag 18:00 i Järna, öppet 11:00-21:00
    const status = oppetStatus(utc("2026-07-01T16:00:00Z"));
    expect(status.oppet).toBe(true);
    expect(status.stangerKl).toBe("21:00");
  });

  it("är stängt precis innan öppning", () => {
    // Onsdag 10:59 i Järna
    const status = oppetStatus(utc("2026-07-01T08:59:00Z"));
    expect(status.oppet).toBe(false);
    expect(status.oppnarKl).toBe("11:00");
  });

  it("är öppet i samma minut som öppning", () => {
    // Onsdag 11:00 i Järna
    expect(oppetStatus(utc("2026-07-01T09:00:00Z")).oppet).toBe(true);
  });

  it("är stängt i samma minut som stängning", () => {
    // Onsdag 21:00 i Järna
    expect(oppetStatus(utc("2026-07-01T19:00:00Z")).oppet).toBe(false);
  });

  it("har olika öppning på helgen", () => {
    // Lördag 11:30 i Järna - lördagen öppnar först 12:00
    const lordag = oppetStatus(utc("2026-07-04T09:30:00Z"));
    expect(lordag.oppet).toBe(false);
    expect(lordag.oppnarKl).toBe("12:00");
    // Söndag 11:30 i Järna - söndagen öppnar också 12:00
    const sondag = oppetStatus(utc("2026-07-05T09:30:00Z"));
    expect(sondag.oppet).toBe(false);
    expect(sondag.oppnarKl).toBe("12:00");
    // Söndag 12:00 - öppet, stänger 21:00
    const oppet = oppetStatus(utc("2026-07-05T10:00:00Z"));
    expect(oppet.oppet).toBe(true);
    expect(oppet.stangerKl).toBe("21:00");
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
    // Lördag 02:00 i Järna, lördagen öppnar 12:00
    const status = oppetStatus(utc("2026-07-04T00:00:00Z"));
    expect(status.oppet).toBe(false);
    expect(status.oppnarKl).toBe("12:00");
  });
});

describe("andel genom passet", () => {
  it("börjar nära noll vid öppning", () => {
    // Onsdag 11:05 i Järna
    const status = oppetStatus(utc("2026-07-01T09:05:00Z"));
    expect(status.andel).toBeLessThan(0.05);
  });

  it("slutar nära ett strax före stängning", () => {
    // Onsdag 20:50 i Järna
    const status = oppetStatus(utc("2026-07-01T18:50:00Z"));
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

describe("kanBestalla", () => {
  it("tar emot ordrar mitt i ett pass", () => {
    // Onsdag 18:00 i Järna
    expect(kanBestalla(utc("2026-07-01T16:00:00Z")).ok).toBe(true);
  });

  it("tar emot ordrar en måndag", () => {
    // Måndag 16:00 i Järna
    expect(kanBestalla(utc("2026-07-06T14:00:00Z")).ok).toBe(true);
  });

  it("stoppar ordrar på natten och säger när det öppnar", () => {
    // Måndag 03:00 i Järna
    const svar = kanBestalla(utc("2026-07-06T01:00:00Z"));
    expect(svar.ok).toBe(false);
    expect(svar.meddelande).toMatch(/stängt/);
    expect(svar.meddelande).toMatch(/11:00/);
  });

  it("stoppar ordrar mitt i natten", () => {
    // Onsdag 03:00 i Järna
    expect(kanBestalla(utc("2026-07-01T01:00:00Z")).ok).toBe(false);
  });

  it("stoppar ordrar strax före stängning", () => {
    // Onsdag 20:50 i Järna, stänger 21:00
    const svar = kanBestalla(utc("2026-07-01T18:50:00Z"));
    expect(svar.ok).toBe(false);
    expect(svar.meddelande).toMatch(/21:00/);
  });

  it("räknar minuterna kvar även efter midnatt", () => {
    // Lördag 00:50 i Järna, fredagspasset stänger 01:00
    expect(kanBestalla(utc("2026-07-03T22:50:00Z")).ok).toBe(false);
    // Lördag 00:15 i Järna - 45 minuter kvar
    expect(kanBestalla(utc("2026-07-03T22:15:00Z")).ok).toBe(true);
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
