import { describe, expect, it } from "vitest";
import { oppettider } from "@/data/restaurang";
import { restaurangJsonLd, tillScriptJson } from "./strukturerad-data";

describe("strukturerad data för Google", () => {
  const data = restaurangJsonLd();

  it("beskriver en restaurang med adress och telefon", () => {
    expect(data["@type"]).toBe("Restaurant");
    expect(data.address.addressLocality).toBe("Järna");
    expect(data.address.addressCountry).toBe("SE");
    expect(data.telephone).toMatch(/^\+46/);
  });

  it("har en öppettid per öppen dag", () => {
    const oppna = Object.values(oppettider).filter(Boolean).length;
    expect(data.openingHoursSpecification).toHaveLength(oppna);
  });

  it("skriver stängning efter midnatt som 01:00, inte 25:00", () => {
    const fredag = data.openingHoursSpecification.find((s) =>
      s.dayOfWeek.endsWith("Friday"),
    );
    expect(fredag?.closes).toBe("01:00");
    for (const s of data.openingHoursSpecification) {
      expect(s.opens).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      expect(s.closes).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }
  });

  it("kan aldrig stänga script-taggen i förtid", () => {
    const json = tillScriptJson({ namn: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("<");
    expect(JSON.parse(json).namn).toBe("</script><script>alert(1)</script>");
  });
});
