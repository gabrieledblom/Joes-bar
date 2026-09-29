import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Databasen kopplas upp först när den används, inte när modulen laddas.
 * Annars kan bygget inte köra utan DATABASE_URL satt.
 */
let cachad: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function harDatabas(): boolean {
  if (process.env.DATABASE_URL) return true;
  // Minnesläget är bara till för lokal utveckling. I drift skulle en saknad
  // DATABASE_URL annars låta betalda ordrar försvinna tyst vid nästa
  // omstart - ett högt fel är bättre än en order som aldrig nådde köket.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL saknas i drift. Lägg in den i Vercel (Settings -> Environment Variables).",
    );
  }
  return false;
}

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL saknas. Lägg till en Neon- eller Vercel Postgres-databas.",
    );
  }
  if (!cachad) {
    cachad = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return cachad;
}

export { schema };
