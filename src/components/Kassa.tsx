"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { useCart } from "@/lib/cart";
import { hittaRatt } from "@/data/menu-data";
import { formateraPris } from "@/lib/pengar";
import { bestallning } from "@/data/restaurang";

type Typ = "avhamtning" | "bord";

export function Kassa() {
  const { rader, summa, antalVaror, laddad, andraAntal, taBort } = useCart();
  const router = useRouter();

  const [namn, setNamn] = useState("");
  const [telefon, setTelefon] = useState("");
  const [epost, setEpost] = useState("");
  const [typ, setTyp] = useState<Typ>("avhamtning");
  const [bordsnummer, setBordsnummer] = useState("");
  const [notering, setNotering] = useState("");
  const [fel, setFel] = useState("");
  const [skickar, setSkickar] = useState(false);

  if (!laddad) {
    return <VarukorgSkelett />;
  }

  if (antalVaror === 0) {
    return (
      <div className="mt-10 rounded-jb border border-jb-linje bg-jb-yta px-6 py-12 text-center">
        <p className="jb-display text-2xl text-jb-text">Varukorgen är tom</p>
        <p className="mt-2 text-sm text-jb-dampad">
          Plocka ihop något gott ur menyn så tar vi det därifrån.
        </p>
        <Link
          href="/meny"
          className="mt-6 inline-block rounded-jb bg-jb-rosa px-6 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork"
        >
          Till menyn
        </Link>
      </div>
    );
  }

  async function skicka(e: React.FormEvent) {
    e.preventDefault();
    setFel("");
    setSkickar(true);

    try {
      const svar = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namn,
          telefon,
          epost,
          typ,
          bordsnummer: typ === "bord" ? Number(bordsnummer) || null : null,
          notering,
          rader: rader.map((r) => ({
            rattId: r.rattId,
            antal: r.antal,
            notering: r.notering,
            protein: r.protein,
          })),
        }),
      });

      const data = await svar.json();
      if (!svar.ok) {
        setFel(data.fel ?? "Något gick fel. Försök igen.");
        setSkickar(false);
        return;
      }

      // Varukorgen töms först när betalningen är klar, inte här: avbryter
      // gästen betalningen ska beställningen finnas kvar.
      router.push(
        `/kassa/betalning?order=${data.orderId}&cs=${encodeURIComponent(data.clientSecret)}`,
      );
    } catch {
      setFel("Vi når inte servern. Kontrollera uppkopplingen och försök igen.");
      setSkickar(false);
    }
  }

  return (
    <form onSubmit={skicka} className="mt-8 space-y-10">
      <section>
        <h2 className="jb-display text-xl text-jb-text">Din beställning</h2>
        <ul className="mt-4 divide-y divide-jb-linje-svag rounded-jb border border-jb-linje">
          {rader.map((rad) => {
            const ratt = hittaRatt(rad.rattId);
            if (!ratt) return null;
            return (
              <li key={rad.radId} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base text-jb-text">{ratt.namn}</p>
                  {rad.protein ? (
                    <p className="mt-0.5 text-sm text-jb-dampad">
                      {rad.protein}
                    </p>
                  ) : null}
                  {rad.notering ? (
                    <p className="mt-0.5 text-sm text-jb-dampad">
                      {rad.notering}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center rounded-jb border border-jb-linje">
                      <button
                        type="button"
                        onClick={() => andraAntal(rad.radId, rad.antal - 1)}
                        aria-label={`Minska antal ${ratt.namn}`}
                        className="p-2.5 text-jb-dampad hover:text-jb-text"
                      >
                        <MinusIcon size={14} weight="bold" aria-hidden />
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">
                        {rad.antal}
                      </span>
                      <button
                        type="button"
                        onClick={() => andraAntal(rad.radId, rad.antal + 1)}
                        aria-label={`Öka antal ${ratt.namn}`}
                        className="p-2.5 text-jb-dampad hover:text-jb-text"
                      >
                        <PlusIcon size={14} weight="bold" aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => taBort(rad.radId)}
                      aria-label={`Ta bort ${ratt.namn}`}
                      className="rounded-jb p-2.5 text-jb-dampad hover:text-jb-orange"
                    >
                      <TrashIcon size={16} aria-hidden />
                    </button>
                  </div>
                </div>
                <p className="shrink-0 tabular-nums text-jb-text">
                  {formateraPris((ratt.pris ?? 0) * rad.antal)}
                </p>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-jb-linje pt-4">
          <span className="jb-display text-xl text-jb-text">Summa</span>
          <span className="jb-display text-2xl tabular-nums text-jb-text">
            {formateraPris(summa)}
          </span>
        </div>
      </section>

      <section>
        <h2 className="jb-display text-xl text-jb-text">Dina uppgifter</h2>
        <div className="mt-4 space-y-5">
          <Falt
            id="namn"
            etikett="Namn"
            varde={namn}
            satt={setNamn}
            obligatorisk
            autoComplete="name"
          />

          <div>
            <Falt
              id="telefon"
              etikett="Mobilnummer"
              typ="tel"
              varde={telefon}
              satt={setTelefon}
              autoComplete="tel"
              placeholder="070-123 45 67"
            />
            <Falt
              id="epost"
              etikett="E-post"
              typ="email"
              varde={epost}
              satt={setEpost}
              autoComplete="email"
              klass="mt-5"
            />
            <p className="mt-2 text-xs text-jb-dampad">
              Fyll i minst ett av dem. Dit skickar vi kvitto och ordernummer.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-jb-text">
              Hur vill du ha maten?
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Val
                vald={typ === "avhamtning"}
                onClick={() => setTyp("avhamtning")}
              >
                Avhämtning
              </Val>
              {bestallning.bordsservering ? (
                <Val vald={typ === "bord"} onClick={() => setTyp("bord")}>
                  Till bordet
                </Val>
              ) : null}
            </div>
          </fieldset>

          {typ === "bord" ? (
            <Falt
              id="bordsnummer"
              etikett="Bordsnummer"
              typ="number"
              varde={bordsnummer}
              satt={setBordsnummer}
              obligatorisk
              min={1}
              max={bestallning.antalBord}
            />
          ) : null}

          <Falt
            id="notering"
            etikett="Meddelande till köket"
            varde={notering}
            satt={setNotering}
            placeholder="Frivilligt"
          />
        </div>
      </section>

      {fel ? (
        <p
          role="alert"
          className="rounded-jb border border-jb-orange/50 bg-jb-orange/10 px-4 py-3 text-sm text-jb-text"
        >
          {fel}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={skickar}
        className="w-full rounded-jb bg-jb-rosa px-6 py-4 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.99] disabled:opacity-60"
      >
        {skickar ? "Förbereder betalning..." : `Betala ${formateraPris(summa)}`}
      </button>
      <p className="text-center text-xs text-jb-dampad">
        Nästa steg är betalning med kort eller Swish.{" "}
        <Link href="/villkor" className="text-jb-rosa underline underline-offset-2">
          Villkor
        </Link>
      </p>
    </form>
  );
}

function Falt({
  id,
  etikett,
  varde,
  satt,
  typ = "text",
  obligatorisk = false,
  klass = "",
  ...rest
}: {
  id: string;
  etikett: string;
  varde: string;
  satt: (v: string) => void;
  typ?: string;
  obligatorisk?: boolean;
  klass?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={klass}>
      <label htmlFor={id} className="block text-sm font-medium text-jb-text">
        {etikett}
        {obligatorisk ? null : (
          <span className="ml-1.5 text-jb-dampad">(frivilligt)</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={typ}
        value={varde}
        required={obligatorisk}
        onChange={(e) => satt(e.target.value)}
        className="mt-2 w-full rounded-jb border border-jb-linje bg-jb-botten px-3.5 py-3 text-base text-jb-text placeholder:text-jb-dampad/70 focus:border-jb-rosa focus:outline-none"
        {...rest}
      />
    </div>
  );
}

function Val({
  vald,
  onClick,
  children,
}: {
  vald: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={vald}
      className={`rounded-jb border px-4 py-3 text-sm transition-colors ${
        vald
          ? "border-jb-rosa bg-jb-rosa text-jb-motsatt"
          : "border-jb-linje text-jb-dampad hover:border-jb-dampad"
      }`}
    >
      {children}
    </button>
  );
}

/** Skelett i varukorgens form, inte en snurra. */
function VarukorgSkelett() {
  return (
    <div className="mt-8 space-y-3" aria-busy="true" aria-label="Laddar varukorgen">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-jb border border-jb-linje bg-jb-yta"
        />
      ))}
    </div>
  );
}
