/**
 * Priser hanteras i hela kronor i menyn, men Stripe räknar i ören.
 * All omräkning sker här så att ingen glömmer faktorn 100.
 */

export function kronorTillOren(kronor: number): number {
  return Math.round(kronor * 100);
}

export function orenTillKronor(oren: number): number {
  return oren / 100;
}

export function formateraPris(kronor: number): string {
  return `${kronor.toLocaleString("sv-SE")} kr`;
}
