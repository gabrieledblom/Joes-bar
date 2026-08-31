"use client";

import { useSyncExternalStore } from "react";

/**
 * Minuten vi befinner oss i, som ett tal som ändras en gång i minuten.
 *
 * Klockan är en yttre källa som React inte äger, så den läses med
 * useSyncExternalStore i stället för med useState plus useEffect. Det ger
 * två saker: servern och klienten renderar samma sak vid hydreringen, och
 * inget tillstånd sätts inuti en effekt.
 *
 * På servern returneras SERVERMINUT. Komponenter som använder klockan ska
 * rendera ett vettigt standardläge för det värdet, så att sidan ser hel ut
 * även utan JavaScript.
 */

export const SERVERMINUT = -1;

const lyssnare = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let cachadMinut = minutNu();

function minutNu(): number {
  return Math.floor(Date.now() / 60000);
}

function tick() {
  const minut = minutNu();
  if (minut === cachadMinut) return;
  cachadMinut = minut;
  for (const lyssna of lyssnare) lyssna();
}

function prenumerera(vidAndring: () => void): () => void {
  lyssnare.add(vidAndring);
  if (timer === null) {
    // Var tjugonde sekund: tillräckligt för att minutbytet ska kännas
    // omedelbart, glest nog att inte kosta något.
    timer = setInterval(tick, 20_000);
  }
  return () => {
    lyssnare.delete(vidAndring);
    if (lyssnare.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function las(): number {
  return cachadMinut;
}

function lasPaServern(): number {
  return SERVERMINUT;
}

export function useMinut(): number {
  return useSyncExternalStore(prenumerera, las, lasPaServern);
}
