import { after, NextResponse } from "next/server";
import { hamtaKoksordrar } from "@/lib/db/orders";
import { rensaIBland } from "@/lib/rensning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Köksskärmen frågar den här var tredje sekund. Ett kök på en adress med
 * en skärm behöver ingen websocket: några sekunders fördröjning betyder
 * ingenting när maten tar en halvtimme, och polling överlever både
 * omstarter och dålig wifi utan att någon måste ladda om sidan.
 */
export async function GET() {
  const ordrar = await hamtaKoksordrar();

  // Köksskärmen är öppen varje pass, så här får rensningen av gamla obetalda
  // beställningar en naturlig plats - efter svaret, så pollingen inte väntar.
  after(rensaIBland);

  return NextResponse.json(
    {
      ordrar: ordrar.map((o) => ({
        id: o.id,
        ordernummer: o.ordernummer,
        status: o.status,
        kundNamn: o.kundNamn,
        typ: o.typ,
        bordsnummer: o.bordsnummer,
        notering: o.notering,
        rader: o.rader,
        summaOren: o.summaOren,
        betald: o.betald?.toISOString() ?? null,
        skapad: o.skapad.toISOString(),
      })),
      hamtad: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
