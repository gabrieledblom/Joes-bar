import Link from "next/link";
import {
  bestallning,
  dagNamn,
  dagOrdning,
  oppettider,
  restaurang,
} from "@/data/restaurang";
import { Logotyp } from "./Logotyp";

/**
 * Footern bär de uppgifter Stripes Swish-villkor kräver att gästen kan se:
 * vem säljaren är, hur hen når oss, när maten hämtas och vilka villkor som
 * gäller. Detaljerna ligger på /villkor, sammanfattningen här.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-jb-linje bg-jb-botten-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Logotyp className="text-2xl" />
          <p className="mt-3 text-sm text-jb-dampad">
            {restaurang.tagline} i {restaurang.ort}. Pizza, smash burgare,
            kebab och sides.
          </p>
          {restaurang.orgnr ? (
            <p className="mt-4 text-xs text-jb-dampad">
              Organisationsnummer {restaurang.orgnr}
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="jb-display text-sm text-jb-text">Kontakt</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-jb-dampad">
            {restaurang.adress.gata ? (
              <li>
                {restaurang.adress.gata}
                <br />
                {restaurang.adress.postnummer} {restaurang.adress.postort}
              </li>
            ) : (
              <li>{restaurang.adress.postort}</li>
            )}
            {restaurang.telefonE164 ? (
              <li>
                <a
                  href={`tel:${restaurang.telefonE164}`}
                  className="hover:text-jb-text"
                >
                  {restaurang.telefon}
                </a>
              </li>
            ) : null}
            {restaurang.epost ? (
              <li>
                <a
                  href={`mailto:${restaurang.epost}`}
                  className="hover:text-jb-text"
                >
                  {restaurang.epost}
                </a>
              </li>
            ) : null}
          </ul>
          <Link
            href="/villkor"
            className="mt-4 inline-block text-sm text-jb-rosa hover:underline"
          >
            Villkor och betalning
          </Link>
        </div>

        <div>
          <h2 className="jb-display text-sm text-jb-text">Öppettider</h2>
          <dl className="mt-3 space-y-1 text-sm">
            {dagOrdning.map((dag) => {
              const tid = oppettider[dag];
              return (
                <div key={dag} className="flex justify-between gap-4">
                  <dt className="text-jb-dampad">{dagNamn[dag]}</dt>
                  <dd className="tabular-nums text-jb-text">
                    {tid
                      ? `${tid.open} - ${formateraStangning(tid.close)}`
                      : "Stängt"}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-4 text-xs text-jb-dampad">
            Maten är normalt klar för avhämtning efter cirka{" "}
            {bestallning.tillagningsminuter} minuter.
          </p>
        </div>
      </div>

      <div className="border-t border-jb-linje-svag px-4 py-5 text-center text-xs text-jb-dampad sm:px-6">
        Betalning sker säkert via Stripe med kort eller Swish.
      </div>
    </footer>
  );
}

/** "25:00" betyder 01:00 natten efter. Gästen ska läsa 01:00. */
function formateraStangning(close: string): string {
  const [timme, minut] = close.split(":").map(Number);
  if (timme < 24) return close;
  return `${String(timme - 24).padStart(2, "0")}:${String(minut).padStart(2, "0")}`;
}
