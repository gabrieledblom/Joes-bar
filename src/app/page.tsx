import Link from "next/link";
import { ArrowRightIcon, PhoneIcon } from "@phosphor-icons/react/dist/ssr";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroScen } from "@/components/HeroScen";
import { OppetSkylt } from "@/components/OppetSkylt";
import { Avslojning } from "@/components/Avslojning";
import { kategorier, ratterIKategori } from "@/data/menu-data";
import { bestallning, restaurang } from "@/data/restaurang";
import { formateraPris } from "@/lib/pengar";

const kategorifarg: Record<string, string> = {
  rosa: "bg-jb-rosa",
  gul: "bg-jb-gul",
  cyan: "bg-jb-cyan",
  orange: "bg-jb-orange",
};

export default function Startsida() {
  return (
    <>
      <Header />

      <main>
        {/* Hero: typdriven, som menyns tryck. Rubrik, brödtext, två knappar. */}
        <section className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden">
          <HeroScen />
          <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:pt-24">
            <OppetSkylt />
            <h1 className="jb-display mt-4 max-w-[16ch] text-5xl leading-[1.02] text-jb-text sm:text-6xl lg:text-7xl">
              Beställ maten.
              <br />
              <span className="text-jb-rosa">Hämta när den är klar.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-base text-jb-dampad sm:text-lg">
              Hela menyn från {restaurang.namn} i {restaurang.ort}. Betala med
              kort eller Swish, så börjar köket direkt.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/meny"
                className="inline-flex items-center gap-2 rounded-jb bg-jb-rosa px-6 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.98]"
              >
                Beställ nu
                <ArrowRightIcon size={18} weight="bold" aria-hidden />
              </Link>
              <a
                href={`tel:${restaurang.telefonE164}`}
                className="inline-flex items-center gap-2 rounded-jb border border-jb-linje px-6 py-3.5 text-base text-jb-text transition-colors hover:border-jb-rosa"
              >
                <PhoneIcon size={18} weight="bold" aria-hidden />
                Ring och beställ
                <span className="hidden text-jb-dampad sm:inline">
                  · {restaurang.telefon}
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Kategorierna som menyns färgfält. Fem rätter, fem fält. */}
        <section className="border-t border-jb-linje bg-jb-botten-2">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <h2 className="jb-display text-3xl text-jb-text sm:text-4xl">
              Vad är du sugen på?
            </h2>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {kategorier.map((kategori) => {
                const ratter = ratterIKategori(kategori.id);
                const priser = ratter
                  .map((r) => r.pris)
                  .filter((p): p is number => p !== null);
                const lagsta = priser.length ? Math.min(...priser) : null;

                return (
                  <Avslojning
                    key={kategori.id}
                    className={
                      // Pizza får dubbel bredd: största kategorin, och rutnätet
                      // blir ojämnt i stället för fem lika stora rutor.
                      kategori.id === "pizza" ? "lg:col-span-2" : ""
                    }
                  >
                    <Link
                      href={`/meny#${kategori.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-jb border border-jb-linje bg-jb-yta transition-colors hover:border-jb-rosa"
                    >
                      <div
                        className={`${kategorifarg[kategori.farg]} px-5 py-4`}
                      >
                        <h3 className="jb-display text-2xl text-jb-motsatt">
                          {kategori.namn}
                        </h3>
                        <p className="mt-0.5 text-xs text-jb-motsatt/85">
                          {kategori.underrubrik}
                        </p>
                      </div>
                      <div className="flex flex-1 items-end justify-between gap-4 px-5 py-4">
                        <span className="text-sm text-jb-dampad">
                          {ratter.length} rätter
                        </span>
                        {lagsta !== null ? (
                          <span className="text-sm text-jb-text">
                            Från {formateraPris(lagsta)}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </Avslojning>
                );
              })}
            </div>
          </div>
        </section>

        {/* Så går det till. Verben är etiketterna, ingen numrering. */}
        <section className="border-t border-jb-linje">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
              <h2 className="jb-display text-3xl text-jb-text sm:text-4xl">
                Så går det till
              </h2>
              <ol className="space-y-8">
                {[
                  {
                    rubrik: "Välj",
                    text: "Plocka ihop din beställning ur menyn. Skriv en notering på en rätt om du vill ha den utan lök.",
                  },
                  {
                    rubrik: "Betala",
                    text: "Kort eller Swish i kassan. Köket får ordern i samma sekund betalningen går igenom.",
                  },
                  {
                    rubrik: "Hämta",
                    text: `Maten är normalt klar efter cirka ${bestallning.tillagningsminuter} minuter. Du får kvitto och ordernummer på sms eller mejl.`,
                  },
                ].map((steg) => (
                  <li
                    key={steg.rubrik}
                    className="jb-avsloj border-l-2 border-jb-rosa pl-5"
                  >
                    <h3 className="jb-display text-xl text-jb-text">
                      {steg.rubrik}
                    </h3>
                    <p className="mt-1.5 max-w-[52ch] text-sm text-jb-dampad">
                      {steg.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
