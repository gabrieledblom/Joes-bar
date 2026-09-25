import { NextResponse } from "next/server";
import { hamtaButiksstatus } from "@/lib/db/butik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vad som är slut och om beställningen är pausad. Läses av menyn och kassan. */
export async function GET() {
  return NextResponse.json(await hamtaButiksstatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
