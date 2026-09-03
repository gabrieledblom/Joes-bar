"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckIcon,
  FlaskIcon,
  LockSimpleIcon,
  SpeakerHighIcon,
  WarningIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { OrderRad } from "@/lib/db/schema";
import { orenTillKronor } from "@/lib/pengar";

/** Hur ofta skärmen frågar efter nya ordrar. */
const POLL_MS = 3000;
/** En order som legat öppen längre än så flaggas på kortet. */
const SEN_EFTER_MIN = 15;
/** Obekräftad order äldre än så eskalerar till helskärmslarm. */
const OBEKRAFTAD_VARNING_MS = 5 * 60 * 1000;
/** Sekunder utan lyckad poll innan den röda bannern visas. */
const KONTAKT_VARNING_S = 15;
/** Sekunder utan lyckad poll innan anslutningslarmet också hörs. */
const KONTAKT_LARM_S = 60;

const VOLYM_NYCKEL = "kok-larm-volym";
/** Fejkordrar (testläge) taggas med det här prefixet - de skickas aldrig till servern. */
const FEJK_PREFIX = "fejk-";

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

/** "2 min 14 s sedan" i stället för ett klockslag - det som spelar roll är hur länge gästen väntat. */
function formateraSedan(sekunder: number): string {
  const min = Math.floor(sekunder / 60);
  const sek = sekunder % 60;
  return min > 0 ? `${min} min ${sek} s sedan` : `${sek} s sedan`;
}

/**
 * Spelar en enkel sinuston på en delad AudioContext. Kort attack/release
 * (exponentiell ramp) i stället för en tvär start, så det inte knäpper i
 * högtalaren varje gång larmet tickar.
 */
function spelaTon(
  ctx: AudioContext,
  frekvensHz: number,
  langdSek: number,
  volym: number,
) {
  if (volym <= 0) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frekvensHz;
  const start = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volym, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + langdSek);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + langdSek + 0.05);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

export function Koksskarm() {
  const [passetStartat, setPassetStartat] = useState(false);
  const [volym, setVolymState] = useState(0.6);
  const [wakeLockAktiv, setWakeLockAktiv] = useState(false);
  const [wakeLockStodSaknas, setWakeLockStodSaknas] = useState(false);
  const [testLage, setTestLage] = useState(false);

  const [ordrar, setOrdrar] = useState<Koksorder[]>([]);
  const [fejkOrdrar, setFejkOrdrar] = useState<Koksorder[]>([]);
  const [bekraftade, setBekraftade] = useState<Set<string>>(new Set());
  const [laddad, setLaddad] = useState(false);
  const [aktionsFel, setAktionsFel] = useState("");

  const [senasteLyckadePoll, setSenasteLyckadePoll] = useState<number | null>(
    null,
  );
  const [nu, setNu] = useState(() => Date.now());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const volymRef = useRef(volym);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const pollPausadTillRef = useRef<number | null>(null);

  const orderLarmAktivRef = useRef(false);
  const orderLarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kontaktLarmAktivRef = useRef(false);
  const kontaktLarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Läses in en gång: sparad larmvolym och om ?test=1 finns i url:en.
  useEffect(() => {
    try {
      const rad = window.localStorage.getItem(VOLYM_NYCKEL);
      const tal = rad !== null ? Number(rad) : NaN;
      if (Number.isFinite(tal)) setVolymState(Math.min(1, Math.max(0, tal)));
    } catch {
      // Privat läge kan neka localStorage - då gäller bara standardvolymen.
    }
    setTestLage(new URLSearchParams(window.location.search).get("test") === "1");
  }, []);

  useEffect(() => {
    volymRef.current = volym;
  }, [volym]);

  function setVolym(varde: number) {
    const klampad = Math.min(1, Math.max(0, varde));
    setVolymState(klampad);
    try {
      window.localStorage.setItem(VOLYM_NYCKEL, String(klampad));
    } catch {
      // Volymen fungerar ändå under passet, den sparas bara inte till nästa.
    }
  }

  function orderLarmNasta(steg: 0 | 1) {
    if (!orderLarmAktivRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx) spelaTon(ctx, 880, 0.15, volymRef.current);
    // Två korta toner med 100 ms mellanrum, sen 2 s tystnad: 250 ms efter
    // första tonen, 2000 ms efter andra - så upprepas mönstret.
    const vantetid = steg === 0 ? 250 : 2000;
    orderLarmTimerRef.current = setTimeout(
      () => orderLarmNasta(steg === 0 ? 1 : 0),
      vantetid,
    );
  }

  function startaOrderLarm() {
    if (orderLarmAktivRef.current) return;
    orderLarmAktivRef.current = true;
    orderLarmNasta(0);
  }

  function stoppaOrderLarm() {
    orderLarmAktivRef.current = false;
    if (orderLarmTimerRef.current) clearTimeout(orderLarmTimerRef.current);
  }

  function kontaktLarmNasta() {
    if (!kontaktLarmAktivRef.current) return;
    const ctx = audioCtxRef.current;
    // Längre och lägre ton än ordelarmet, så köket hör skillnad på
    // "en order väntar" och "vi har helt tappat kontakt med servern".
    if (ctx) spelaTon(ctx, 220, 0.7, volymRef.current);
    kontaktLarmTimerRef.current = setTimeout(kontaktLarmNasta, 2000);
  }

  function startaKontaktLarm() {
    if (kontaktLarmAktivRef.current) return;
    kontaktLarmAktivRef.current = true;
    kontaktLarmNasta();
  }

  function stoppaKontaktLarm() {
    kontaktLarmAktivRef.current = false;
    if (kontaktLarmTimerRef.current) clearTimeout(kontaktLarmTimerRef.current);
  }

  /**
   * Klicket är det enda tillfället webbläsaren tillåter ljud och Wake Lock:
   * båda kräver en direkt user gesture. Görs det inte här, i samma handler,
   * blockeras de tyst resten av passet.
   */
  async function startaPasset() {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();
      spelaTon(ctx, 880, 0.15, volymRef.current);
    } catch {
      // Utan ljud ser köket ändå ordrarna - bara larmen blir tysta.
    }

    try {
      if ("wakeLock" in navigator) {
        const lock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = lock;
        setWakeLockAktiv(true);
        lock.addEventListener("release", () => setWakeLockAktiv(false));
      } else {
        setWakeLockStodSaknas(true);
      }
    } catch {
      setWakeLockStodSaknas(true);
    }

    setSenasteLyckadePoll(Date.now());
    setPassetStartat(true);
  }

  // Wake Lock släpps automatiskt så fort fliken döljs (byter app, låser
  // skärmen). Utan den här lyssnaren somnar skärmen efter första gången
  // någon lämnar fliken.
  useEffect(() => {
    if (!passetStartat) return;

    async function paSynlig() {
      if (document.visibilityState !== "visible") return;
      if (!("wakeLock" in navigator)) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        wakeLockRef.current = lock;
        setWakeLockAktiv(true);
        lock.addEventListener("release", () => setWakeLockAktiv(false));
      } catch {
        setWakeLockStodSaknas(true);
      }
    }

    document.addEventListener("visibilitychange", paSynlig);
    return () => document.removeEventListener("visibilitychange", paSynlig);
  }, [passetStartat]);

  // Klocka som driver alla "hur länge sedan"-visningar och anslutningsvakten.
  // En enda ticker i stället för en timer per kort.
  useEffect(() => {
    if (!passetStartat) return;
    const timer = setInterval(() => setNu(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [passetStartat]);

  // Polling. Startar inte förrän passet är igång - annars skulle
  // anslutningsvakten börja räkna innan någon ens tittar på skärmen.
  useEffect(() => {
    if (!passetStartat) return;
    let avbruten = false;
    let timer: ReturnType<typeof setTimeout>;

    async function hamta() {
      // Testläge: "tappad anslutning" hoppar helt enkelt över det riktiga
      // anropet ett tag, så senasteLyckadePoll blir naturligt gammal.
      if (pollPausadTillRef.current && Date.now() < pollPausadTillRef.current) {
        timer = setTimeout(hamta, POLL_MS);
        return;
      }
      try {
        const svar = await fetch("/api/kok/ordrar", { cache: "no-store" });
        // Bara ett rent 200-svar räknas som lyckat - ett fel-svar ska synas
        // som samma tystnad som ingen kontakt alls, inte döljas av att
        // fetch() inte kastar på HTTP-fel.
        if (svar.status !== 200) throw new Error(String(svar.status));
        const data = (await svar.json()) as { ordrar: Koksorder[] };
        if (avbruten) return;
        setOrdrar(data.ordrar);
        setSenasteLyckadePoll(Date.now());
        setLaddad(true);
      } catch {
        // Fångas av anslutningsvakten (bannern + larmet) - inget eget
        // felmeddelande här, det skulle bara duplicera samma information.
      } finally {
        if (!avbruten) timer = setTimeout(hamta, POLL_MS);
      }
    }

    hamta();
    return () => {
      avbruten = true;
      clearTimeout(timer);
    };
  }, [passetStartat]);

  const alla = [...ordrar, ...fejkOrdrar];
  const obekraftadeOrdrar = alla.filter(
    (o) => o.status === "ny" && !bekraftade.has(o.id),
  );
  const obekraftadeCount = obekraftadeOrdrar.length;
  const aldstaObekraftadTid = obekraftadeOrdrar.reduce<number | null>(
    (min, o) => {
      const t = new Date(o.betald ?? o.skapad).getTime();
      return min === null ? t : Math.min(min, t);
    },
    null,
  );
  const aldstaObekraftadAlderMs =
    aldstaObekraftadTid !== null ? Math.max(0, nu - aldstaObekraftadTid) : 0;
  const eskalerad =
    obekraftadeCount > 0 && aldstaObekraftadAlderMs >= OBEKRAFTAD_VARNING_MS;
  const varningsniva: "ingen" | "gul" | "rod" =
    obekraftadeCount === 0 ? "ingen" : eskalerad ? "rod" : "gul";

  const sekunderSedanKontakt =
    senasteLyckadePoll !== null
      ? Math.max(0, Math.floor((nu - senasteLyckadePoll) / 1000))
      : 0;
  const visaKontaktBanner = passetStartat && sekunderSedanKontakt > KONTAKT_VARNING_S;
  const kontaktLarmAktiv = passetStartat && sekunderSedanKontakt > KONTAKT_LARM_S;

  // Larmen slås av/på utifrån vad som redan hänt - inte utifrån "ny sedan
  // sist". En order som legat obekräftad sedan innan passet startade ska
  // larma precis lika högt som en som just kom in.
  useEffect(() => {
    if (passetStartat && obekraftadeCount > 0) startaOrderLarm();
    else stoppaOrderLarm();
  }, [passetStartat, obekraftadeCount]);

  useEffect(() => {
    if (kontaktLarmAktiv) startaKontaktLarm();
    else stoppaKontaktLarm();
  }, [kontaktLarmAktiv]);

  useEffect(() => {
    return () => {
      stoppaOrderLarm();
      stoppaKontaktLarm();
      wakeLockRef.current?.release().catch(() => {});
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  function bekrafta(id: string) {
    setBekraftade((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function flytta(order: Koksorder, status: Status) {
    if (order.id.startsWith(FEJK_PREFIX)) {
      setFejkOrdrar((lista) =>
        lista.map((o) => (o.id === order.id ? { ...o, status } : o)),
      );
      return;
    }
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
      setAktionsFel(`Kunde inte flytta ${order.ordernummer}. Försök igen.`);
    }
  }

  function simuleraNyOrder() {
    const tid = new Date().toISOString();
    setFejkOrdrar((lista) => [
      ...lista,
      {
        id: `${FEJK_PREFIX}${crypto.randomUUID()}`,
        ordernummer: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "ny",
        kundNamn: "Testkund",
        typ: "avhamtning",
        bordsnummer: null,
        notering: "Simulerad order - skickas aldrig till databasen.",
        rader: [
          {
            rattId: "test-rad",
            namn: "Testorder (ingen riktig beställning)",
            antal: 1,
            styckprisOren: 0,
            notering: "",
          },
        ],
        summaOren: 0,
        betald: tid,
        skapad: tid,
      },
    ]);
  }

  function simuleraTappadAnslutning() {
    pollPausadTillRef.current = Date.now() + 90_000;
  }

  function rensaFejkdata() {
    setFejkOrdrar([]);
    setBekraftade((prev) => {
      const next = new Set(prev);
      for (const id of next) {
        if (id.startsWith(FEJK_PREFIX)) next.delete(id);
      }
      return next;
    });
    pollPausadTillRef.current = null;
    setSenasteLyckadePoll(Date.now());
  }

  return (
    <div
      className={`flex min-h-dvh flex-col bg-jb-botten ${
        varningsniva === "rod" ? "border-[8px] border-jb-varning" : ""
      }`}
    >
      {visaKontaktBanner ? (
        <p
          role="alert"
          className="flex items-center justify-center gap-2 border-b border-jb-varning bg-jb-varning/20 px-5 py-3 text-center text-sm font-semibold text-jb-text"
        >
          <WifiSlashIcon size={18} weight="bold" aria-hidden />
          INGEN KONTAKT MED SERVERN — order kan saknas ({sekunderSedanKontakt}
          s)
        </p>
      ) : null}

      <header className="flex flex-wrap items-center gap-3 border-b border-jb-linje px-5 py-4">
        <h1 className="jb-display text-2xl text-jb-rosa">Joe&apos;s Bar kök</h1>

        {testLage ? (
          <span className="rounded-jb border border-jb-cyan px-2 py-1 text-xs font-semibold text-jb-cyan">
            TESTLÄGE
          </span>
        ) : null}

        <div
          className={`flex items-center gap-2 rounded-jb border px-4 py-2 ${
            varningsniva === "ingen"
              ? "border-jb-linje text-jb-dampad"
              : varningsniva === "gul"
                ? "border-jb-gul text-jb-gul"
                : "border-jb-varning text-jb-varning"
          }`}
        >
          <span className="text-xs uppercase tracking-wide">Obekräftade</span>
          <span
            className={`jb-display text-2xl tabular-nums ${
              varningsniva === "rod" ? "motion-safe:animate-pulse" : ""
            }`}
          >
            {obekraftadeCount}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {passetStartat && wakeLockAktiv ? (
            <span className="flex items-center gap-1.5 text-xs text-jb-cyan">
              <LockSimpleIcon size={16} weight="fill" aria-hidden />
              Skärm vaken
            </span>
          ) : passetStartat && wakeLockStodSaknas ? (
            <span className="max-w-[14rem] text-xs text-jb-orange">
              Skärmen kan slockna — sätt skärmtimeout till Aldrig i
              inställningarna
            </span>
          ) : null}

          <label className="flex items-center gap-2 text-jb-dampad">
            <SpeakerHighIcon size={18} aria-hidden />
            <span className="sr-only">Larmvolym</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volym * 100)}
              onChange={(e) => setVolym(Number(e.target.value) / 100)}
              className="w-24 accent-jb-rosa"
            />
          </label>
        </div>
      </header>

      {testLage && passetStartat ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-jb-cyan/40 bg-jb-cyan/5 px-5 py-2.5 text-xs">
          <FlaskIcon size={16} className="text-jb-cyan" aria-hidden />
          <span className="text-jb-dampad">
            Testläge - skickas aldrig till databasen:
          </span>
          <button
            type="button"
            onClick={simuleraNyOrder}
            className="rounded-jb border border-jb-linje px-3 py-1.5 text-jb-text hover:border-jb-rosa"
          >
            Simulera ny order
          </button>
          <button
            type="button"
            onClick={simuleraTappadAnslutning}
            className="rounded-jb border border-jb-linje px-3 py-1.5 text-jb-text hover:border-jb-rosa"
          >
            Simulera tappad anslutning
          </button>
          <button
            type="button"
            onClick={rensaFejkdata}
            className="rounded-jb border border-jb-linje px-3 py-1.5 text-jb-text hover:border-jb-rosa"
          >
            Rensa fejkdata
          </button>
        </div>
      ) : null}

      {aktionsFel ? (
        <p
          role="alert"
          className="border-b border-jb-orange/40 bg-jb-orange/10 px-5 py-2.5 text-sm text-jb-text"
        >
          {aktionsFel}
        </p>
      ) : null}

      <div className="grid flex-1 gap-px overflow-x-auto bg-jb-linje lg:grid-cols-4">
        {kolumner.map((kolumn) => {
          const iKolumnen = alla.filter((o) => o.status === kolumn.status);
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
                      nu={nu}
                      arBekraftad={bekraftade.has(order.id)}
                      bekrafta={bekrafta}
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

      {!passetStartat ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Starta passet"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-jb-botten px-6 text-center"
        >
          <p className="jb-display text-3xl text-jb-rosa sm:text-4xl">
            Joe&apos;s Bar kök
          </p>
          <p className="max-w-sm text-sm text-jb-dampad">
            Startar ljudlarmet och håller skärmen vaken under passet. Tryck en
            gång, vid passets start.
          </p>
          <button
            type="button"
            onClick={startaPasset}
            autoFocus
            className="rounded-jb bg-jb-rosa px-10 py-6 text-2xl font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.99]"
          >
            Starta passet
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Orderkort({
  order,
  nasta,
  knapp,
  flytta,
  nu,
  arBekraftad,
  bekrafta,
}: {
  order: Koksorder;
  nasta?: Status;
  knapp?: string;
  flytta: (order: Koksorder, status: Status) => void;
  nu: number;
  arBekraftad: boolean;
  bekrafta: (id: string) => void;
}) {
  const dampad = useReducedMotion();
  const startTid = new Date(order.betald ?? order.skapad).getTime();
  const sekunderSedan = Math.max(0, Math.floor((nu - startTid) / 1000));
  const minuter = Math.floor(sekunderSedan / 60);
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
          className={`ml-auto flex items-center gap-1.5 text-base tabular-nums ${
            sen ? "text-jb-orange" : "text-jb-dampad"
          }`}
        >
          {sen ? <WarningIcon size={18} weight="fill" aria-hidden /> : null}
          {formateraSedan(sekunderSedan)}
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

      {order.status === "ny" ? (
        <div className="mt-4 flex gap-2">
          {!arBekraftad ? (
            <button
              type="button"
              onClick={() => bekrafta(order.id)}
              className="flex-1 rounded-jb border-2 border-jb-cyan px-4 py-4 text-base font-semibold text-jb-cyan transition-colors hover:bg-jb-cyan/10 active:scale-[0.99]"
            >
              Mottagen
            </button>
          ) : (
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-jb border border-jb-linje px-4 py-4 text-sm text-jb-dampad">
              <CheckIcon size={16} weight="bold" aria-hidden />
              Mottagen
            </span>
          )}
          {nasta && knapp ? (
            <button
              type="button"
              onClick={() => flytta(order, nasta)}
              className="flex-1 rounded-jb bg-jb-rosa px-4 py-4 text-lg font-semibold text-jb-motsatt transition-colors hover:bg-jb-rosa-mork active:scale-[0.99]"
            >
              {knapp}
            </button>
          ) : null}
        </div>
      ) : nasta && knapp ? (
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
