import {
  oppettider,
  type Oppettid,
  type Veckodag,
} from "@/data/restaurang";

/**
 * Öppet eller stängt just nu, räknat i restaurangens tid.
 *
 * Allt räknas i Europe/Stockholm, aldrig i besökarens egen tidszon. En gäst
 * som sitter på tåget hem från Berlin ska se Järnas öppettider, inte sina
 * egna.
 *
 * Stängning efter midnatt skrivs som mer än 24 i restaurang.ts: fredagens
 * "25:00" betyder 01:00 natten till lördag. Klockan 00:15 natt mot lördag
 * hör alltså till fredagens pass.
 */

const TIDSZON = "Europe/Stockholm";

const veckodagar: Veckodag[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

const kortnamn: Record<string, Veckodag> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

export interface Klockslag {
  dag: Veckodag;
  /** Minuter sedan midnatt. */
  minut: number;
}

/** Veckodag och klockslag i Järna, oavsett var besökaren befinner sig. */
export function stockholmstid(datum: Date): Klockslag {
  const delar = new Intl.DateTimeFormat("en-US", {
    timeZone: TIDSZON,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(datum);

  const hitta = (typ: string) =>
    delar.find((d) => d.type === typ)?.value ?? "";

  const dag = kortnamn[hitta("weekday")] ?? "mon";
  // "24" förekommer som midnatt i vissa körtider.
  const timme = Number(hitta("hour")) % 24;
  const minut = Number(hitta("minute"));

  return { dag, minut: timme * 60 + minut };
}

function tillMinuter(hhmm: string): number {
  const [timme, minut] = hhmm.split(":").map(Number);
  return timme * 60 + minut;
}

function foregaende(dag: Veckodag): Veckodag {
  const i = veckodagar.indexOf(dag);
  return veckodagar[(i + 6) % 7];
}

function nasta(dag: Veckodag): Veckodag {
  const i = veckodagar.indexOf(dag);
  return veckodagar[(i + 1) % 7];
}

function fonster(dag: Veckodag): Oppettid | null {
  return oppettider[dag];
}

export interface Oppetstatus {
  oppet: boolean;
  /**
   * Hur långt vi kommit, 0 till 1. Under öppet räknas passet från öppning
   * till stängning. Under stängt räknas tiden fram till nästa öppning.
   * Driver solens och månens bana över himlen.
   */
  andel: number;
  /** "14:30" när det är stängt och vi vet när det öppnar igen. */
  oppnarKl: string | null;
  /** "23:00" medan det är öppet. */
  stangerKl: string | null;
}

/** Minuter kvar tills stället öppnar igen, räknat från ett klockslag. */
function tillNastaOppning(fran: Klockslag): {
  minuter: number;
  oppnarKl: string;
} | null {
  let dag = fran.dag;
  let forskjutning = 0;

  for (let i = 0; i < 8; i++) {
    const tid = fonster(dag);
    if (tid) {
      const oppnar = tillMinuter(tid.open);
      const absolut = forskjutning + oppnar;
      if (absolut > fran.minut) {
        return { minuter: absolut - fran.minut, oppnarKl: tid.open };
      }
    }
    dag = nasta(dag);
    forskjutning += 1440;
  }
  return null;
}

export function oppetStatus(datum: Date = new Date()): Oppetstatus {
  const nu = stockholmstid(datum);

  // Gårdagens pass kan sträcka sig förbi midnatt och alltså gälla nu.
  const igar = fonster(foregaende(nu.dag));
  if (igar) {
    const stanger = tillMinuter(igar.close);
    if (stanger > 1440 && nu.minut < stanger - 1440) {
      const oppnar = tillMinuter(igar.open);
      const passlangd = stanger - oppnar;
      const gangen = nu.minut + 1440 - oppnar;
      return {
        oppet: true,
        andel: klamp(gangen / passlangd),
        oppnarKl: null,
        stangerKl: formateraKlockslag(stanger),
      };
    }
  }

  const idag = fonster(nu.dag);
  if (idag) {
    const oppnar = tillMinuter(idag.open);
    const stanger = tillMinuter(idag.close);
    if (nu.minut >= oppnar && nu.minut < stanger) {
      return {
        oppet: true,
        andel: klamp((nu.minut - oppnar) / (stanger - oppnar)),
        oppnarKl: null,
        stangerKl: formateraKlockslag(stanger),
      };
    }
  }

  const kommande = tillNastaOppning(nu);

  // Månens bana under en stängd period räknas inte mot schemat - en hel
  // stängd måndag är 24 timmar, en natt mellan två pass kan vara 13. Bundet
  // till den längden skulle månen antingen stå still i timtal eller (som i
  // en tidigare version) räkna baklänges och hamna gömd bakom huset. En
  // egen, kort cykel ger i stället en jämn, aldrig avstannande rörelse
  // oavsett hur länge det är stängt.
  const MANCYKEL_MINUTER = 6 * 60;
  const andel = (nu.minut % MANCYKEL_MINUTER) / MANCYKEL_MINUTER;

  return {
    oppet: false,
    andel,
    oppnarKl: kommande?.oppnarKl ?? null,
    stangerKl: null,
  };
}

/** "25:00" betyder 01:00 natten efter. Gästen ska läsa 01:00. */
export function formateraKlockslag(minuter: number): string {
  const m = ((minuter % 1440) + 1440) % 1440;
  const timme = Math.floor(m / 60);
  return `${String(timme).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function klamp(v: number): number {
  return Math.min(1, Math.max(0, v));
}
