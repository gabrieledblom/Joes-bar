import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RattRad } from "@/components/RattRad";
import { KorgFot } from "@/components/KorgFot";
import { KategoriNav } from "@/components/KategoriNav";
import { kategorier, ratterIKategori } from "@/data/menu-data";
import { bestallning } from "@/data/restaurang";

export const metadata: Metadata = {
  title: "Meny",
  description:
    "Pizza, smash burgare, kebab och gyros, sides. Beställ online och hämta i Järna.",
};

const rubrikfarg: Record<string, string> = {
  rosa: "bg-jb-rosa",
  gul: "bg-jb-gul",
  cyan: "bg-jb-cyan",
  orange: "bg-jb-orange",
};

export default function Menysida() {
  return (
    <>
      <Header />
      <KategoriNav />

      <main className="mx-auto w-full max-w-3xl px-4 pb-40 pt-10 sm:px-6">
        <h1 className="jb-display text-4xl text-jb-text sm:text-5xl">Menyn</h1>
        <p className="mt-3 max-w-[54ch] text-sm text-jb-dampad">
          Tryck på en rätt för att lägga den i varukorgen. Maten är normalt
          klar för avhämtning efter cirka {bestallning.tillagningsminuter}{" "}
          minuter.
        </p>

        {!bestallning.aktiv ? (
          <p
            role="status"
            className="mt-6 rounded-jb border border-jb-orange/50 bg-jb-orange/10 px-4 py-3 text-sm text-jb-text"
          >
            Onlinebeställning är tillfälligt stängd. Menyn gäller fortfarande i
            lokalen.
          </p>
        ) : null}

        {kategorier.map((kategori) => {
          const ratter = ratterIKategori(kategori.id);
          if (ratter.length === 0) return null;

          return (
            <section
              key={kategori.id}
              id={kategori.id}
              // Rubriken ska inte hamna under den klistrade navigeringen
              // när man hoppar hit via ankarlänk.
              className="scroll-mt-32 pt-12"
            >
              <div
                className={`${rubrikfarg[kategori.farg]} rounded-t-jb px-5 py-4`}
              >
                <h2 className="jb-display text-2xl text-jb-motsatt sm:text-3xl">
                  {kategori.namn}
                </h2>
                <p className="mt-0.5 text-xs text-jb-motsatt/85">
                  {kategori.underrubrik}
                </p>
              </div>

              <ul className="rounded-b-jb border border-t-0 border-jb-linje px-5">
                {ratter.map((ratt) => (
                  <RattRad key={ratt.id} ratt={ratt} />
                ))}
              </ul>
            </section>
          );
        })}
      </main>

      <KorgFot />
      <Footer />
    </>
  );
}
