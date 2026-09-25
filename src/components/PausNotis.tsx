"use client";

import { restaurang } from "@/data/restaurang";
import { useButik } from "@/lib/butik-klient";

/** Syns på menyn när köket pausat onlinebeställningen. */
export function PausNotis() {
  const { pausad } = useButik();
  if (!pausad) return null;
  return (
    <p
      role="status"
      className="mt-6 rounded-jb border border-jb-orange/50 bg-jb-orange/10 px-4 py-3 text-sm text-jb-text"
    >
      Köket har pausat onlinebeställningen en stund - du kan fortfarande titta
      på menyn.
      {restaurang.telefon ? ` Ring ${restaurang.telefon} för att beställa.` : ""}
    </p>
  );
}
