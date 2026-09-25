"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReceiptIcon, SignOutIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { kategorier, ratterIKategori } from "@/data/menu-data";
import { useButik } from "@/lib/butik-klient";
import type { Butiksstatus } from "@/lib/db/butik";

/**
 * Det köket ändrar under ett pass: pausa onlinebeställningen, markera rätter
 * som slut. Allt nollställs av sig självt kl 05 nästa morgon.
 */
export function KokMenyPanel({ stang }: { stang: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { pausad, slut, ersatt } = useButik();
  const [sparar, setSparar] = useState<string | null>(null);
  const [fel, setFel] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  async function andra(nyckel: string, kropp: object) {
    setSparar(nyckel);
    setFel("");
    try {
      const svar = await fetch("/api/kok/butik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kropp),
      });
      if (!svar.ok) throw new Error();
      ersatt((await svar.json()) as Butiksstatus);
    } catch {
      setFel("Ändringen sparades inte. Kontrollera uppkopplingen och försök igen.");
    } finally {
      setSparar(null);
    }
  }

  async function loggaUt() {
    await fetch("/api/kok/logga-ut", { method: "POST" }).catch(() => {});
    router.push("/kok/logga-in");
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={stang}
      onClick={(e) => {
        if (e.target === dialogRef.current) stang();
      }}
      aria-labelledby="kokmeny-rubrik"
      className="m-auto max-h-[90dvh] w-[min(44rem,calc(100vw-2rem))] rounded-jb border border-jb-linje bg-jb-yta p-0 text-jb-text backdrop:bg-black/70"
    >
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-jb-linje bg-jb-yta px-5 py-4">
        <h2 id="kokmeny-rubrik" className="jb-display text-2xl">
          Meny & mer
        </h2>
        <button
          type="button"
          onClick={stang}
          aria-label="Stäng"
          className="ml-auto rounded-jb p-2 text-jb-dampad hover:text-jb-text"
        >
          <XIcon size={22} weight="bold" aria-hidden />
        </button>
      </div>

      <div className="space-y-8 px-5 py-5">
        {fel ? (
          <p role="alert" className="rounded-jb border border-jb-orange/50 bg-jb-orange/10 px-4 py-3 text-sm">
            {fel}
          </p>
        ) : null}

        <section>
          <h3 className="jb-display text-lg">Onlinebeställning</h3>
          <p className="mt-1 text-sm text-jb-dampad">
            {pausad
              ? "Pausad. Gäster kan se menyn men inte beställa online."
              : "Öppen. Gäster kan beställa och betala online."}{" "}
            En paus släpps av sig själv kl 05 i morgon bitti.
          </p>
          <button
            type="button"
            disabled={sparar !== null}
            onClick={() => andra("pausad", { pausad: !pausad })}
            className={`mt-3 w-full rounded-jb px-4 py-4 text-lg font-semibold transition-colors disabled:opacity-60 ${
              pausad
                ? "bg-jb-rosa text-jb-motsatt hover:bg-jb-rosa-mork"
                : "border-2 border-jb-orange text-jb-orange hover:bg-jb-orange/10"
            }`}
          >
            {pausad ? "Öppna onlinebeställningen igen" : "Pausa onlinebeställningen"}
          </button>
        </section>

        <section>
          <h3 className="jb-display text-lg">
            Slut för i dag
            {slut.size > 0 ? (
              <span className="ml-2 text-jb-orange tabular-nums">{slut.size}</span>
            ) : null}
          </h3>
          <p className="mt-1 text-sm text-jb-dampad">
            Tryck på det som tagit slut. Det försvinner ur onlinemenyn och
            kommer tillbaka av sig självt i morgon.
          </p>

          <div className="mt-4 space-y-5">
            {kategorier.map((kategori) => (
              <fieldset key={kategori.id}>
                <legend className="text-sm font-medium text-jb-dampad">
                  {kategori.namn}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ratterIKategori(kategori.id).map((ratt) => {
                    const arSlut = slut.has(ratt.id);
                    return (
                      <button
                        key={ratt.id}
                        type="button"
                        aria-pressed={arSlut}
                        disabled={sparar === ratt.id}
                        onClick={() => andra(ratt.id, { rattId: ratt.id, slut: !arSlut })}
                        className={`rounded-jb border px-3.5 py-2.5 text-sm transition-colors disabled:opacity-60 ${
                          arSlut
                            ? "border-jb-orange bg-jb-orange text-jb-motsatt line-through"
                            : "border-jb-linje text-jb-text hover:border-jb-dampad"
                        }`}
                      >
                        {ratt.namn}
                        {arSlut ? <span className="sr-only"> (slut)</span> : null}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-3 border-t border-jb-linje pt-6">
          <Link
            href="/kok/historik"
            className="inline-flex items-center gap-2 rounded-jb border border-jb-linje px-4 py-3 text-sm hover:border-jb-rosa"
          >
            <ReceiptIcon size={18} aria-hidden />
            Historik & dagsrapport
          </Link>
          <button
            type="button"
            onClick={loggaUt}
            className="inline-flex items-center gap-2 rounded-jb border border-jb-linje px-4 py-3 text-sm text-jb-dampad hover:border-jb-orange hover:text-jb-text"
          >
            <SignOutIcon size={18} aria-hidden />
            Logga ut den här enheten
          </button>
        </section>
      </div>
    </dialog>
  );
}
