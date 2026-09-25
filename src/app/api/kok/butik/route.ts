import { NextResponse } from "next/server";
import { z } from "zod";
import { hittaRatt } from "@/data/menu-data";
import { hamtaButiksstatus, sattPausad, sattSlut } from "@/lib/db/butik";

export const runtime = "nodejs";

const schema = z.union([
  z.object({ pausad: z.boolean() }),
  z.object({ rattId: z.string().min(1), slut: z.boolean() }),
]);

/** Köket slår av och på rätter och pausar onlinebeställningen. */
export async function POST(request: Request) {
  const tolkad = schema.safeParse(await request.json().catch(() => null));
  if (!tolkad.success) {
    return NextResponse.json({ fel: "Ogiltig ändring." }, { status: 400 });
  }

  if ("pausad" in tolkad.data) {
    await sattPausad(tolkad.data.pausad);
  } else {
    if (!hittaRatt(tolkad.data.rattId)) {
      return NextResponse.json({ fel: "Rätten finns inte." }, { status: 404 });
    }
    await sattSlut(tolkad.data.rattId, tolkad.data.slut);
  }

  return NextResponse.json(await hamtaButiksstatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
