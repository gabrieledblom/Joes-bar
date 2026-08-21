/**
 * Varukorgen – liten store synkad mot sessionStorage (avsiktligt inte
 * localStorage: korgen ska inte ligga kvar i dagar). Körs bara i webbläsaren.
 */
export interface KorgRad {
  id: string;
  antal: number;
  tillval?: string;
}

const NYCKEL = 'jb-korg';

export function lasKorg(): KorgRad[] {
  try {
    const raw = sessionStorage.getItem(NYCKEL);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (r): r is KorgRad =>
        typeof r === 'object' && r !== null &&
        typeof r.id === 'string' &&
        Number.isInteger(r.antal) && r.antal > 0 &&
        (r.tillval === undefined || typeof r.tillval === 'string'),
    );
  } catch {
    return [];
  }
}

function spara(rader: KorgRad[]): void {
  try {
    sessionStorage.setItem(NYCKEL, JSON.stringify(rader));
  } catch {
    /* privat läge etc. – korgen lever då bara i minnet av sidan */
  }
  window.dispatchEvent(new CustomEvent('korg:andrad', { detail: { antal: antalIRader(rader) } }));
}

const antalIRader = (rader: KorgRad[]): number => rader.reduce((s, r) => s + r.antal, 0);

export const antalIKorg = (): number => antalIRader(lasKorg());

export function laggTill(id: string, tillval?: string): void {
  const rader = lasKorg();
  const rad = rader.find((r) => r.id === id && r.tillval === tillval);
  if (rad) rad.antal += 1;
  else rader.push(tillval ? { id, antal: 1, tillval } : { id, antal: 1 });
  spara(rader);
}

export function andraAntal(index: number, delta: number): void {
  const rader = lasKorg();
  const rad = rader[index];
  if (!rad) return;
  rad.antal += delta;
  if (rad.antal <= 0) rader.splice(index, 1);
  spara(rader);
}

export function taBort(index: number): void {
  const rader = lasKorg();
  rader.splice(index, 1);
  spara(rader);
}

export function tomKorg(): void {
  spara([]);
}
