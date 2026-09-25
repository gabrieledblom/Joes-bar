import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircleIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TomVarukorg } from "@/components/TomVarukorg";
import { VantaPaBetalning } from "@/components/VantaPaBetalning";
import { hamtaOrder } from "@/lib/db/orders";
import { orenTillKronor } from "@/lib/pengar";
import { bestallning, restaurang } from "@/data/restaurang";

export const metadata: Metadata = {
  title: "Din order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Ordersida({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sok = await searchParams;
  const order = await hamtaOrder(id);
  if (!order) notFound();

  const aterbetald = order.status === "avbruten" && order.betald !== null;
  const avbruten = order.status === "avbruten" && !aterbetald;
  const betald = order.status !== "vantar_betalning" && order.status !== "avbruten";

  // Stripe skickar tillbaka gästen hit med redirect_status=failed när Swish
  // eller 3D Secure nekas. Betalningen är då fortfarande öppen och går att
  // försöka igen - köket har inte fått något.
  const clientSecret = sok.payment_intent_client_secret;
  const nekad =
    order.status === "vantar_betalning" && sok.redirect_status === "failed";
  const forsokIgen =
    nekad && typeof clientSecret === "string"
      ? `/kassa/betalning?order=${order.id}&cs=${encodeURIComponent(clientSecret)}`
      : "/kassa";

  return (
    <>
      <Header />
      {betald ? <TomVarukorg /> : null}

      <main className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6">
        {betald ? (
          <CheckCircleIcon
            size={44}
            weight="fill"
            className="text-jb-rosa"
            aria-hidden
          />
        ) : (
          <ClockIcon size={44} className="text-jb-orange" aria-hidden />
        )}

        <h1 className="jb-display mt-4 text-4xl text-jb-text sm:text-5xl">
          {betald
            ? "Tack för din beställning"
            : aterbetald
              ? "Ordern är avbruten"
              : avbruten || nekad
                ? "Betalningen gick inte igenom"
                : "Väntar på betalning"}
        </h1>

        <p className="mt-3 text-base text-jb-dampad">
          {betald
            ? order.typ === "bord"
              ? `Vi kommer ut med maten till bord ${order.bordsnummer}.`
              : `Maten är normalt klar efter cirka ${bestallning.tillagningsminuter} minuter.`
            : aterbetald
              ? `Vi har avbrutit ordern och betalar tillbaka ${orenTillKronor(order.summaOren)} kr till samma kort eller Swish. Det tar normalt några bankdagar.`
              : avbruten || nekad
                ? "Inga pengar har dragits och köket har inte fått någon order. Varukorgen finns kvar om du vill försöka igen."
                : "Betalningen är inte bekräftad än. Sidan uppdateras när den går igenom."}
        </p>
        {order.status === "vantar_betalning" && !nekad ? <VantaPaBetalning /> : null}
        {avbruten || nekad ? (
          <Link
            href={forsokIgen}
            className="mt-6 inline-block rounded-jb bg-jb-rosa px-6 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork"
          >
            Försök igen
          </Link>
        ) : null}

        <div className="mt-8 rounded-jb border border-jb-linje bg-jb-yta p-5 sm:p-6">
          <p className="text-sm text-jb-dampad">Ordernummer</p>
          <p className="jb-display mt-1 text-3xl text-jb-rosa">
            {order.ordernummer}
          </p>

          <ul className="mt-6 divide-y divide-jb-linje-svag border-t border-jb-linje-svag">
            {order.rader.map((rad, i) => (
              <li key={i} className="flex items-start gap-3 py-3">
                <span className="tabular-nums text-jb-dampad">
                  {rad.antal}&times;
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-jb-text">{rad.namn}</span>
                  {rad.protein ||
                  rad.sideNamn ||
                  rad.tillbehor ||
                  (rad.tillvalNamn && rad.tillvalNamn.length > 0) ||
                  rad.notering ? (
                    <span className="mt-0.5 block text-sm text-jb-dampad">
                      {[
                        rad.protein,
                        rad.tillbehor,
                        rad.sideNamn ? `Med ${rad.sideNamn}` : null,
                        ...(rad.tillvalNamn ?? []),
                        rad.notering,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular-nums text-jb-text">
                  {orenTillKronor(rad.styckprisOren * rad.antal)} kr
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-baseline justify-between border-t border-jb-linje pt-4">
            <span className="jb-display text-lg text-jb-text">Summa</span>
            <span className="jb-display text-2xl tabular-nums text-jb-text">
              {orenTillKronor(order.summaOren)} kr
            </span>
          </div>
        </div>

        {betald ? (
          <p className="mt-6 text-sm text-jb-dampad">
            {order.kundEpost && order.kundTelefon
              ? "Kvitto skickas till din e-post och som sms."
              : order.kundEpost
                ? "Kvitto skickas till din e-post."
                : "Kvitto skickas som sms."}{" "}
            {restaurang.telefon
              ? `Frågor? Ring ${restaurang.telefon}.`
              : null}
          </p>
        ) : null}

        <Link
          href="/meny"
          className="mt-8 inline-block rounded-jb border border-jb-linje px-6 py-3.5 text-base text-jb-text transition-colors hover:border-jb-rosa"
        >
          Beställ mer
        </Link>
      </main>

      <Footer />
    </>
  );
}
