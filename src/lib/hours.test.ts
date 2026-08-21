import { describe, expect, it } from 'vitest';
import {
  aktivtFonster,
  arOppenNu,
  dagForDatum,
  hamtningsSlottar,
  nastaOppning,
  oppettidsRader,
  valideraHamtningstid,
  type Klocka,
} from './hours';

/** 2026-08-17 är en måndag; veckan därefter används genomgående. */
const kl = (datum: string, tid: string): Klocka => {
  const [h, m] = tid.split(':').map(Number);
  return { datum, minuter: h! * 60 + m!, dag: dagForDatum(datum) };
};

describe('veckodagar', () => {
  it('mappar datum till rätt dag', () => {
    expect(dagForDatum('2026-08-17')).toBe('mon');
    expect(dagForDatum('2026-08-21')).toBe('fri');
    expect(dagForDatum('2026-08-23')).toBe('sun');
  });
});

describe('öppet nu', () => {
  it('måndag är stängt hela dagen', () => {
    expect(arOppenNu(kl('2026-08-17', '18:00'))).toBe(false);
  });
  it('tisdag 10:00 är stängt, 15:00 öppet, 23:30 stängt', () => {
    expect(arOppenNu(kl('2026-08-18', '10:00'))).toBe(false);
    expect(arOppenNu(kl('2026-08-18', '15:00'))).toBe(true);
    expect(arOppenNu(kl('2026-08-18', '23:30'))).toBe(false);
  });
  it('natt mot lördag 00:15 är öppet – via fredagens fönster', () => {
    const f = aktivtFonster(kl('2026-08-22', '00:15'));
    expect(f).not.toBeNull();
    expect(f!.serviceDag).toBe('fri');
    expect(f!.serviceDatum).toBe('2026-08-21');
  });
  it('natt mot lördag 01:00 är stängt (fredag stänger 01:00)', () => {
    expect(arOppenNu(kl('2026-08-22', '01:00'))).toBe(false);
  });
  it('natt mot måndag 00:15 är stängt (söndag stänger 21:00)', () => {
    expect(arOppenNu(kl('2026-08-24', '00:15'))).toBe(false);
  });
});

describe('nästa öppning', () => {
  it('tisdag före öppning pekar på idag 14:30', () => {
    const n = nastaOppning(kl('2026-08-18', '10:00'));
    expect(n).toMatchObject({ dag: 'tue', tid: '14:30', idag: true });
  });
  it('måndag pekar på tisdag', () => {
    const n = nastaOppning(kl('2026-08-17', '18:00'));
    expect(n).toMatchObject({ dag: 'tue', datum: '2026-08-18', idag: false });
  });
  it('sent på söndagen pekar på tisdag', () => {
    const n = nastaOppning(kl('2026-08-23', '22:00'));
    expect(n).toMatchObject({ dag: 'tue', datum: '2026-08-25' });
  });
});

describe('avhämtningstider', () => {
  it('stängd dag ger inga tider', () => {
    expect(hamtningsSlottar(kl('2026-08-17', '18:00'))).toHaveLength(0);
  });
  it('före öppning ger inga tider (formuläret är låst)', () => {
    expect(hamtningsSlottar(kl('2026-08-18', '10:00'))).toHaveLength(0);
  });
  it('tisdag 15:00: första 15:30, sista 22:15', () => {
    const s = hamtningsSlottar(kl('2026-08-18', '15:00'));
    expect(s[0]!.label).toBe('15:30');
    expect(s.at(-1)!.label).toBe('22:15');
    expect(s[0]!.value).toBe('2026-08-18T15:30');
  });
  it('fredag 23:30: tider över midnatt får lördagens datum', () => {
    const s = hamtningsSlottar(kl('2026-08-21', '23:30'));
    expect(s.map((x) => x.label)).toEqual(['00:00', '00:15']);
    expect(s[0]!.value).toBe('2026-08-22T00:00');
  });
  it('natt mot lördag 00:15: inga tider kvar (sista är 00:15, kräver 30 min)', () => {
    expect(hamtningsSlottar(kl('2026-08-22', '00:15'))).toHaveLength(0);
  });
  it('söndag 20:00: stängt för beställning trots öppet (stänger 21:00)', () => {
    expect(hamtningsSlottar(kl('2026-08-23', '20:00'))).toHaveLength(0);
  });
});

describe('servervalidering av avhämtningstid', () => {
  it('godkänner giltig tid samma kväll', () => {
    expect(valideraHamtningstid('2026-08-18T16:00', kl('2026-08-18', '15:00'))).toMatchObject({ ok: true, label: '16:00' });
  });
  it('godkänner tid över midnatt mot fredagens fönster', () => {
    expect(valideraHamtningstid('2026-08-22T00:15', kl('2026-08-21', '23:30'))).toMatchObject({ ok: true, label: '00:15' });
  });
  it('avvisar för tidig tid', () => {
    expect(valideraHamtningstid('2026-08-18T15:10', kl('2026-08-18', '15:00'))).toMatchObject({ ok: false });
  });
  it('avvisar tid efter köksstopp', () => {
    expect(valideraHamtningstid('2026-08-18T22:30', kl('2026-08-18', '15:00'))).toMatchObject({ ok: false });
  });
  it('avvisar när det är stängt', () => {
    expect(valideraHamtningstid('2026-08-17T18:00', kl('2026-08-17', '17:00'))).toMatchObject({ ok: false });
  });
  it('avvisar fel datum', () => {
    expect(valideraHamtningstid('2026-08-19T16:00', kl('2026-08-18', '15:00'))).toMatchObject({ ok: false });
  });
  it('avvisar trasigt format', () => {
    expect(valideraHamtningstid('igår typ', kl('2026-08-18', '15:00'))).toMatchObject({ ok: false });
  });
});

describe('öppettidsrader', () => {
  it('visar stängt på måndag och 01:00-stängning på fredag', () => {
    const rader = oppettidsRader();
    expect(rader[0]).toEqual({ dag: 'måndag', tider: 'Stängt' });
    expect(rader[4]).toEqual({ dag: 'fredag', tider: '14:30–01:00' });
    expect(rader[6]).toEqual({ dag: 'söndag', tider: '13:00–21:00' });
  });
});
