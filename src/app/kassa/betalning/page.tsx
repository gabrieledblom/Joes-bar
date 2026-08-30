import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Betalning } from "@/components/Betalning";

export const metadata: Metadata = {
  title: "Betalning",
  robots: { index: false, follow: false },
};

export default function Betalningssida() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <h1 className="jb-display text-4xl text-jb-text sm:text-5xl">
          Betalning
        </h1>
        <Suspense
          fallback={
            <div
              aria-busy="true"
              aria-label="Laddar betalning"
              className="mt-8 h-64 animate-pulse rounded-jb border border-jb-linje bg-jb-yta"
            />
          }
        >
          <Betalning />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
