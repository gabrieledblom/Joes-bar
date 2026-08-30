import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Databasen kopplas upp först när den används, inte när modulen laddas.
 * Annars kan bygget inte köra utan DATABASE_URL satt.
 */
let cachad: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function harDatabas(): boolean {
  return Boolean(process.env.DATABASE_URL);
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
