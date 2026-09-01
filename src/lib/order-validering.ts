import { z } from "zod";
import {
  garAttBestalla,
  hittaRatt,
  kategoriHarSideval,
  kategoriKraverProtein,
  proteinval,
} from "@/data/menu-data";
import { bestallning } from "@/data/restaurang";
import { kronorTillOren } from "./pengar";
import type { OrderRad } from "./db/schema";

/**
 * Allt som kommer från webbläsaren passerar här. Priser skickas aldrig med
 * från klienten - de slås upp i menyn på nytt. Annars kunde vem som helst
 * posta en egen summa och betala 1 krona för en pizza.
 */
export const kundordersSchema = z.object({
  namn: z.string().trim().min(1, "Fyll i ditt namn").max(80),
  telefon: z.string().trim().max(30).optional().default(""),
  epost: z.string().trim().max(160).optional().default(""),
  typ: z.enum(["avhamtning", "bord"]),
  bordsnummer: z.number().int().min(1).max(bestallning.antalBord).nullable(),
  notering: z.string().trim().max(500).optional().default(""),
  rader: z
    .array(
      z.object({
        rattId: z.string().min(1),
        antal: z.number().int().min(1).max(99),
        notering: z.string().trim().max(200).optional().default(""),
        protein: z.enum(proteinval).optional(),
        sideId: z.string().optional(),
      }),
    )
    .min(1, "Varukorgen är tom")
    .max(50),
});

export type Kundorder = z.infer<typeof kundordersSchema>;

export interface ValideradOrder {
  rader: OrderRad[];
  summaOren: number;
}

export class OrderFel extends Error {}

/**
 * Normaliserar ett svenskt mobilnummer till E.164. 46elks kräver det
 * formatet, och utan normalisering skickas inget sms till "070-123 45 67".
 */
export function normaliseraTelefon(inmatning: string): string | null {
  const rensad = inmatning.replace(/[\s()-]/g, "");
  if (rensad.length === 0) return null;
  if (/^\+46\d{7,13}$/.test(rensad)) return rensad;
  if (/^0046\d{7,13}$/.test(rensad)) return `+46${rensad.slice(4)}`;
  if (/^0\d{8,12}$/.test(rensad)) return `+46${rensad.slice(1)}`;
  if (/^\+\d{8,15}$/.test(rensad)) return rensad;
  return null;
}

const epostMonster = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseraEpost(inmatning: string): string | null {
  const rensad = inmatning.trim().toLowerCase();
  if (rensad.length === 0) return null;
  return epostMonster.test(rensad) ? rensad : null;
}

/**
 * Räknar om hela ordern från menyn och avvisar allt som inte går att
 * beställa: okända rätter, rätter utan pris, rätter som är slut, och
 * kebabrätter utan valt protein.
 */
export function valideraOchRaknaOm(order: Kundorder): ValideradOrder {
  if (!bestallning.aktiv) {
    throw new OrderFel("Onlinebeställning är tillfälligt stängd.");
  }

  const rader: OrderRad[] = order.rader.map((rad) => {
    const ratten = hittaRatt(rad.rattId);
    if (!ratten) {
      throw new OrderFel("En rätt i varukorgen finns inte längre på menyn.");
    }
    if (!garAttBestalla(ratten)) {
      throw new OrderFel(`${ratten.namn} går inte att beställa just nu.`);
    }
    if (kategoriKraverProtein.includes(ratten.kategori) && !rad.protein) {
      throw new OrderFel(`Välj protein till ${ratten.namn}.`);
    }

    let sidan;
    if (rad.sideId) {
      if (!kategoriHarSideval.includes(ratten.kategori)) {
        throw new OrderFel(`${ratten.namn} går inte att välja en side till.`);
      }
      sidan = hittaRatt(rad.sideId);
      if (!sidan || sidan.kategori !== "sides" || !garAttBestalla(sidan)) {
        throw new OrderFel("Den valda siden finns inte längre.");
      }
    }

    const styckprisOren =
      kronorTillOren(ratten.pris as number) +
      (sidan ? kronorTillOren(sidan.pris as number) : 0);

    return {
      rattId: ratten.id,
      namn: ratten.namn,
      antal: rad.antal,
      styckprisOren,
      notering: rad.notering ?? "",
      protein: rad.protein,
      sideNamn: sidan?.namn,
    };
  });

  const summaOren = rader.reduce(
    (n, r) => n + r.styckprisOren * r.antal,
    0,
  );

  if (summaOren <= 0) {
    throw new OrderFel("Ordern saknar belopp.");
  }

  if (order.typ === "bord" && order.bordsnummer === null) {
    throw new OrderFel("Välj ett bordsnummer.");
  }

  return { rader, summaOren };
}

/** Kvittot måste kunna nå gästen på minst ett sätt. */
export function kravKontaktvag(order: Kundorder): {
  telefon: string | null;
  epost: string | null;
} {
  const telefon = normaliseraTelefon(order.telefon ?? "");
  const epost = normaliseraEpost(order.epost ?? "");

  if (!telefon && !epost) {
    throw new OrderFel(
      "Fyll i mobilnummer eller e-post så att du kan få ditt kvitto.",
    );
  }
  if ((order.telefon ?? "").trim().length > 0 && !telefon) {
    throw new OrderFel("Mobilnumret ser inte rätt ut. Exempel: 070-123 45 67");
  }
  if ((order.epost ?? "").trim().length > 0 && !epost) {
    throw new OrderFel("E-postadressen ser inte rätt ut.");
  }
  return { telefon, epost };
}
