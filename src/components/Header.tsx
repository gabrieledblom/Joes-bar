"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon } from "@phosphor-icons/react/dist/ssr";
import { useCart } from "@/lib/cart";
import { Logotyp } from "./Logotyp";

const lankar = [
  { href: "/meny", text: "Meny" },
  { href: "/villkor", text: "Kontakt & villkor" },
];

export function Header() {
  const { antalVaror, laddad } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-jb-linje bg-jb-botten/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logotyp className="text-xl sm:text-2xl" />
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {lankar.map((lank) => {
            const aktiv = pathname.startsWith(lank.href);
            return (
              <Link
                key={lank.href}
                href={lank.href}
                className={`rounded-jb px-2 py-2 text-sm transition-colors sm:px-3 ${
                  aktiv
                    ? "text-jb-rosa"
                    : "text-jb-dampad hover:text-jb-text"
                }`}
              >
                {lank.text}
              </Link>
            );
          })}

          <Link
            href="/kassa"
            className="relative ml-1 flex items-center gap-2 rounded-jb bg-jb-rosa px-3 py-2.5 text-sm font-semibold text-jb-motsatt transition-transform hover:bg-jb-rosa-mork active:scale-[0.98] sm:px-4"
          >
            <BagIcon size={18} weight="bold" aria-hidden />
            <span className="hidden sm:inline">Varukorg</span>
            {/* Antalet renderas först efter hydrering, annars skiljer sig
                serverns HTML från klientens och React varnar. */}
            <span className="tabular-nums" aria-live="polite">
              {laddad && antalVaror > 0 ? antalVaror : ""}
            </span>
            <span className="sr-only">
              {laddad ? `${antalVaror} varor i varukorgen` : "Varukorg"}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
