import { NextResponse, type NextRequest } from "next/server";
import { KOK_KAKA, tokenGiltig } from "@/lib/kok-auth";

/**
 * Låser köksskärmen. Allt under /kok och /api/kok kräver en giltig kaka,
 * utom själva inloggningen.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/kok/logga-in" || pathname === "/api/kok/logga-in") {
    return NextResponse.next();
  }

  if (await tokenGiltig(request.cookies.get(KOK_KAKA)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ fel: "Inte inloggad" }, { status: 401 });
  }

  const inloggning = new URL("/kok/logga-in", request.url);
  return NextResponse.redirect(inloggning);
}

export const config = {
  matcher: ["/kok/:path*", "/api/kok/:path*"],
};
