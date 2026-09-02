"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRingingIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import type { OrderRad } from "@/lib/db/schema";
import { orenTillKronor } from "@/lib/pengar";

/** Hur ofta skärmen frågar efter nya ordrar. */
const POLL_MS = 3000;
/** En order som legat öppen längre än så flaggas. */
const SEN_EFTER_MIN = 15;

type Status = "ny" | "tillagas" | "klar" | "levererad";

interface Koksorder {
  id: string;
  ordernummer: string;
  status: Status;
  kundNamn: string;
  typ: "avhamtning" | "bord";
  bordsnummer: number | null;
  notering: string | null;
  rader: OrderRad[];
  summaOren: number;
  betald: string | null;
  skapad: string;
}

const kolumner: { status: Status; rubrik: string; nasta?: Status; knapp?: string }[] =
  [
    { status: "ny", rubrik: "Nya", nasta: "tillagas", knapp: "Starta" },
    { status: "tillagas", rubrik: "Tillagas", nasta: "klar", knapp: "Klar" },
    { status: "klar", rubrik: "Klar", nasta: "levererad", knapp: "Utlämnad" },
    { status: "levererad", rubrik: "Utlämnade" },
  ];

export function Koksskarm() {
  const [ordrar, setOrdrar] = useState<Koksorder[]>([]);
  const [fel, setFel] = useState("");
  const [laddad, setLaddad] = useState(false);
  const [ljudPa, setLjudPa] = useState(false);

  // Vilka ordrar vi redan sett. Utan den skulle första hämtningen låta
  // som om hela dagens ordrar kom in på en gång.
  const sedda = useRef<Set<string> | null>(null);

  const spelaSignal = useCallback(() => {
    if (!ljudPa) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1170, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      osc.onended = () => void ctx.close();
    } catch {
      // Ljud är en bonus. Kortet blinkar ändå.
    }
  }, [ljudPa]);

  useEffect(() => {
    let avbruten = false;
    let timer: ReturnType<typeof setTimeout>;

    async function hamta() {
      try {
        const svar = await fetch("/api/kok/ordrar", { cache: "no-store" });
        if (!svar.ok) throw new Error(String(svar.status));
        const data = (await svar.json()) as { ordrar: Koksorder[] };
        if (avbruten) return;

        if (sedda.current === null) {
          sedda.current = new Set(data.ordrar.map((o) => o.id));
        } else {
          const nya = data.ordrar.filter(
            (o) => o.status === "ny" && !sedda.current!.has(o.id),
          );
          if (nya.length > 0) spelaSignal();
          for (const o of data.ordrar) sedda.current.add(o.id);
        }

        setOrdrar(data.ordrar);
        setFel("");
        setLaddad(true);
      } catch {
        if (!avbruten) setFel("Ingen kontakt med servern. Försöker igen.");
      } finally {
        if (!avbruten) timer = setTimeout(hamta, POLL_MS);
      }
    }

    hamta();
    return () => {
      avbruten = true;
      clearTimeout(timer);
    };
  }, [spelaSignal]);

  async function flytta(order: Koksorder, status: Status) {
    // Flytta kortet direkt och rätta först om servern säger nej. Personalen
    // ska inte stå och vänta på ett nätverksanrop med händerna fulla.
    const innan = ordrar;
    setOrdrar((lista) =>
      lista.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    try {
      const svar = await fetch(`/api/kok/ordrar/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!svar.ok) throw new Error();
    } catch {
      setOrdrar(innan);
      setFel(`Kunde inte flytta ${order.ordernummer}. Försök igen.`);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-jb-botten">
      <header className="flex items-center gap-4 border-b border-jb-linje px-5 py-4">
        <h1 className="jb-display text-2xl text-jb-rosa">Joe&apos;s Bar kök</h1>

        <button
          type="button"
          onClick={() => setLjudPa((p) => !p)}
          aria-pressed={ljudPa}
          className={`ml-auto flex items-center gap-2 rounded-jb border px-4 py-2.5 text-sm transition-colors ${
            ljudPa
              ? "border-jb-rosa text-jb-rosa"
              : "border-jb-linje text-jb-dampad hover:text-jb-text"
          }`}
        >
          <BellRingingIcon size={18} weight={ljudPa ? "fill" : "regular"} aria-hidden />
          {ljudPa ? "Ljud på" : "Ljud av"}
        </button>
      </header>

      {fel ? (
        <p
          role="status"
          className="border-b border-jb-orange/40 bg-jb-orange/10 px-5 py-2.5 text-sm text-jb-text"
        >
          {fel}
        </p>
      ) : null}

      <div className="grid flex-1 gap-px overflow-x-auto bg-jb-linje lg:grid-cols-4">
        {kolumner.map((kolumn) => {
          const iKolumnen = ordrar.filter((o) => o.status === kolumn.status);
          return (
            <section
              key={kolumn.status}
              className="min-w-[280px] bg-jb-botten p-3"
            >
              <h2 className="jb-display sticky top-0 z-10 bg-jb-botten py-2 text-lg text-jb-dampad">
                {kolumn.rubrik}
                <span className="ml-2 tabular-nums text-jb-text">
                  {iKolumnen.length}
                </span>
              </h2>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {iKolumnen.map((order) => (
                    <Orderkort
                      key={order.id}
                      order={order}
                      nasta={kolumn.nasta}
                      knapp={kolumn.knapp}
                      flytta={flytta}
                    />
                  ))}
                </AnimatePresence>

                {laddad && iKolumnen.length === 0 ? (
                  <p className="rounded-jb border border-dashed border-jb-linje px-4 py-8 text-center text-sm text-jb-dampad">
                    Inget här just nu
                  </p>
                ) : null}

                {!laddad
                  ? [0, 1].map((i) => (
                      <div
                        key={i}
                        className="h-36 animate-pulse rounded-jb bg-jb-yta"
                      />
                    ))
                  : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Orderkort({
  order,
  nasta,
  knapp,
  flytta,
}: {
  order: Koksorder;
  nasta?: Status;
  knapp?: string;
  flytta: (order: Koksorder, status: Status) => void;
}) {
  const dampad = useReducedMotion();
  const minuter = useMinuterSedan(order.betald ?? order.skapad);
  const sen = minuter >= SEN_EFTER_MIN && order.status !== "levererad";

  return (
    <motion.article
      layout
      initial={dampad ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={dampad ? undefined : { opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={`rounded-jb border-2 bg-jb-yta p-4 ${
        sen ? "border-jb-orange" : "border-jb-linje"
      }`}
    >
      <div className="flex items-baseline gap-3">
        <h3 className="jb-display text-2xl text-jb-text">
          {order.ordernummer}
        </h3>
        <span
          className={`ml-auto flex items-center gap-1.5 text-lg tabular-nums ${
            sen ? "text-jb-orange" : "text-jb-dampad"
          }`}
        >
          {sen ? <WarningIcon size={18} weight="fill" aria-hidden /> : null}
          {minuter} min
        </span>
      </div>

      <p className="mt-1 text-base text-jb-dampad">
        {order.kundNamn}
        {order.typ === "bord" ? ` · Bord ${order.bordsnummer}` : " · Avhämtning"}
      </p>

      <ul className="mt-4 space-y-2.5 border-t border-jb-linje pt-4">
        {order.rader.map((rad, i) => (
          <li key={i} className="flex gap-3">
            <span className="jb-display shrink-0 text-xl text-jb-rosa tabular-nums">
              {rad.antal}&times;
            </span>
            <span className="min-w-0">
              <span className="block text-lg leading-snug text-jb-text">
                {rad.namn}
              </span>
              {rad.protein ? (
                <span className="block text-base text-jb-cyan">
                  {rad.protein}
                </span>
              ) : null}
              {rad.sideNamn ? (
                <span className="block text-base text-jb-cyan">
                  Med {rad.sideNamn}
                </span>
              ) : null}
              {rad.tillbehor ? (
                <span className="block text-base text-jb-cyan">
                  {rad.tillbehor}
                </span>
              ) : null}
              {rad.tillvalNamn && rad.tillvalNamn.length > 0 ? (
                <span className="block text-base text-jb-cyan">
                  {rad.tillvalNamn.join(", ")}
                </span>
              ) : null}
              {rad.notering ? (
                <span className="block text-base text-jb-gul">
                  {rad.notering}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {order.notering ? (
        <p className="mt-3 border-t border-jb-linje pt-3 text-base text-jb-gul">
          {order.notering}
        </p>
      ) : null}

      <p className="mt-3 text-sm text-jb-dampad">
        {orenTillKronor(order.summaOren)} kr betalt
      </p>

      {nasta && knapp ? (
        <button
          type="button"
          onClick={() => flytta(order, nasta)}
          className="mt-4 w-full rounded-jb bg-jb-rosa px-4 py-4 text-lg font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.99]"
        >
          {knapp}
        </button>
      ) : null}
    </motion.article>
  );
}

/**
 * Räknar upp med tiden, så att en order som blir gammal flaggas utan att
 * någon laddar om sidan. Klockan tickar i eget tillstånd och minuterna
 * räknas fram vid renderingen; då behöver inget nollställas när kortet får
 * en ny tidpunkt.
 */
function useMinuterSedan(tidpunkt: string): number {
  const [nu, setNu] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNu(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return Math.max(0, Math.floor((nu - new Date(tidpunkt).getTime()) / 60000));
}
