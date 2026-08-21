/**
 * Prisberäkning – delas av klientens korg och serverns orderfunktion.
 * Servern räknar ALLTID om summan härifrån; klientens siffror används aldrig.
 */
import { rattMedId } from '../config/menu';

export interface OrderRad {
  id: string;
  antal: number;
  tillval?: string;
}

export interface BeraknadRad {
  id: string;
  namn: string;
  antal: number;
  tillval?: string;
  styckpris: number;
  radpris: number;
}

export type Berakning =
  | { ok: true; rader: BeraknadRad[]; summa: number }
  | { ok: false; fel: string };

export function beraknaOrder(rader: OrderRad[]): Berakning {
  if (rader.length === 0) return { ok: false, fel: 'Korgen är tom.' };
  const ut: BeraknadRad[] = [];
  for (const rad of rader) {
    const ratt = rattMedId(rad.id);
    if (!ratt || !ratt.tillganglig) return { ok: false, fel: `Rätten "${rad.id}" finns inte på menyn.` };
    if (!Number.isInteger(rad.antal) || rad.antal < 1 || rad.antal > 99)
      return { ok: false, fel: `Ogiltigt antal för ${ratt.namn}.` };
    if (ratt.tillval) {
      if (!rad.tillval || !ratt.tillval.alternativ.includes(rad.tillval))
        return { ok: false, fel: `Välj ${ratt.tillval.label.toLowerCase()} för ${ratt.namn}.` };
    } else if (rad.tillval) {
      return { ok: false, fel: `${ratt.namn} har inga tillval.` };
    }
    ut.push({
      id: ratt.id,
      namn: ratt.namn,
      antal: rad.antal,
      tillval: rad.tillval,
      styckpris: ratt.pris,
      radpris: ratt.pris * rad.antal,
    });
  }
  return { ok: true, rader: ut, summa: ut.reduce((s, r) => s + r.radpris, 0) };
}
