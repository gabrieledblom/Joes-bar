import { NextResponse } from "next/server";
import {
  KOK_KAKA,
  harKoksLosenord,
  losenordStammer,
  skapaKoksToken,
} from "@/lib/kok-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!harKoksLosenord()) {
    return NextResponse.json(
      { fel: "Köksskärmen är inte konfigurerad. Sätt KITCHEN_DASHBOARD_PASSWORD." },
      { status: 503 },
    );
  }

  const data = await request.formData();
  const losenord = String(data.get("losenord") ?? "");

  if (!losenordStammer(losenord)) {
    return NextResponse.json({ fel: "Fel lösenord." }, { status: 401 });
  }

  const token = await skapaKoksToken();
  const svar = NextResponse.json({ ok: true });
  svar.cookies.set(KOK_KAKA, token.varde, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: token.maxAlder,
  });
  return svar;
}
