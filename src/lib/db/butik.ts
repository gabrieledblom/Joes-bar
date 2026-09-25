import { eq, sql } from "drizzle-orm";
import { db, harDatabas } from "./index";
import { installningar } from "./schema";

/**
 * Det personalen slår av och på under ett pass: rätter som tagit slut och
 * paus för onlinebeställningen.
 *
 * Allt gäller bara "i dag". En affärsdag börjar kl 05 i Järna, så en rätt
 * som tog slut en fredagskväll finns igen på lördagen utan att någon behöver
 * komma ihåg att slå på den - annars försvinner den ur menyn för gott.
 */

const TIDSZON = "Europe/Stockholm";
const DAGEN_BORJAR_TIMME = 5;
const PAUSAD = "pausad";
const SLUT = "slut:";

export interface Butiksstatus {
  pausad: boolean;
  /** Id:n på rätter som är slut för i dag. */
  slut: string[];
}

/** "2026-09-25" - datumet för det pass tidpunkten hör till. */
export function affarsdag(tid: Date): string {
  const forskjuten = new Date(tid.getTime() - DAGEN_BORJAR_TIMME * 3_600_000);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIDSZON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(forskjuten);
}

// Minnesläge för lokal utveckling utan databas, precis som ordrarna.
const minne = new Map<string, Date>();

let tabellKlar: Promise<unknown> | null = null;

/**
 * Tabellen skapas första gången den behövs. Då behöver ingen klistra in SQL
 * i Neon för att funktionen ska börja fungera efter en driftsättning.
 */
function tabell(): Promise<unknown> {
  tabellKlar ??= db()
    .execute(
      sql`CREATE TABLE IF NOT EXISTS "installningar" (
        "nyckel" text PRIMARY KEY NOT NULL,
        "satt" timestamp with time zone DEFAULT now() NOT NULL
      )`,
    )
    .catch((fel) => {
      tabellKlar = null;
      throw fel;
    });
  return tabellKlar;
}

async function allaRader(): Promise<{ nyckel: string; satt: Date }[]> {
  if (!harDatabas()) {
    return [...minne].map(([nyckel, satt]) => ({ nyckel, satt }));
  }
  await tabell();
  return db().select().from(installningar);
}

export async function hamtaButiksstatus(
  nu: Date = new Date(),
): Promise<Butiksstatus> {
  const idag = affarsdag(nu);
  const giltiga = (await allaRader())
    .filter((r) => affarsdag(r.satt) === idag)
    .map((r) => r.nyckel);
  return {
    pausad: giltiga.includes(PAUSAD),
    slut: giltiga.filter((n) => n.startsWith(SLUT)).map((n) => n.slice(SLUT.length)),
  };
}

async function satt(nyckel: string, pa: boolean, nu: Date): Promise<void> {
  if (!harDatabas()) {
    if (pa) minne.set(nyckel, nu);
    else minne.delete(nyckel);
    return;
  }
  await tabell();
  if (pa) {
    await db()
      .insert(installningar)
      .values({ nyckel, satt: nu })
      .onConflictDoUpdate({ target: installningar.nyckel, set: { satt: nu } });
  } else {
    await db().delete(installningar).where(eq(installningar.nyckel, nyckel));
  }
}

export function sattPausad(pausad: boolean, nu: Date = new Date()) {
  return satt(PAUSAD, pausad, nu);
}

export function sattSlut(rattId: string, slut: boolean, nu: Date = new Date()) {
  return satt(`${SLUT}${rattId}`, slut, nu);
}
