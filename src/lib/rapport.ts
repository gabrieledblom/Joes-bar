import type { Order } from "@/lib/db/schema";
import { stockholmDatum, stockholmKlockslag } from "@/lib/stockholm-datum";

export interface Rapport {
  antalBetalda: number;
  antalAterbetalda: number;
  /** Betalt minus återbetalt, i ören. */
  nettoOren: number;
  aterbetaltOren: number;
  /** Netto per betalsätt, i ören. */
  perBetalsatt: Record<string, number>;
}

export function arAterbetald(order: Order): boolean {
  return order.status === "avbruten" && order.betald !== null;
}

export function betalsattNamn(betaldMed: string | null): string {
  if (betaldMed === "card") return "Kort";
  if (betaldMed === "swish") return "Swish";
  return betaldMed ?? "Okänt";
}

export function sammanstall(ordrar: Order[]): Rapport {
  const rapport: Rapport = {
    antalBetalda: 0,
    antalAterbetalda: 0,
    nettoOren: 0,
    aterbetaltOren: 0,
    perBetalsatt: {},
  };
  for (const order of ordrar) {
    if (!order.betald) continue;
    if (arAterbetald(order)) {
      rapport.antalAterbetalda++;
      rapport.aterbetaltOren += order.summaOren;
      continue;
    }
    rapport.antalBetalda++;
    rapport.nettoOren += order.summaOren;
    const satt = betalsattNamn(order.betaldMed);
    rapport.perBetalsatt[satt] = (rapport.perBetalsatt[satt] ?? 0) + order.summaOren;
  }
  return rapport;
}

/** "183,00" - decimalkomma, som svenska Excel förväntar sig. */
function kronor(oren: number): string {
  return (oren / 100).toFixed(2).replace(".", ",");
}

function cell(text: string): string {
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function radsammanfattning(order: Order): string {
  return order.rader.map((r) => `${r.antal}x ${r.namn}`).join(", ");
}

/**
 * Semikolon och decimalkomma, plus en BOM först i filen - annars visar
 * svenska Excel "Ã¤" i stället för "ä" och lägger allt i en kolumn.
 * Innehåller inga namn eller kontaktuppgifter; bokföringen behöver dem inte.
 */
export function tillCsv(ordrar: Order[]): string {
  const rubriker = [
    "Datum",
    "Tid",
    "Ordernummer",
    "Status",
    "Betalsätt",
    "Belopp kr",
    "Innehåll",
  ];
  const rader = ordrar
    .filter((o) => o.betald)
    .map((o) =>
      [
        stockholmDatum(o.betald!),
        stockholmKlockslag(o.betald!),
        o.ordernummer,
        arAterbetald(o) ? "Återbetald" : "Betald",
        betalsattNamn(o.betaldMed),
        kronor(o.summaOren),
        radsammanfattning(o),
      ]
        .map(cell)
        .join(";"),
    );
  return `﻿${[rubriker.join(";"), ...rader].join("\r\n")}\r\n`;
}
