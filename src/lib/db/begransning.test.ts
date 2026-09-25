import { describe, expect, it } from "vitest";
import { antalForsok, nollstallForsok, registreraForsok } from "./begransning";

describe("begränsning av inloggningsförsök", () => {
  it("räknar bara försök inom fönstret", async () => {
    const nu = new Date("2026-09-25T12:00:00Z");
    const forr = new Date("2026-09-25T11:00:00Z");
    await registreraForsok("inlogg:1.1.1.1", forr);
    await registreraForsok("inlogg:1.1.1.1", nu);
    await registreraForsok("inlogg:1.1.1.1", nu);
    expect(await antalForsok("inlogg:1.1.1.1", 15 * 60_000, nu)).toBe(2);
  });

  it("håller isär olika ip:n och nollställs efter lyckad inloggning", async () => {
    const nu = new Date();
    await registreraForsok("inlogg:2.2.2.2", nu);
    expect(await antalForsok("inlogg:3.3.3.3", 60_000, nu)).toBe(0);
    await nollstallForsok("inlogg:2.2.2.2");
    expect(await antalForsok("inlogg:2.2.2.2", 60_000, nu)).toBe(0);
  });
});
