import { beforeAll, describe, expect, it } from "vitest";
import {
  bordFornyas,
  losenordStammer,
  skapaKoksToken,
  tokenGiltig,
} from "./kok-auth";

const DAG = 24 * 60 * 60 * 1000;

beforeAll(() => {
  process.env.KITCHEN_DASHBOARD_PASSWORD = "ett-langt-testlosenord";
});

describe("köksinloggning", () => {
  it("godtar en nyss skapad kaka", async () => {
    const { varde } = await skapaKoksToken();
    expect(await tokenGiltig(varde)).toBe(true);
  });

  it("avvisar en kaka med ändrat utgångsdatum", async () => {
    const { varde } = await skapaKoksToken();
    const [utgar, signatur] = varde.split(".");
    const forlangd = `${Number(utgar) + 365 * DAG}.${signatur}`;
    expect(await tokenGiltig(forlangd)).toBe(false);
  });

  it("avvisar tomma och trasiga kakor", async () => {
    for (const token of [undefined, "", "abc", "123.", ".abc", "x.y"]) {
      expect(await tokenGiltig(token)).toBe(false);
    }
  });

  it("avvisar en kaka som löpt ut", async () => {
    const { varde } = await skapaKoksToken();
    const [, signatur] = varde.split(".");
    expect(await tokenGiltig(`${Date.now() - 1000}.${signatur}`)).toBe(false);
  });

  it("jämför lösenord exakt", () => {
    expect(losenordStammer("ett-langt-testlosenord")).toBe(true);
    expect(losenordStammer("ett-langt-testlosenor")).toBe(false);
    expect(losenordStammer("")).toBe(false);
  });
});

describe("glidande inloggning", () => {
  it("förnyar inte en kaka som är alldeles ny", async () => {
    const { varde } = await skapaKoksToken();
    expect(bordFornyas(varde)).toBe(false);
  });

  it("förnyar en kaka när ett dygn gått", async () => {
    const { varde } = await skapaKoksToken();
    expect(bordFornyas(varde, Date.now() + 1.1 * DAG)).toBe(true);
  });

  it("förnyar inte något som inte är en kaka", () => {
    expect(bordFornyas(undefined)).toBe(false);
    expect(bordFornyas("skräp")).toBe(false);
  });
});
