import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Kassa } from "@/components/Kassa";

export const metadata: Metadata = {
  title: "Kassa",
  robots: { index: false, follow: false },
};

export default function Kassasida() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="jb-display text-4xl text-jb-text sm:text-5xl">Kassa</h1>
        <Kassa />
      </main>
      <Footer />
    </>
  );
}
