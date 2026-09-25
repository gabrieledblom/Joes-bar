"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Butiksstatus } from "@/lib/db/butik";

const UPPDATERA_MS = 60_000;

interface ButikContextValue {
  pausad: boolean;
  slut: ReadonlySet<string>;
  /** Byt ut hela statusen, t.ex. med svaret efter en ändring i köket. */
  ersatt: (status: Butiksstatus) => void;
}

const ButikContext = createContext<ButikContextValue>({
  pausad: false,
  slut: new Set(),
  ersatt: () => {},
});

/**
 * Håller menyn i fas med köket: vad som är slut och om beställningen är
 * pausad. Servern kontrollerar samma sak vid varje order, så en gäst som
 * hunnit lägga något i varukorgen innan det tog slut kan ändå aldrig betala
 * för det.
 */
export function ButikProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Butiksstatus>({
    pausad: false,
    slut: [],
  });

  useEffect(() => {
    let avbruten = false;
    async function hamta() {
      try {
        const svar = await fetch("/api/butik", { cache: "no-store" });
        if (!svar.ok) return;
        const data = (await svar.json()) as Butiksstatus;
        if (!avbruten) setStatus(data);
      } catch {
        // Tappad uppkoppling: behåll senaste kända läget.
      }
    }
    hamta();
    const timer = setInterval(hamta, UPPDATERA_MS);
    window.addEventListener("focus", hamta);
    return () => {
      avbruten = true;
      clearInterval(timer);
      window.removeEventListener("focus", hamta);
    };
  }, []);

  const ersatt = useCallback((ny: Butiksstatus) => setStatus(ny), []);

  const varde = useMemo(
    () => ({ pausad: status.pausad, slut: new Set(status.slut), ersatt }),
    [status, ersatt],
  );

  return <ButikContext.Provider value={varde}>{children}</ButikContext.Provider>;
}

export function useButik(): ButikContextValue {
  return useContext(ButikContext);
}
