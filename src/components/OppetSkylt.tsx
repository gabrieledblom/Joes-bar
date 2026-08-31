"use client";

import { useMinut, SERVERMINUT } from "@/lib/klocka";
import { oppetStatus } from "@/lib/oppettider";

/**
 * "Öppet nu" eller "Stängt", räknat på riktiga öppettider i Järna.
 *
 * Renderas tom på servern i stället för att gissa. En skylt som säger
 * "Öppet" på en stängd restaurang är sämre än ingen skylt alls, och den
 * hinner ändå fyllas i innan gästen läst klart rubriken.
 */
export function OppetSkylt() {
  const minut = useMinut();
  if (minut === SERVERMINUT) {
    // Håller höjden så att rubriken inte hoppar när skylten dyker upp.
    return <p className="h-7" aria-hidden />;
  }

  const status = oppetStatus();

  return (
    <p className="flex h-7 items-center gap-2 text-sm">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          status.oppet ? "bg-jb-cyan" : "bg-jb-dampad"
        }`}
        aria-hidden
      />
      {status.oppet ? (
        <span className="text-jb-text">
          Öppet nu
          {status.stangerKl ? (
            <span className="text-jb-dampad"> · stänger {status.stangerKl}</span>
          ) : null}
        </span>
      ) : (
        <span className="text-jb-dampad">
          Stängt
          {status.oppnarKl ? <span> · öppnar {status.oppnarKl}</span> : null}
        </span>
      )}
    </p>
  );
}
