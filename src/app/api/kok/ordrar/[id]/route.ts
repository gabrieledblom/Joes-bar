import { NextResponse } from "next/server";
import { z } from "zod";
import { hamtaOrder, uppdateraOrder } from "@/lib/db/orders";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["ny", "tillagas", "klar", "levererad"]),
});

/** Personalen flyttar en order framåt i kedjan. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const tolkad = schema.safeParse(await request.json().catch(() => null));
  if (!tolkad.success) {
    return NextResponse.json({ fel: "Ogiltig status." }, { status: 400 });
  }

  const order = await hamtaOrder(id);
  if (!order) {
    return NextResponse.json({ fel: "Ordern finns inte." }, { status: 404 });
  }

  // En obetald order får aldrig flyttas in i köket från skärmen. Bara
  // Stripes webhook öppnar den vägen.
  if (order.status === "vantar_betalning" || order.status === "avbruten") {
    return NextResponse.json(
      { fel: "Ordern är inte betald." },
      { status: 409 },
    );
  }

  const uppdaterad = await uppdateraOrder(id, { status: tolkad.data.status });
  return NextResponse.json({ status: uppdaterad?.status });
}
