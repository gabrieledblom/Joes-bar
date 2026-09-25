import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { restaurang } from "@/data/restaurang";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description:
    "Vilka personuppgifter Joe's Bar samlar in vid en beställning, varför, hur länge de sparas och vilka rättigheter du har enligt GDPR.",
};

/**
 * Beskriver den faktiska databehandlingen i den här kodbasen - inget mer,
 * inget mindre. Ändras insamlingen (nytt fält i kassan, ny tredjepart för
 * kvitton osv) måste den här sidan uppdateras i samma ändring, annars blir
 * den vilseledande.
 */
export default function Integritetspolicysida() {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="jb-display text-4xl text-jb-text sm:text-5xl">
          Integritetspolicy
        </h1>
        <p className="mt-3 text-sm text-jb-dampad">
          Gäller från och med att den här sidan publicerades. Beskriver hur{" "}
          {restaurang.namn} behandlar personuppgifter när du beställer på den
          här webbplatsen.
        </p>

        <Avsnitt rubrik="Personuppgiftsansvarig">
          <p>
            {restaurang.namn}
            {restaurang.orgnr ? `, org.nr ${restaurang.orgnr}` : ""}, i{" "}
            {restaurang.ort} är personuppgiftsansvarig för behandlingen som
            beskrivs här.
          </p>
          {!restaurang.orgnr || !restaurang.adress.gata ? (
            <p className="mt-2 text-jb-orange">
              Organisationsnummer och gatuadress fylls i innan sajten
              publiceras (se{" "}
              <Link href="/villkor" className="underline underline-offset-2">
                Kontakt och villkor
              </Link>
              ).
            </p>
          ) : (
            <p className="mt-2">
              {restaurang.adress.gata}, {restaurang.adress.postnummer}{" "}
              {restaurang.adress.postort}.
            </p>
          )}
        </Avsnitt>

        <Avsnitt rubrik="Vilka uppgifter vi samlar in">
          <p>Vid en beställning på webbplatsen samlar vi in:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Namn.</li>
            <li>
              Mobilnummer och/eller e-postadress - minst ett av dem, för att
              kunna skicka ordernummer och kvitto.
            </li>
            <li>
              Vad du beställt, valfria tillval och eventuellt meddelande till
              köket.
            </li>
            <li>Om du väljer bord: bordsnummer.</li>
            <li>
              Betalningsstatus och ett referens-id från Stripe. Vi ser aldrig
              och sparar aldrig dina kort- eller Swish-uppgifter - de går
              direkt till Stripe.
            </li>
          </ul>
          <p className="mt-3">
            Din varukorg innan du betalar sparas bara i din egen webbläsare
            (localStorage), inte hos oss - lägger du aldrig en order når den
            aldrig våra servrar.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Varför vi behandlar uppgifterna">
          <p>
            Namn, kontaktuppgift och orderinnehåll behandlas för att kunna
            fullgöra köpeavtalet med dig: laga och lämna ut rätt mat, skicka
            kvitto och ordernummer, och hantera reklamationer. Det är den
            rättsliga grunden enligt GDPR artikel 6.1 b.
          </p>
          <p className="mt-3">
            Betalda ordrar sparas därefter som bokföringsunderlag, vilket vi
            är skyldiga till enligt bokföringslagen (artikel 6.1 c).
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Vem vi delar uppgifter med">
          <ul className="space-y-2.5">
            <li>
              <strong className="text-jb-text">Stripe</strong> - hanterar
              betalningen (kort och Swish). Stripe är självständigt
              personuppgiftsansvarig för sin del av behandlingen; se{" "}
              <a
                href="https://stripe.com/legal/privacy-center"
                target="_blank"
                rel="noopener noreferrer"
                className="text-jb-rosa underline underline-offset-2"
              >
                Stripes integritetspolicy
              </a>
              .
            </li>
            <li>
              <strong className="text-jb-text">46elks</strong> (svenskt
              bolag) - skickar sms-kvittot om du angett mobilnummer.
            </li>
            <li>
              <strong className="text-jb-text">Resend</strong> - skickar
              e-postkvittot om du angett e-postadress. Kan innebära att
              uppgifterna behandlas utanför EU/EES, med de skyddsåtgärder
              (t.ex. standardavtalsklausuler) leverantören tillhandahåller.
            </li>
            <li>
              <strong className="text-jb-text">
                Vercel och Neon (eller Vercel Postgres)
              </strong>{" "}
              - driftar webbplatsen respektive lagrar orderdatabasen. Vercel
              kan behandla uppgifterna på servrar i USA, med de
              skyddsåtgärder leverantören tillhandahåller (t.ex.
              standardavtalsklausuler).
            </li>
          </ul>
          <p className="mt-3">
            Vi säljer aldrig dina uppgifter vidare och använder dem inte för
            marknadsföring.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Hur länge vi sparar uppgifterna">
          <p>
            Betalda ordrar sparas i sju år som bokföringsunderlag, enligt
            bokföringslagens krav. En påbörjad beställning som aldrig betalades
            raderas automatiskt efter två dygn.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Cookies och liknande tekniker">
          <p>
            Webbplatsen använder inga analys- eller marknadsföringscookies -
            inget Google Analytics, ingen pixel, ingen spårning. Det som
            lagras i din webbläsare är:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Din varukorg (localStorage), så att den finns kvar om du laddar
              om sidan.
            </li>
            <li>
              På betalningssteget sätter Stripe egna cookies för
              bedrägeriskydd - nödvändiga för att kunna ta betalt, inte för
              spårning av dig som besökare.
            </li>
            <li>
              Köksskärmen (<code>/kok</code>, låst med lösenord för personal)
              sätter en inloggningskaka och sparar larmvolym lokalt i
              webbläsaren. Det gäller bara personalens enhet, inte gäster.
            </li>
          </ul>
          <p className="mt-3">
            Eftersom inget av det här är valfria spårningscookies krävs inget
            samtyckesbanner enligt gällande regler - men om vi i framtiden
            lägger till analys- eller marknadsföringsverktyg uppdaterar vi
            både den här sidan och lägger till ett samtycke innan de aktiveras.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Dina rättigheter">
          <p>Du har rätt att:</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Få veta vilka uppgifter vi har om dig (tillgång/registerutdrag).</li>
            <li>Få felaktiga uppgifter rättade.</li>
            <li>
              Få dina uppgifter raderade, så länge vi inte är skyldiga att
              spara dem (t.ex. bokföring i sju år).
            </li>
            <li>Få ut dina uppgifter i ett läsbart format (dataportabilitet).</li>
            <li>Invända mot eller begränsa behandlingen.</li>
            <li>
              Klaga hos Integritetsskyddsmyndigheten,{" "}
              <a
                href="https://www.imy.se"
                target="_blank"
                rel="noopener noreferrer"
                className="text-jb-rosa underline underline-offset-2"
              >
                imy.se
              </a>
              , om du tycker att vi hanterar dina uppgifter fel.
            </li>
          </ul>
          <p className="mt-3">
            För att utöva någon av rättigheterna,
            {restaurang.epost ? (
              <>
                {" "}
                mejla{" "}
                <a
                  href={`mailto:${restaurang.epost}`}
                  className="text-jb-rosa underline underline-offset-2"
                >
                  {restaurang.epost}
                </a>
                .
              </>
            ) : (
              " kontakta oss (se Kontakt och villkor)."
            )}
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Säkerhet">
          <p>
            Webbplatsen körs över https. Vi lagrar aldrig kort- eller
            Swish-uppgifter själva - det sköts av Stripe. Köksskärmen är
            lösenordsskyddad så att bara personal ser inkommande ordrar.
          </p>
        </Avsnitt>

        <Avsnitt rubrik="Ändringar">
          <p>
            Ändrar vi hur vi behandlar personuppgifter uppdaterar vi den här
            sidan. Väsentliga ändringar meddelar vi tydligt här.
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
