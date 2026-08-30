/* ============================================================================
 * UPPGIFTER OM RESTAURANGEN
 * ============================================================================
 * Adress, telefon, öppettider och beställningsregler. Ändra här, aldrig i
 * komponenterna. Fälten märkta TODO måste fyllas i innan sajten går live -
 * Stripes Swish-villkor kräver att kontaktuppgifter och villkor syns för
 * gästen (se /villkor).
 * ==========================================================================*/

export const restaurang = {
  namn: "Joe's Bar",
  tagline: "Mat & Bar",
  ort: "Järna",
  land: "Sweden",

  // TODO: fyll i innan lansering
  adress: {
    gata: "",
    postnummer: "",
    postort: "Järna",
  },
  /** Visningsformat, t.ex. "08-551 700 00" */
  telefon: "",
  /** Uppringningsbart, t.ex. "+46855170000" */
  telefonE164: "",
  epost: "",
  orgnr: "",

  /** Driver Stripe-redirects och länkar i kvitton. Sätt NEXT_PUBLIC_SITE_URL i Vercel. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export const harKontaktuppgifter =
  restaurang.telefon.length > 0 && restaurang.adress.gata.length > 0;

/* -------------------------------------------------------------------------
 * ÖPPETTIDER
 * Stängt = null. Stängning efter midnatt skrivs som mer än 24:
 * fredagens "25:00" betyder 01:00 natten till lördag.
 * ---------------------------------------------------------------------- */
export type Veckodag = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Oppettid {
  open: string;
  close: string;
}

export const oppettider: Record<Veckodag, Oppettid | null> = {
  mon: null,
  tue: { open: "14:30", close: "23:00" },
  wed: { open: "14:30", close: "23:00" },
  thu: { open: "14:30", close: "23:00" },
  fri: { open: "14:30", close: "25:00" },
  sat: { open: "13:00", close: "25:00" },
  sun: { open: "13:00", close: "21:00" },
};

export const dagOrdning: Veckodag[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const dagNamn: Record<Veckodag, string> = {
  mon: "Måndag",
  tue: "Tisdag",
  wed: "Onsdag",
  thu: "Torsdag",
  fri: "Fredag",
  sat: "Lördag",
  sun: "Söndag",
};

/* -------------------------------------------------------------------------
 * BESTÄLLNING
 * ---------------------------------------------------------------------- */
export const bestallning = {
  /** false stänger av onlinebeställning helt. Menyn syns fortfarande. */
  aktiv: true,
  /** Ungefärlig tid från betald order till avhämtning. Visas för gästen. */
  tillagningsminuter: 30,
  /** Går att beställa i lokalen till ett bord? */
  bordsservering: true,
  /** Högsta bordsnummer som går att välja. */
  antalBord: 20,
  valuta: "sek",
} as const;
