/**
 * Kalenderdagar i Järnas tid, för rapporter och bokföring. En order betald
 * 00:30 en lördag hör till lördagen i bokföringen, även om den lagades under
 * fredagens pass.
 */

const TIDSZON = "Europe/Stockholm";
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-09-25" för tidpunkten, räknat i Järna. */
export function stockholmDatum(tid: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIDSZON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tid);
}

/** "14:32" för tidpunkten, räknat i Järna. */
export function stockholmKlockslag(tid: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIDSZON,
    hour: "2-digit",
    minute: "2-digit",
  }).format(tid);
}

export function arDatum(text: unknown): text is string {
  return typeof text === "string" && DATUM.test(text) && !Number.isNaN(Date.parse(text));
}

/** Minuter Järna ligger före UTC vid tidpunkten: 60 på vintern, 120 på sommaren. */
function forskjutning(tid: Date): number {
  const namn = new Intl.DateTimeFormat("en-US", {
    timeZone: TIDSZON,
    timeZoneName: "longOffset",
  })
    .formatToParts(tid)
    .find((d) => d.type === "timeZoneName")?.value;
  const traff = namn?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!traff) return 0;
  const minuter = Number(traff[2]) * 60 + Number(traff[3]);
  return traff[1] === "-" ? -minuter : minuter;
}

/** Midnatt i Järna den dagen, som tidpunkt. */
function midnatt(datum: string): Date {
  const [ar, manad, dag] = datum.split("-").map(Number);
  const gissning = Date.UTC(ar, manad - 1, dag);
  return new Date(gissning - forskjutning(new Date(gissning)) * 60_000);
}

export function flyttaDagar(datum: string, dagar: number): string {
  const [ar, manad, dag] = datum.split("-").map(Number);
  return new Date(Date.UTC(ar, manad - 1, dag + dagar)).toISOString().slice(0, 10);
}

/** Från och med midnatt, till (men inte med) nästa midnatt. */
export function dygnetsGranser(datum: string): { fran: Date; till: Date } {
  return { fran: midnatt(datum), till: midnatt(flyttaDagar(datum, 1)) };
}

/** Hela kalendermånaden, t.ex. "2026-09". */
export function manadensGranser(manad: string): { fran: Date; till: Date } {
  const [ar, man] = manad.split("-").map(Number);
  const forsta = `${manad}-01`;
  const nasta = new Date(Date.UTC(ar, man, 1)).toISOString().slice(0, 10);
  return { fran: midnatt(forsta), till: midnatt(nasta) };
}
