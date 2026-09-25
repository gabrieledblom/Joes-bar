import { NextResponse } from "next/server";
import { KOK_KAKA } from "@/lib/kok-auth";

export const runtime = "nodejs";

/** Loggar ut den här enheten. Vill ni logga ut alla, byt lösenordet i Vercel. */
export async function POST() {
  const svar = NextResponse.json({ ok: true });
  svar.cookies.set(KOK_KAKA, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return svar;
}
