/**
 * Öppettider – enda källan. Driver footerns tabell, "Öppet nu"-badgen
 * och avhämtningstiderna i beställningen.
 *
 * `close` får överstiga "24:00" för stängning efter midnatt:
 * fredag "25:00" betyder natten till lördag kl 01:00, och en beställning
 * kl 00:15 natt mot lördag räknas då som fredagens öppettid.
 */
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface OpenWindow {
  /** "HH:MM" */
  open: string;
  /** "HH:MM", får vara > "24:00" */
  close: string;
}

export const hours: Record<DayKey, OpenWindow | null> = {
  mon: null,
  tue: { open: '14:30', close: '23:00' },
  wed: { open: '14:30', close: '23:00' },
  thu: { open: '14:30', close: '23:00' },
  fri: { open: '14:30', close: '25:00' },
  sat: { open: '13:00', close: '25:00' },
  sun: { open: '13:00', close: '21:00' },
};

export const dagOrdning: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const dagNamn: Record<DayKey, string> = {
  mon: 'måndag',
  tue: 'tisdag',
  wed: 'onsdag',
  thu: 'torsdag',
  fri: 'fredag',
  sat: 'lördag',
  sun: 'söndag',
};
