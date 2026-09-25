import { NextResponse } from "next/server";
import { hamtaBetaldaOrdrar } from "@/lib/db/orders";
import { tillCsv } from "@/lib/rapport";
import { manadensGranser, stockholmDatum } from "@/lib/stockholm-datum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Månadens betalda ordrar som en csv-fil för bokföringen. ?manad=2026-09 */
export async function GET(request: Request) {
  const manad =
    new URL(request.url).searchParams.get("manad") ??
    stockholmDatum(new Date()).slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(manad)) {
    return NextResponse.json({ fel: "Ange månad som 2026-09." }, { status: 400 });
  }

  const { fran, till } = manadensGranser(manad);
  const csv = tillCsv(await hamtaBetaldaOrdrar(fran, till));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="joesbar-ordrar-${manad}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
