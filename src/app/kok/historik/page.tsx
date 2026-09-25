import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { hamtaBetaldaOrdrar } from "@/lib/db/orders";
import { orenTillKronor } from "@/lib/pengar";
import {
  arAterbetald,
  betalsattNamn,
  radsammanfattning,
  sammanstall,
} from "@/lib/rapport";
import {
  arDatum,
  dygnetsGranser,
  flyttaDagar,
  stockholmDatum,
  stockholmKlockslag,
} from "@/lib/stockholm-datum";

export const metadata: Metadata = {
  title: "Historik",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dagens (eller en vald dags) betalda ordrar med summor. Underlaget Joe
 * behöver för att stämma av mot Stripes utbetalningar och för bokföringen.
 */
export default async function Historiksida({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sok = await searchParams;
  const idag = stockholmDatum(new Date());
  const datum = arDatum(sok.datum) ? sok.datum : idag;
  const { fran, till } = dygnetsGranser(datum);
  const ordrar = await hamtaBetaldaOrdrar(fran, till);
  const rapport = sammanstall(ordrar);
  const manad = datum.slice(0, 7);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/kok"
        className="inline-flex items-center gap-2 text-sm text-jb-dampad hover:text-jb-text"
      >
        <ArrowLeftIcon size={16} aria-hidden />
        Tillbaka till köket
      </Link>

      <h1 className="jb-display mt-4 text-4xl text-jb-text">Historik</h1>

      <form className="mt-6 flex flex-wrap items-end gap-3" action="/kok/historik">
        <Link
          href={`/kok/historik?datum=${flyttaDagar(datum, -1)}`}
          className="rounded-jb border border-jb-linje px-4 py-2.5 text-sm text-jb-text hover:border-jb-rosa"
        >
          Föregående dag
        </Link>
        <label className="text-sm text-jb-dampad">
          <span className="block">Datum</span>
          <input
            type="date"
            name="datum"
            defaultValue={datum}
            max={idag}
            className="mt-1 rounded-jb border border-jb-linje bg-jb-yta px-3 py-2 text-jb-text"
          />
        </label>
        <button
          type="submit"
          className="rounded-jb border border-jb-linje px-4 py-2.5 text-sm text-jb-text hover:border-jb-rosa"
        >
          Visa
        </button>
        {datum < idag ? (
          <Link
            href={`/kok/historik?datum=${flyttaDagar(datum, 1)}`}
            className="rounded-jb border border-jb-linje px-4 py-2.5 text-sm text-jb-text hover:border-jb-rosa"
          >
            Nästa dag
          </Link>
        ) : null}
      </form>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-jb border border-jb-linje bg-jb-linje sm:grid-cols-3">
        <Siffra etikett="Betalda ordrar" varde={String(rapport.antalBetalda)} />
        <Siffra
          etikett="Försäljning (netto)"
          varde={`${orenTillKronor(rapport.nettoOren)} kr`}
        />
        <Siffra
          etikett="Återbetalt"
          varde={`${orenTillKronor(rapport.aterbetaltOren)} kr`}
          detalj={
            rapport.antalAterbetalda > 0
              ? `${rapport.antalAterbetalda} order${rapport.antalAterbetalda > 1 ? "rar" : ""}`
              : undefined
          }
        />
      </dl>

      {Object.keys(rapport.perBetalsatt).length > 0 ? (
        <p className="mt-3 text-sm text-jb-dampad">
          {Object.entries(rapport.perBetalsatt)
            .map(([satt, oren]) => `${satt}: ${orenTillKronor(oren)} kr`)
            .join(" · ")}
        </p>
      ) : null}

      <a
        href={`/api/kok/historik?manad=${manad}`}
        className="mt-6 inline-flex items-center gap-2 rounded-jb bg-jb-rosa px-5 py-3 text-sm font-semibold text-jb-motsatt hover:bg-jb-rosa-mork"
      >
        <DownloadSimpleIcon size={18} weight="bold" aria-hidden />
        Ladda ner hela {manad} som csv
      </a>

      <h2 className="jb-display mt-10 text-xl text-jb-text">Ordrar {datum}</h2>
      {ordrar.length === 0 ? (
        <p className="mt-4 rounded-jb border border-dashed border-jb-linje px-4 py-8 text-center text-sm text-jb-dampad">
          Inga betalda ordrar den här dagen.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-jb border border-jb-linje">
          <table className="w-full text-left text-sm">
            <thead className="bg-jb-yta text-jb-dampad">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Tid</th>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium">Innehåll</th>
                <th scope="col" className="px-4 py-3 font-medium">Betalsätt</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Belopp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-jb-linje-svag">
              {ordrar.map((order) => {
                const aterbetald = arAterbetald(order);
                return (
                  <tr key={order.id} className={aterbetald ? "text-jb-dampad" : "text-jb-text"}>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {stockholmKlockslag(order.betald!)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {order.ordernummer}
                      {aterbetald ? (
                        <span className="ml-2 text-xs font-semibold uppercase text-jb-orange">
                          Återbetald
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{radsammanfattning(order)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {betalsattNamn(order.betaldMed)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right tabular-nums ${
                        aterbetald ? "line-through" : ""
                      }`}
                    >
                      {orenTillKronor(order.summaOren)} kr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Siffra({
  etikett,
  varde,
  detalj,
}: {
  etikett: string;
  varde: string;
  detalj?: string;
}) {
  return (
    <div className="bg-jb-botten px-5 py-4">
      <dt className="text-xs uppercase tracking-wide text-jb-dampad">{etikett}</dt>
      <dd className="jb-display mt-1 text-3xl tabular-nums text-jb-text">{varde}</dd>
      {detalj ? <dd className="text-xs text-jb-dampad">{detalj}</dd> : null}
    </div>
  );
}
