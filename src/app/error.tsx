"use client";

import { useEffect } from "react";
import Link from "next/link";
import { restaurang } from "@/data/restaurang";

/**
 * Visas om något går sönder på servern, t.ex. om databasen inte svarar.
 * Gästen ska få veta vad hen kan göra - och att en betald order inte är
 * borta bara för att sidan inte laddade.
 */
export default function Felsida({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="jb-display text-3xl text-jb-text">Något gick fel</h1>
      <p className="mt-3 text-base text-jb-dampad">
        Sidan kunde inte laddas just nu. Har du betalat är din order inte
        borta - den ligger kvar hos oss.
        {restaurang.telefon ? ` Ring ${restaurang.telefon} om du undrar något.` : ""}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-jb bg-jb-rosa px-6 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork"
        >
          Försök igen
        </button>
        <Link
          href="/"
          className="rounded-jb border border-jb-linje px-6 py-3.5 text-base text-jb-text hover:border-jb-rosa"
        >
          Till startsidan
        </Link>
      </div>
    </main>
  );
}
