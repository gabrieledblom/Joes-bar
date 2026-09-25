import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function HittadesInte() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
        <p className="jb-display text-6xl text-jb-rosa">404</p>
        <h1 className="jb-display mt-4 text-3xl text-jb-text">
          Sidan finns inte
        </h1>
        <p className="mt-3 text-base text-jb-dampad">
          Länken kan vara felskriven eller gammal. Menyn finns kvar där den
          brukar.
        </p>
        <Link
          href="/meny"
          className="mt-8 inline-block rounded-jb bg-jb-rosa px-6 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork"
        >
          Till menyn
        </Link>
      </main>
      <Footer />
    </>
  );
}
