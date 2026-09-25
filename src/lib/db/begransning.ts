import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { db, harDatabas } from "./index";
import { forsok } from "./schema";

/**
 * Räknar försök per nyckel (t.ex. "inlogg:1.2.3.4") inom ett tidsfönster.
 * Används för att stoppa lösenordsgissning mot köksskärmen, som kan göra
 * återbetalningar.
 *
 * Sparas i databasen, inte i minnet: på Vercel körs varje anrop i en egen
 * instans, så en räknare i minnet skulle börja om från noll hela tiden.
 */

const minne: { nyckel: string; tid: Date }[] = [];

let tabellKlar: Promise<unknown> | null = null;

function tabell(): Promise<unknown> {
  // Neons http-drivrutin kör ett uttryck per anrop, därav två steg.
  tabellKlar ??= (async () => {
    await db().execute(
      sql`CREATE TABLE IF NOT EXISTS "forsok" (
        "id" serial PRIMARY KEY,
        "nyckel" text NOT NULL,
        "tid" timestamp with time zone DEFAULT now() NOT NULL
      )`,
    );
    await db().execute(
      sql`CREATE INDEX IF NOT EXISTS "forsok_nyckel_tid_idx" ON "forsok" ("nyckel", "tid")`,
    );
  })().catch((fel) => {
    tabellKlar = null;
    throw fel;
  });
  return tabellKlar;
}

export async function antalForsok(
  nyckel: string,
  fonsterMs: number,
  nu: Date = new Date(),
): Promise<number> {
  const fran = new Date(nu.getTime() - fonsterMs);
  if (!harDatabas()) {
    return minne.filter((f) => f.nyckel === nyckel && f.tid >= fran).length;
  }
  await tabell();
  const [rad] = await db()
    .select({ antal: count() })
    .from(forsok)
    .where(and(eq(forsok.nyckel, nyckel), gte(forsok.tid, fran)));
  return rad?.antal ?? 0;
}

export async function registreraForsok(
  nyckel: string,
  nu: Date = new Date(),
): Promise<void> {
  if (!harDatabas()) {
    minne.push({ nyckel, tid: nu });
    return;
  }
  await tabell();
  await db().insert(forsok).values({ nyckel, tid: nu });
  // Städa bort gamla rader då och då, så tabellen inte växer för evigt.
  if (Math.random() < 0.05) {
    const gammal = new Date(nu.getTime() - 24 * 60 * 60 * 1000);
    await db().delete(forsok).where(lt(forsok.tid, gammal));
  }
}

export async function nollstallForsok(nyckel: string): Promise<void> {
  if (!harDatabas()) {
    for (let i = minne.length - 1; i >= 0; i--) {
      if (minne[i].nyckel === nyckel) minne.splice(i, 1);
    }
    return;
  }
  await tabell();
  await db().delete(forsok).where(eq(forsok.nyckel, nyckel));
}

/** Besökarens ip. Vercel sätter de här rubrikerna själv och skriver över klientens. */
export function klientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "okand"
  );
}
