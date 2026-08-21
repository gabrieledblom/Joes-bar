/**
 * All öppettidslogik. Rena funktioner som tar en Klocka (nu-läge i
 * Europe/Stockholm) så att både klient, server och tester delar exakt
 * samma beteende – inklusive stängning efter midnatt.
 */
import { dagNamn, dagOrdning, hours, type DayKey, type OpenWindow } from '../config/hours';
import { ordering } from '../config/ordering';

export interface Klocka {
  /** YYYY-MM-DD i Europe/Stockholm */
  datum: string;
  /** Minuter sedan midnatt i Europe/Stockholm */
  minuter: number;
  dag: DayKey;
}

const DAG_PER_UTC_DAY: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function dagForDatum(datum: string): DayKey {
  const [y, m, d] = datum.split('-').map(Number);
  return DAG_PER_UTC_DAY[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]!;
}

export function laggTillDagar(datum: string, dagar: number): string {
  const [y, m, d] = datum.split('-').map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + dagar));
  return t.toISOString().slice(0, 10);
}

/** Nu-läge i Europe/Stockholm, oavsett var koden körs */
export function nuIStockholm(d: Date = new Date()): Klocka {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(d)) p[part.type] = part.value;
  const datum = `${p.year}-${p.month}-${p.day}`;
  return { datum, minuter: Number(p.hour) * 60 + Number(p.minute), dag: dagForDatum(datum) };
}

export function minuterFran(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + m!;
}

export function formatMinuter(minuter: number): string {
  const m = ((minuter % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Det serveringsfönster som är aktivt vid en given klocka: dagens eget,
 * eller gårdagens när det sträcker sig förbi midnatt (fre/lör → 01:00).
 * Alla minutvärden ligger på SERVICEDAGENS tidslinje (kan vara > 1440).
 */
export interface AktivtFonster {
  serviceDag: DayKey;
  serviceDatum: string;
  oppnar: number;
  stanger: number;
  /** "Nu" uttryckt på servicedagens tidslinje */
  nu: number;
}

export function aktivtFonster(nu: Klocka): AktivtFonster | null {
  const igarDatum = laggTillDagar(nu.datum, -1);
  const igarDag = dagForDatum(igarDatum);
  const igar = hours[igarDag];
  if (igar) {
    const stanger = minuterFran(igar.close);
    if (stanger > 1440 && nu.minuter < stanger - 1440) {
      return { serviceDag: igarDag, serviceDatum: igarDatum, oppnar: minuterFran(igar.open), stanger, nu: nu.minuter + 1440 };
    }
  }
  const idag = hours[nu.dag];
  if (idag) {
    const oppnar = minuterFran(idag.open);
    const stanger = minuterFran(idag.close);
    if (nu.minuter >= oppnar && nu.minuter < stanger) {
      return { serviceDag: nu.dag, serviceDatum: nu.datum, oppnar, stanger, nu: nu.minuter };
    }
  }
  return null;
}

export const arOppenNu = (nu: Klocka): boolean => aktivtFonster(nu) !== null;

export interface NastaOppning {
  dag: DayKey;
  datum: string;
  tid: string;
  idag: boolean;
}

/** Nästa gång stället öppnar (öppet just nu räknas inte) */
export function nastaOppning(nu: Klocka): NastaOppning {
  for (let i = 0; i < 8; i++) {
    const datum = laggTillDagar(nu.datum, i);
    const dag = dagForDatum(datum);
    const fonster = hours[dag];
    if (!fonster) continue;
    const oppnar = minuterFran(fonster.open);
    if (i === 0 && nu.minuter >= oppnar) continue;
    return { dag, datum, tid: fonster.open, idag: i === 0 };
  }
  /* istanbul ignore next – kräver helt tom öppettidstabell */
  throw new Error('Inga öppettider konfigurerade');
}

export interface HamtningsSlot {
  /** "YYYY-MM-DDTHH:mm" – faktiskt kalenderdatum (kan vara dagen efter servicedagen) */
  value: string;
  /** "HH:mm" */
  label: string;
}

/**
 * Giltiga avhämtningstider just nu: 15-minutersintervall, tidigast
 * nu + förberedelsetid, senast 45 min före stängning. Stängt = tom lista.
 */
export function hamtningsSlottar(nu: Klocka): HamtningsSlot[] {
  if (!ordering.aktiv) return [];
  const f = aktivtFonster(nu);
  if (!f) return [];
  const tidigast = Math.max(f.oppnar, f.nu + ordering.forberedelseMin);
  const senast = f.stanger - ordering.stoppForeStangningMin;
  const start = Math.ceil(tidigast / ordering.intervallMin) * ordering.intervallMin;
  const slottar: HamtningsSlot[] = [];
  for (let t = start; t <= senast; t += ordering.intervallMin) {
    const datum = laggTillDagar(f.serviceDatum, Math.floor(t / 1440));
    slottar.push({ value: `${datum}T${formatMinuter(t)}`, label: formatMinuter(t) });
  }
  return slottar;
}

/** Servervalidering av en begärd avhämtningstid (med liten marginal för klockskev) */
export function valideraHamtningstid(
  pickupAt: string,
  nu: Klocka,
  marginalMin = 5,
): { ok: true; label: string } | { ok: false; skal: string } {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(pickupAt);
  if (!m) return { ok: false, skal: 'Ogiltigt tidsformat.' };
  const [, datum, hh, min] = m;
  const f = aktivtFonster(nu);
  if (!f || !ordering.aktiv) return { ok: false, skal: 'Beställningen är stängd just nu.' };

  // Uttryck den begärda tiden på det aktiva fönstrets tidslinje
  let t = Number(hh) * 60 + Number(min);
  if (datum === laggTillDagar(f.serviceDatum, 1)) t += 1440;
  else if (datum !== f.serviceDatum) return { ok: false, skal: 'Avhämtningstiden gäller inte dagens öppettid.' };

  if (t < f.nu + ordering.forberedelseMin - marginalMin)
    return { ok: false, skal: 'Avhämtningstiden är för tidig – välj en senare tid.' };
  if (t > f.stanger - ordering.stoppForeStangningMin)
    return { ok: false, skal: 'Avhämtningstiden är för sent på kvällen – köket hinner inte.' };
  if (t < f.oppnar) return { ok: false, skal: 'Avhämtningstiden ligger före öppning.' };
  return { ok: true, label: formatMinuter(t) };
}

export interface OppettidsRad {
  dag: string;
  tider: string;
}

/** Öppettiderna som visningsrader ("14:30–01:00", "Stängt") för footer m.m. */
export function oppettidsRader(): OppettidsRad[] {
  return dagOrdning.map((dag) => {
    const f = hours[dag];
    return {
      dag: dagNamn[dag],
      tider: f ? `${f.open}–${formatMinuter(minuterFran(f.close))}` : 'Stängt',
    };
  });
}

export { dagNamn, type DayKey, type OpenWindow };
