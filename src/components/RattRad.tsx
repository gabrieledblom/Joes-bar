"use client";

import { useEffect, useRef, useState } from "react";
import { MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import {
  garAttBestalla,
  hittaRatt,
  kategoriHarSideval,
  kategoriKraverProtein,
  proteinval,
  ratterIKategori,
  type MenuItem,
  type Protein,
} from "@/data/menu-data";
import { useCart } from "@/lib/cart";
import { formateraPris } from "@/lib/pengar";

export function RattRad({ ratt }: { ratt: MenuItem }) {
  const [oppen, setOppen] = useState(false);
  const bestallbar = garAttBestalla(ratt);

  return (
    <li className="border-b border-jb-linje-svag last:border-b-0">
      <button
        type="button"
        onClick={() => setOppen(true)}
        disabled={!bestallbar}
        className="group flex w-full items-baseline gap-3 py-4 text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
      >
        <span className="min-w-0 flex-1">
          <span className="jb-display block text-lg text-jb-text group-enabled:group-hover:text-jb-rosa">
            {ratt.namn}
          </span>
          <span className="mt-0.5 block text-sm text-jb-dampad">
            {ratt.beskrivning}
          </span>
        </span>

        <span aria-hidden className="jb-ledare hidden h-px flex-1 sm:block" />

        <span className="flex shrink-0 items-center gap-3">
          <span className="text-right">
            {ratt.pris !== null ? (
              <span className="text-base tabular-nums text-jb-text">
                {formateraPris(ratt.pris)}
              </span>
            ) : (
              <span className="text-xs text-jb-dampad">Pris kommer snart</span>
            )}
          </span>

          {/*
            Rent visuell "lägg till"-markör. Raden är redan hela knappen,
            så det här får inte bli en egen klickbar knapp inuti en knapp -
            det både är ogiltig HTML och gör att skärmläsare läser upp
            rätten två gånger. aria-hidden håller den utanför trädet; hela
            raden har redan rättens namn som sin tillgängliga text.
          */}
          {bestallbar ? (
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jb-rosa text-jb-motsatt transition-transform group-hover:scale-110"
            >
              <PlusIcon size={16} weight="bold" />
            </span>
          ) : null}
        </span>
      </button>

      {oppen ? (
        <BestallDialog ratt={ratt} stang={() => setOppen(false)} />
      ) : null}
    </li>
  );
}

function BestallDialog({
  ratt,
  stang,
}: {
  ratt: MenuItem;
  stang: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { laggTill } = useCart();
  const [antal, setAntal] = useState(1);
  const [notering, setNotering] = useState("");
  const [protein, setProtein] = useState<Protein | "">("");
  const [sideval, setSideval] = useState<"" | "bara" | "med-sides">("");
  const [sideId, setSideId] = useState("");
  const [fel, setFel] = useState("");

  const kraverProtein = kategoriKraverProtein.includes(ratt.kategori);
  const harSideval = kategoriHarSideval.includes(ratt.kategori);
  const sides = harSideval
    ? ratterIKategori("sides").filter(garAttBestalla)
    : [];
  const valdSida = sideId ? hittaRatt(sideId) : undefined;
  const radPris = (ratt.pris ?? 0) + (sideval === "med-sides" ? (valdSida?.pris ?? 0) : 0);

  // <dialog showModal()> ger fokusfälla, Esc och inert bakgrund från
  // webbläsaren. Att bygga det för hand blir alltid sämre.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function skicka(e: React.FormEvent) {
    e.preventDefault();
    if (kraverProtein && !protein) {
      setFel("Välj protein innan du lägger till.");
      return;
    }
    if (harSideval && !sideval) {
      setFel("Välj 'Bara burgare' eller 'Med sides' innan du lägger till.");
      return;
    }
    if (harSideval && sideval === "med-sides" && !sideId) {
      setFel("Välj en side innan du lägger till.");
      return;
    }
    laggTill({
      rattId: ratt.id,
      antal,
      notering: notering.trim(),
      protein: protein || undefined,
      sideId: sideval === "med-sides" ? sideId : undefined,
    });
    stang();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={stang}
      onClick={(e) => {
        // Klick utanför panelen stänger. Target är dialogen själv bara när
        // klicket landat på backdropen.
        if (e.target === dialogRef.current) stang();
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-jb border border-jb-linje bg-jb-yta p-0 text-jb-text backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      aria-labelledby="bestall-rubrik"
    >
      <form onSubmit={skicka} className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 id="bestall-rubrik" className="jb-display text-2xl">
              {ratt.namn}
            </h2>
            <p className="mt-1 text-sm text-jb-dampad">{ratt.beskrivning}</p>
          </div>
          <button
            type="button"
            onClick={stang}
            aria-label="Stäng"
            className="-mr-1 -mt-1 rounded-jb p-2 text-jb-dampad hover:text-jb-text"
          >
            <XIcon size={20} weight="bold" aria-hidden />
          </button>
        </div>

        {kraverProtein ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-jb-text">
              Välj protein
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {proteinval.map((val) => (
                <label
                  key={val}
                  className={`cursor-pointer rounded-jb border px-3.5 py-2.5 text-sm transition-colors has-[:checked]:border-jb-rosa has-[:checked]:bg-jb-rosa has-[:checked]:text-jb-motsatt ${
                    protein === val
                      ? "border-jb-rosa"
                      : "border-jb-linje text-jb-dampad hover:border-jb-dampad"
                  }`}
                >
                  <input
                    type="radio"
                    name="protein"
                    value={val}
                    checked={protein === val}
                    onChange={() => {
                      setProtein(val);
                      setFel("");
                    }}
                    className="sr-only"
                  />
                  {val}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {harSideval ? (
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-jb-text">
              Vill du ha en side?
            </legend>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {(
                [
                  ["bara", "Bara burgare"],
                  ["med-sides", "Med sides"],
                ] as const
              ).map(([val, etikett]) => (
                <label
                  key={val}
                  className={`cursor-pointer rounded-jb border px-3.5 py-2.5 text-center text-sm transition-colors has-[:checked]:border-jb-rosa has-[:checked]:bg-jb-rosa has-[:checked]:text-jb-motsatt ${
                    sideval === val
                      ? "border-jb-rosa"
                      : "border-jb-linje text-jb-dampad hover:border-jb-dampad"
                  }`}
                >
                  <input
                    type="radio"
                    name="sideval"
                    value={val}
                    checked={sideval === val}
                    onChange={() => {
                      setSideval(val);
                      if (val === "bara") setSideId("");
                      setFel("");
                    }}
                    className="sr-only"
                  />
                  {etikett}
                </label>
              ))}
            </div>

            {sideval === "med-sides" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {sides.map((side) => (
                  <label
                    key={side.id}
                    className={`cursor-pointer rounded-jb border px-3.5 py-2.5 text-sm transition-colors has-[:checked]:border-jb-rosa has-[:checked]:bg-jb-rosa has-[:checked]:text-jb-motsatt ${
                      sideId === side.id
                        ? "border-jb-rosa"
                        : "border-jb-linje text-jb-dampad hover:border-jb-dampad"
                    }`}
                  >
                    <input
                      type="radio"
                      name="side"
                      value={side.id}
                      checked={sideId === side.id}
                      onChange={() => {
                        setSideId(side.id);
                        setFel("");
                      }}
                      className="sr-only"
                    />
                    {side.namn} · {formateraPris(side.pris ?? 0)}
                  </label>
                ))}
              </div>
            ) : null}
          </fieldset>
        ) : null}

        <div className="mt-6">
          <label
            htmlFor="notering"
            className="block text-sm font-medium text-jb-text"
          >
            Notering till köket
          </label>
          <input
            id="notering"
            type="text"
            value={notering}
            onChange={(e) => setNotering(e.target.value)}
            maxLength={200}
            placeholder="Utan lök"
            className="mt-2 w-full rounded-jb border border-jb-linje bg-jb-botten px-3.5 py-3 text-base text-jb-text placeholder:text-jb-dampad/70 focus:border-jb-rosa focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-jb-dampad">
            Frivilligt. Allergier tar vi säkrast per telefon.
          </p>
        </div>

        {fel ? (
          <p role="alert" className="mt-4 text-sm text-jb-orange">
            {fel}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-jb border border-jb-linje">
            <button
              type="button"
              onClick={() => setAntal((n) => Math.max(1, n - 1))}
              aria-label="Minska antal"
              className="p-3.5 text-jb-dampad hover:text-jb-text"
            >
              <MinusIcon size={16} weight="bold" aria-hidden />
            </button>
            <span
              className="w-8 text-center tabular-nums"
              aria-live="polite"
              aria-label={`Antal: ${antal}`}
            >
              {antal}
            </span>
            <button
              type="button"
              onClick={() => setAntal((n) => Math.min(99, n + 1))}
              aria-label="Öka antal"
              className="p-3.5 text-jb-dampad hover:text-jb-text"
            >
              <PlusIcon size={16} weight="bold" aria-hidden />
            </button>
          </div>

          <button
            type="submit"
            className="flex-1 rounded-jb bg-jb-rosa px-4 py-3.5 text-base font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.99]"
          >
            Lägg till {formateraPris(radPris * antal)}
          </button>
        </div>
      </form>
    </dialog>
  );
}
