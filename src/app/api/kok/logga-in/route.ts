import { NextResponse } from "next/server";
import {
  KOK_KAKA,
  harKoksLosenord,
  losenordStammer,
  skapaKoksToken,
} from "@/lib/kok-auth";
import {
  antalForsok,
  klientIp,
  nollstallForsok,
  registreraForsok,
} from "@/lib/db/begransning";

export const runtime = "nodejs";

/** Så många fel lösenord från samma ip, sedan är det stopp en stund. */
const MAX_FEL = 10;
const FONSTER_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!harKoksLosenord()) {
    return NextResponse.json(
      { fel: "Köksskärmen är inte konfigurerad. Sätt KITCHEN_DASHBOARD_PASSWORD." },
      { status: 503 },
    );
  }

  // Köksskärmen kan återbetala ordrar, så lösenordet får inte gå att gissa
  // fram. Tio fel på en kvart från samma ip låser den ip:n resten av
  // kvarten - även för rätt lösenord, annars vet angriparen när den träffat.
  const nyckel = `inlogg:${klientIp(request)}`;
  if ((await antalForsok(nyckel, FONSTER_MS)) >= MAX_FEL) {
    return NextResponse.json(
      { fel: "För många försök. Vänta en kvart och försök igen." },
      { status: 429 },
    );
  }

  const data = await request.formData();
  const losenord = String(data.get("losenord") ?? "");

  if (!losenordStammer(losenord)) {
    await registreraForsok(nyckel);
    return NextResponse.json({ fel: "Fel lösenord." }, { status: 401 });
  }

  await nollstallForsok(nyckel);
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
