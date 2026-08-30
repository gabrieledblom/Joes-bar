import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  bestallning,
  dagNamn,
  dagOrdning,
  oppettider,
  restaurang,
} from "@/data/restaurang";
import { kategorier, ratterIKategori } from "@/data/menu-data";
import { formateraPris } from "@/lib/pengar";

export const metadata: Metadata = {
  title: "Kontakt och villkor",
  description:
    "Kontaktuppgifter, betalning, avhämtningstider och köpvillkor för Joe's Bar i Järna.",
};

/**
 * Sidan som Stripes Swish-villkor kräver: vem säljaren är, hur gästen når
 * oss, vad varorna kostar, när maten hämtas och vilka villkor som gäller.
 */
export default function Villkorssida() {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="jb-display text-4xl text-jb-text sm:text-5xl">
          Kontakt och villkor
        </h1>

        <Avsnitt rubrik="Säljare">
          <p>
            {restaurang.namn}, {restaurang.tagline} i {restaurang.ort},{" "}
            {restaurang.land}.
          </p>
          {restaurang.adress.gata ? (
            <p className="mt-2">
              {restaurang.adress.gata}
              <br />
              {restaurang.adress.postnummer} {restaurang.adress.postort}
            </p>
          ) : (
            <p className="mt-2 text-jb-orange">
              Gatuadress fylls i innan sajten publiceras.
            </p>
          )}
          {restaurang.orgnr ? (
            <p className="mt-2">Organisationsnummer {restaurang.orgnr}</p>
          ) : null}
        </Avsnitt>

        <Avsnitt rubrik="Kontakt">
          {restaurang.telefonE164 ? (
            <p>
              Telefon{" "}
              <a
                href={`tel:${restaurang.telefonE164}`}
                className="text-jb-rosa underline underline-offset-2"
              >
                {restaurang.telefon}
              </a>
            </p>
          ) : (
            <p className="text-jb-orange">
              Telefonnummer fylls i innan sajten publiceras.
            </p>
          )}
          {restaurang.epost ? (
            <p className="mt-2">
              E-post{" "}
              <a
                href={`mailto:${restaurang.epost}`}
                className="text-jb-rosa underline underline-offset-2"
              >
                {restaurang.epost}
              </a>
            </p>
          ) : null}
        </Avsnitt>

        <Avsnitt rubrik="Öppettider">
          <dl className="space-y-1">
            {dagOrdning.map((dag) => {
              const tid = oppettider[dag];
              return (
                <div key={dag} className="flex justify-between gap-6">
                  <dt>{dagNamn[dag]}</dt>
                  <dd className="tabular-nums text-jb-text">
                    {tid
                      ? `${tid.open} - ${stangning(tid.close)}`
                      : "Stängt"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Avsnitt>

        <Avsnitt rubrik="Vad vi säljer och vad det kostar">
          <p>
            Vi lagar och säljer mat för avhämtning och servering i lokalen.
            Priserna nedan är i svenska kronor och inkluderar moms. Hela
            sortimentet med beskrivningar finns på{" "}
            <Link href="/meny" className="text-jb-rosa underline underline-offset-2">
              menyn
            </Link>
            .
          </p>
          <ul className="mt-4 space-y-2">
            {kategorier.map((kategori) => {
              const priser = ratterIKategori(kategori.id)
                .map((r) => r.pris)
                .filter((p): p is number => p !== null);
              return (
                <li key={kategori.id} className="flex justify-between gap-6">
                  <span>{kategori.namn}</span>
                  <span className="tabular-nums text-jb-text">
                    {priser.length === 0
                      ? "Pris kommer snart"
                      : priser.length === 1
                        ? formateraPris(priser[0])
                        : `${formateraPris(Math.min(...priser))} - ${formateraPris(
                            Math.max(...priser),
                          )}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Avsnitt>

        <Avsnitt rubrik="Betalning">
          <p>
            Betalning sker i förskott via Stripe med kort eller Swish. Beloppet
            dras när du bekräftar betalningen. Din order registreras hos oss
            först när betalningen är genomförd; avbryter du betalningen skapas
            ingen beställning och inga pengar dras.
          </p>
          <p className="mt-3">
            Vi hanterar aldrig dina kortuppgifter. De går direkt till Stripe,
            som är certifierad betaltjänstleverantör.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Avhämtning och leverans">
          <p>
            Maten lagas när betalningen gått igenom och är normalt klar efter
            cirka {bestallning.tillagningsminuter} minuter. Du hämtar den i
            restaurangen under öppettiderna ovan. Väljer du servering till
            bordet kommer vi ut med maten till det bordsnummer du angav.
          </p>
          <p className="mt-3">Vi kör inte ut mat.</p>
        </Avsnitt>

        <Avsnitt rubrik="Ångerrätt och återbetalning">
          <p>
            Färdiglagad mat är undantagen från ångerrätten enligt lagen om
            distansavtal, eftersom den tillverkas på beställning och snabbt blir
            förstörd.
          </p>
          <p className="mt-3">
            Blir något fel med din beställning, hör av dig till oss samma dag
            {restaurang.telefon ? ` på ${restaurang.telefon}` : ""}. Vi lagar om
            eller betalar tillbaka. Återbetalning görs till samma betalsätt som
            du använde och tar normalt några bankdagar.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Dina uppgifter">
          <p>
            Vi sparar namn, mobilnummer eller e-post och din beställning för att
            kunna laga maten, skicka kvitto och sköta bokföringen. Uppgifterna
            delas bara med Stripe för betalningen och med vår sms- och
            e-postleverantör för kvittot. Vi säljer dem aldrig vidare.
          </p>
          <p className="mt-3">
            Vill du att vi tar bort dina uppgifter
            {restaurang.epost ? `, mejla ${restaurang.epost}` : ", hör av dig"}.
            Bokföringsunderlag måste vi enligt lag spara i sju år.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Allergier">
          <p>
            Noteringsfältet i beställningen går till köket, men vi kan inte
            garantera en helt allergenfri tillagning. Har du en allergi som
            spelar roll, ring oss innan du beställer.
          </p>
        </Avsnitt>
      </main>

      <Footer />
    </>
  );
}

function Avsnitt({
  rubrik,
  children,
}: {
  rubrik: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-jb-linje pt-8">
      <h2 className="jb-display text-xl text-jb-text">{rubrik}</h2>
      <div className="mt-3 text-sm leading-relaxed text-jb-dampad">
        {children}
      </div>
    </section>
  );
}

function stangning(close: string): string {
  const [timme, minut] = close.split(":").map(Number);
  if (timme < 24) return close;
  return `${String(timme - 24).padStart(2, "0")}:${String(minut).padStart(2, "0")}`;
}
