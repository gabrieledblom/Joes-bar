/* ============================================================================
 * MENYN - ENDA STÄLLET DÄR RÄTTER OCH PRISER ÄNDRAS
 * ============================================================================
 *
 * Vill du ändra ett pris, lägga till en rätt eller ta bort något ur menyn?
 * Gör det HÄR. Ingen annan fil behöver röras. Priserna slår igenom överallt:
 * menyn, varukorgen, betalningen, kvittot och köksskärmen.
 *
 * ATT ÄNDRA ETT PRIS
 *   pris: 113   ->   pris: 119
 *
 * ATT SÄTTA PRIS PÅ EN RÄTT SOM SAKNAR DET
 *   pris: null  ->   pris: 129
 *   Så länge priset är null visas "Pris kommer snart" och rätten går inte
 *   att lägga i varukorgen. Ingen gäst kan beställa något utan pris.
 *
 * ATT TILLFÄLLIGT TA BORT EN RÄTT (slut i köket)
 *   tillganglig: true  ->  tillganglig: false
 *
 * Alla priser anges i hela kronor.
 * ==========================================================================*/

export type Kategori =
  | "pizza"
  | "smash-burgare"
  | "kebab-gyros"
  | "sides"
  | "andra-alternativ";

export interface MenuItem {
  id: string;
  kategori: Kategori;
  namn: string;
  beskrivning: string;
  /** Hela kronor. null = priset är inte satt än; rätten går inte att beställa. */
  pris: number | null;
  bildUrl?: string;
  tillganglig: boolean;
}

export interface KategoriInfo {
  id: Kategori;
  namn: string;
  underrubrik: string;
  /** Styr kategorins identitetsfärg. Se src/app/globals.css. */
  farg: "rosa" | "gul" | "cyan" | "orange";
}

/* -------------------------------------------------------------------------
 * Kategorierna, i den ordning de visas.
 * ---------------------------------------------------------------------- */
export const kategorier: KategoriInfo[] = [
  {
    id: "pizza",
    namn: "Pizza",
    underrubrik: "Bakade på plats",
    farg: "rosa",
  },
  {
    id: "smash-burgare",
    namn: "Smash Burgare",
    underrubrik: "Serveras med pommes",
    farg: "gul",
  },
  {
    id: "kebab-gyros",
    namn: "Kebab & Gyros",
    underrubrik: "Kebab · Gyros · Kyckling · Falafel · Halloumi",
    farg: "gul",
  },
  {
    id: "sides",
    namn: "Sides",
    underrubrik: "Serveras som tillbehör eller för sig",
    farg: "cyan",
  },
  {
    id: "andra-alternativ",
    namn: "Andra alternativ",
    underrubrik: "Utöver menyn",
    farg: "orange",
  },
];

/* -------------------------------------------------------------------------
 * RÄTTERNA
 * ---------------------------------------------------------------------- */
export const menyn: MenuItem[] = [
  /* ---- PIZZA ---------------------------------------------------------- */
  {
    id: "pizza-the-classic",
    kategori: "pizza",
    namn: "The Classic",
    beskrivning: "Tomatsås & ost",
    pris: 113,
    tillganglig: true,
  },
  {
    id: "pizza-ham-cheese",
    kategori: "pizza",
    namn: "Ham & Cheese",
    beskrivning: "Skinka",
    pris: 117,
    tillganglig: true,
  },
  {
    id: "pizza-pineapple",
    kategori: "pizza",
    namn: "Pineapple",
    beskrivning: "Skinka & ananas",
    pris: 121,
    tillganglig: true,
  },
  {
    id: "pizza-capri",
    kategori: "pizza",
    namn: "Capri",
    beskrivning: "Skinka & räkor",
    pris: 121,
    tillganglig: true,
  },
  {
    id: "pizza-the-fold",
    kategori: "pizza",
    namn: "The Fold",
    beskrivning: "Inbakad med skinka",
    pris: 117,
    tillganglig: true,
  },
  {
    id: "pizza-veggie",
    kategori: "pizza",
    namn: "Veggie",
    beskrivning: "Champinjoner, paprika, lök & oliver",
    pris: 121,
    tillganglig: true,
  },
  {
    id: "pizza-new-yorker",
    kategori: "pizza",
    namn: "New Yorker",
    beskrivning: "Pepperoni, lök & paprika",
    pris: 126,
    tillganglig: true,
  },
  {
    id: "pizza-kebaben",
    kategori: "pizza",
    namn: "Kebaben",
    beskrivning: "Isbergssallad, lök, tomat, fefferoni & kebabsås",
    pris: 137,
    tillganglig: true,
  },
  {
    id: "pizza-gyrosen",
    kategori: "pizza",
    namn: "Gyrosen",
    beskrivning: "Isbergssallad, lök, tomat, fefferoni & kebabsås",
    pris: 137,
    tillganglig: true,
  },
  {
    id: "pizza-kyckling-kebaben",
    kategori: "pizza",
    namn: "Kyckling Kebaben",
    beskrivning: "Isbergssallad, lök, tomat, fefferoni & kebabsås",
    pris: 137,
    tillganglig: true,
  },

  /* ---- SMASH BURGARE ---------------------------------------------------
   * Alla smash-burgare kostar samma pris.
   * ------------------------------------------------------------------- */
  {
    id: "burgare-joes-original",
    kategori: "smash-burgare",
    namn: "Joe's Original",
    beskrivning: "Cheddar, lök & husets dressing",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-smokey-west",
    kategori: "smash-burgare",
    namn: "Smokey West",
    beskrivning: "BBQ, bacon & rökt cheddar",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-bacon-blvd",
    kategori: "smash-burgare",
    namn: "Bacon Blvd",
    beskrivning: "Cheddar, bacon & dressing",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-crispy-bird",
    kategori: "smash-burgare",
    namn: "Crispy Bird",
    beskrivning: "Krispig kyckling, cheddar & aioli",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-black-gold",
    kategori: "smash-burgare",
    namn: "Black Gold",
    beskrivning: "Tryffelmajonnäs & cheddar",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-firebird",
    kategori: "smash-burgare",
    namn: "Firebird",
    beskrivning: "Krispig kyckling, jalapeño & chillimajonnäs",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-hot-shot",
    kategori: "smash-burgare",
    namn: "Hot Shot",
    beskrivning: "Jalapeño, cheddar & chillimajonnäs",
    pris: 147,
    tillganglig: true,
  },
  {
    id: "burgare-green-light",
    kategori: "smash-burgare",
    namn: "Green Light",
    beskrivning: "Halloumi & aioli",
    pris: 147,
    tillganglig: true,
  },

  /* ---- KEBAB & GYROS -------------------------------------------------- */
  {
    id: "kebab-salladbowl",
    kategori: "kebab-gyros",
    namn: "Salladbowl",
    beskrivning: "Isbergssallad, rödkål, lök, gurka, tomat, fefferoni & sås",
    pris: 123,
    tillganglig: true,
  },
  {
    id: "kebab-tallrik",
    kategori: "kebab-gyros",
    namn: "Tallrik",
    beskrivning:
      "Isbergssallad, rödkål, lök, gurka, tomat, fefferoni, saltgurka & sås. Välj mellan ris eller pommes",
    pris: 134,
    tillganglig: true,
  },
  {
    id: "kebab-rulle",
    kategori: "kebab-gyros",
    namn: "Rulle",
    beskrivning: "Isbergssallad, lök, gurka, tomat & sås",
    pris: 117,
    tillganglig: true,
  },
  {
    id: "kebab-macka",
    kategori: "kebab-gyros",
    namn: "Macka",
    beskrivning: "Isbergssallad, rödkål, lök, gurka, tomat, fefferoni & sås",
    pris: 127,
    tillganglig: true,
  },
  {
    id: "kebab-baguette",
    kategori: "kebab-gyros",
    namn: "Baguette",
    beskrivning: "Isbergssallad, rödkål, lök, gurka, tomat, fefferoni & sås",
    pris: 127,
    tillganglig: true,
  },

  /* ---- SIDES ---------------------------------------------------------- */
  {
    id: "side-vitloksbrod",
    kategori: "sides",
    namn: "Vitlöksbröd",
    beskrivning: "Nybakat bröd med vitlökssmör",
    pris: 47,
    tillganglig: true,
  },
  {
    id: "side-pommes",
    kategori: "sides",
    namn: "Pommes",
    beskrivning: "Klassiska pommes frites",
    pris: 47,
    tillganglig: true,
  },
  {
    id: "side-sweet-potato-fries",
    kategori: "sides",
    namn: "Sweet Potato Fries",
    beskrivning: "Friterad sötpotatis",
    pris: 77,
    tillganglig: true,
  },
  {
    id: "side-chillie-cheese-mix",
    kategori: "sides",
    namn: "Chillie Cheese Mix (6 st)",
    beskrivning: "Friterade ostbollar",
    pris: 41,
    tillganglig: true,
  },
  {
    id: "side-mozzarella-sticks",
    kategori: "sides",
    namn: "Mozzarella Sticks (4 st)",
    beskrivning: "Panerad & friterad mozzarella",
    pris: 48,
    tillganglig: true,
  },
  {
    id: "side-onionrings",
    kategori: "sides",
    namn: "Onionrings (6 st)",
    beskrivning: "Krispiga friterade lökringar",
    pris: 41,
    tillganglig: true,
  },
  {
    id: "side-crispy-halloumi-fries",
    kategori: "sides",
    namn: "Crispy Halloumi Fries",
    beskrivning: "Friterad halloumi, ej panerad",
    pris: 77,
    tillganglig: true,
  },
  {
    id: "side-buffalo-wings",
    kategori: "sides",
    namn: "Buffalo Wings (6 st)",
    beskrivning: "Kryddiga kycklingvingar med buffalosås",
    pris: 91,
    tillganglig: true,
  },
  {
    id: "side-chicken-bites",
    kategori: "sides",
    namn: "Chicken Bites (4 st)",
    beskrivning: "Krispiga friterade kycklingbitar",
    pris: 87,
    tillganglig: true,
  },
  {
    id: "side-cornribs",
    kategori: "sides",
    namn: "Cornribs",
    beskrivning: "Friterade majskolvsbitar",
    pris: 67,
    tillganglig: true,
  },
  {
    id: "side-dirty-fries",
    kategori: "sides",
    namn: "Dirty Fries",
    beskrivning: "Loaded pommes med topping",
    pris: 87,
    tillganglig: true,
  },
  {
    id: "side-bacon-loaded-fries",
    kategori: "sides",
    namn: "Bacon Loaded Fries",
    beskrivning: "Pommes med bacon, ost & sås",
    pris: 87,
    tillganglig: true,
  },

  /* ---- ANDRA ALTERNATIV ------------------------------------------------
   * Priserna saknas på tryckta menyn. Sätt dem här när de är bestämda.
   * ------------------------------------------------------------------- */
  {
    id: "annat-fish-and-chips",
    kategori: "andra-alternativ",
    namn: "Fish & Chips",
    beskrivning: "Panerad fisk med pommes",
    pris: null,
    tillganglig: true,
  },
  {
    id: "annat-ribs",
    kategori: "andra-alternativ",
    namn: "Ribs",
    beskrivning: "Ugnsbakade revben med bbq-sås",
    pris: null,
    tillganglig: true,
  },
];

/* -------------------------------------------------------------------------
 * TILLVAL: protein till Kebab & Gyros.
 * Gästen måste välja ett. Kostar inget extra, men köket behöver veta.
 * ---------------------------------------------------------------------- */
export const proteinval = [
  "Kebab",
  "Gyros",
  "Kyckling",
  "Falafel",
  "Halloumi",
] as const;

export type Protein = (typeof proteinval)[number];

/** Rätter i den här kategorin kräver att gästen väljer protein. */
export const kategoriKraverProtein: Kategori[] = ["kebab-gyros"];

/* -------------------------------------------------------------------------
 * Uppslag som resten av appen använder. Rör inte.
 * ---------------------------------------------------------------------- */
const menyIndex = new Map(menyn.map((r) => [r.id, r]));

export function hittaRatt(id: string): MenuItem | undefined {
  return menyIndex.get(id);
}

/** En rätt går att beställa bara om den har ett pris och inte är slut. */
export function garAttBestalla(ratt: MenuItem): boolean {
  return ratt.tillganglig && ratt.pris !== null;
}

export function ratterIKategori(kategori: Kategori): MenuItem[] {
  return menyn.filter((r) => r.kategori === kategori);
}
