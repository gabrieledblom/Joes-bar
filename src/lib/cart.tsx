"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  garAttBestalla,
  hittaRatt,
  type Protein,
} from "@/data/menu-data";

export interface CartRad {
  /** Unik per rad, inte per rätt: samma pizza kan ligga två gånger med olika noteringar. */
  radId: string;
  rattId: string;
  antal: number;
  notering: string;
  protein?: Protein;
}

interface CartState {
  rader: CartRad[];
  /** false tills varukorgen lästs från localStorage, så servern och klienten matchar. */
  laddad: boolean;
}

type CartAction =
  | { typ: "lagg-till"; rad: Omit<CartRad, "radId"> }
  | { typ: "andra-antal"; radId: string; antal: number }
  | { typ: "ta-bort"; radId: string }
  | { typ: "toem" }
  | { typ: "aterstall"; rader: CartRad[] };

const LAGRINGSNYCKEL = "joesbar-varukorg-v1";

/** Två rader slås ihop bara om rätt, notering och protein är identiska. */
function sammaRad(a: Omit<CartRad, "radId">, b: CartRad): boolean {
  return (
    a.rattId === b.rattId &&
    a.notering.trim() === b.notering.trim() &&
    a.protein === b.protein
  );
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.typ) {
    case "lagg-till": {
      const befintlig = state.rader.find((r) => sammaRad(action.rad, r));
      if (befintlig) {
        return {
          ...state,
          rader: state.rader.map((r) =>
            r.radId === befintlig.radId
              ? { ...r, antal: Math.min(r.antal + action.rad.antal, 99) }
              : r,
          ),
        };
      }
      return {
        ...state,
        rader: [
          ...state.rader,
          { ...action.rad, radId: crypto.randomUUID() },
        ],
      };
    }
    case "andra-antal": {
      if (action.antal < 1) {
        return {
          ...state,
          rader: state.rader.filter((r) => r.radId !== action.radId),
        };
      }
      return {
        ...state,
        rader: state.rader.map((r) =>
          r.radId === action.radId
            ? { ...r, antal: Math.min(action.antal, 99) }
            : r,
        ),
      };
    }
    case "ta-bort":
      return {
        ...state,
        rader: state.rader.filter((r) => r.radId !== action.radId),
      };
    case "toem":
      return { ...state, rader: [] };
    // Ett enda tillståndsbyte när lagringen lästs: både raderna och
    // laddad-flaggan sätts på samma gång, i stället för två renderingar.
    case "aterstall":
      return { rader: action.rader, laddad: true };
  }
}

interface CartContextValue {
  rader: CartRad[];
  antalVaror: number;
  summa: number;
  laddad: boolean;
  laggTill: (rad: Omit<CartRad, "radId">) => void;
  andraAntal: (radId: string, antal: number) => void;
  taBort: (radId: string) => void;
  toem: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { rader: [], laddad: false });

  // Varukorgen överlever en omladdning. Läsningen sker efter monteringen,
  // eftersom localStorage inte finns på servern och serverns HTML annars
  // inte skulle matcha klientens. Rätter som tagits bort ur menyn sedan
  // förra besöket sållas bort, så att inget hamnar i kassan utan pris.
  useEffect(() => {
    let giltiga: CartRad[] = [];
    try {
      const ratt = window.localStorage.getItem(LAGRINGSNYCKEL);
      if (ratt) {
        const tolkad = JSON.parse(ratt) as { rader?: CartRad[] };
        giltiga = (tolkad.rader ?? []).filter((r) => {
          const ratten = hittaRatt(r.rattId);
          return ratten !== undefined && garAttBestalla(ratten);
        });
      }
    } catch {
      // Trasig eller blockerad lagring ska inte hindra någon från att beställa.
    }
    dispatch({ typ: "aterstall", rader: giltiga });
  }, []);

  useEffect(() => {
    if (!state.laddad) return;
    try {
      window.localStorage.setItem(
        LAGRINGSNYCKEL,
        JSON.stringify({ rader: state.rader }),
      );
    } catch {
      // Privat läge kan neka skrivning. Varukorgen lever kvar i minnet.
    }
  }, [state]);

  const laggTill = useCallback(
    (rad: Omit<CartRad, "radId">) => dispatch({ typ: "lagg-till", rad }),
    [],
  );
  const andraAntal = useCallback(
    (radId: string, antal: number) =>
      dispatch({ typ: "andra-antal", radId, antal }),
    [],
  );
  const taBort = useCallback(
    (radId: string) => dispatch({ typ: "ta-bort", radId }),
    [],
  );
  const toem = useCallback(() => dispatch({ typ: "toem" }), []);

  const varde = useMemo<CartContextValue>(() => {
    const antalVaror = state.rader.reduce((n, r) => n + r.antal, 0);
    const summa = state.rader.reduce((n, r) => {
      const ratten = hittaRatt(r.rattId);
      return n + (ratten?.pris ?? 0) * r.antal;
    }, 0);
    return {
      rader: state.rader,
      antalVaror,
      summa,
      laddad: state.laddad,
      laggTill,
      andraAntal,
      taBort,
      toem,
    };
  }, [state.rader, state.laddad, laggTill, andraAntal, taBort, toem]);

  return <CartContext.Provider value={varde}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart måste ligga inuti CartProvider");
  return ctx;
}
