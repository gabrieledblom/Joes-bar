import { describe, expect, it } from "vitest";
import { affarsdag, hamtaButiksstatus, sattPausad, sattSlut } from "./butik";

// UTC-tider; Järna är UTC+2 på sommaren.
const fredagKvall = new Date("2026-07-03T19:00:00Z"); // fre 21:00
const lordagNatt = new Date("2026-07-03T22:30:00Z"); // lör 00:30
const lordagMorgon = new Date("2026-07-04T04:00:00Z"); // lör 06:00

describe("affarsdag", () => {
  it("räknar natten efter midnatt till kvällens pass", () => {
    expect(affarsdag(fredagKvall)).toBe("2026-07-03");
    expect(affarsdag(lordagNatt)).toBe("2026-07-03");
  });

  it("börjar en ny dag kl 05", () => {
    expect(affarsdag(lordagMorgon)).toBe("2026-07-04");
  });
});

describe("slut och paus", () => {
  it("visar det som satts under passet", async () => {
    await sattSlut("pizza-capri", true, fredagKvall);
    await sattPausad(true, fredagKvall);
    const status = await hamtaButiksstatus(lordagNatt);
    expect(status.slut).toContain("pizza-capri");
    expect(status.pausad).toBe(true);
  });

  it("nollställs av sig själv nästa morgon", async () => {
    await sattSlut("pizza-veggie", true, fredagKvall);
    await sattPausad(true, fredagKvall);
    const status = await hamtaButiksstatus(lordagMorgon);
    expect(status.slut).not.toContain("pizza-veggie");
    expect(status.pausad).toBe(false);
  });

  it("går att slå på igen", async () => {
    await sattSlut("pizza-kebaben", true, fredagKvall);
    await sattSlut("pizza-kebaben", false, fredagKvall);
    expect((await hamtaButiksstatus(fredagKvall)).slut).not.toContain(
      "pizza-kebaben",
    );
  });
});
