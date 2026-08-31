"use client";

import { useMinut, SERVERMINUT } from "@/lib/klocka";
import { oppetStatus, type Oppetstatus } from "@/lib/oppettider";

/**
 * Den levande scenen bakom heron, byggd efter Joe's Bars egen väggmålning:
 * neonskylten på ställning ovanför taket, solstrålarna bakom, palmerna,
 * trafikljuset, skorna på ledningen och lowridern.
 *
 * Ritad som SVG i stället för bild eller video. Den blir skarp i alla
 * storlekar, väger några kilobyte i stället för hundratals, och kan följa
 * klockan: solen står uppe medan baren har öppet och vandrar över himlen
 * genom passet, sedan tar månen över. Fönstren och lamporna lyser bara när
 * det är öppet.
 *
 * Personerna i väggmålningen är medvetet inte med. Det är ett porträtt av
 * en riktig familj, och en klumpig efterhandsritning av dem hade blivit
 * sämre än ingen alls. Vill ni ha med dem hör de hemma som ett foto längre
 * ned på sidan.
 *
 * Utan JavaScript ritas ett öppet kvällsläge. Sidan står aldrig tom, den
 * slutar bara följa klockan.
 */

const STANDARDLAGE: Oppetstatus = {
  oppet: true,
  andel: 0.5,
  oppnarKl: null,
  stangerKl: null,
};

export function HeroScen() {
  const minut = useMinut();
  const status = minut === SERVERMINUT ? STANDARDLAGE : oppetStatus();
  const bana = himlakroppsbana(status.andel);
  const tand = status.oppet;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1200 620"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="jb-himmel" x1="0" y1="0" x2="0" y2="1">
            {tand ? (
              <>
                <stop offset="0%" stopColor="#2d0f4e" />
                <stop offset="35%" stopColor="#7b1f7a" />
                <stop offset="62%" stopColor="#d63a72" />
                <stop offset="82%" stopColor="#ff7b3d" />
                <stop offset="100%" stopColor="#ffc25e" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#050310" />
                <stop offset="45%" stopColor="#12082b" />
                <stop offset="78%" stopColor="#2b1050" />
                <stop offset="100%" stopColor="#4a1d63" />
              </>
            )}
          </linearGradient>

          <radialGradient id="jb-sol" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6c2" />
            <stop offset="50%" stopColor="#ffb03a" />
            <stop offset="100%" stopColor="#ff3d7a" />
          </radialGradient>

          <radialGradient id="jb-mane" cx="38%" cy="34%" r="66%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="62%" stopColor="#e2e8ff" />
            <stop offset="100%" stopColor="#98a6d6" />
          </radialGradient>

          <radialGradient id="jb-glod" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={tand ? "#ff7a3d" : "#8494e0"} stopOpacity="0.5" />
            <stop offset="100%" stopColor={tand ? "#ff7a3d" : "#8494e0"} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="jb-fonsterljus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe6a6" />
            <stop offset="100%" stopColor="#ff9c3d" />
          </linearGradient>

          <linearGradient id="jb-fasad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#241c26" />
            <stop offset="100%" stopColor="#120c16" />
          </linearGradient>

          {/* Glöden runt neon. Ligger bara på skylten, aldrig på hela
              scenen: stora oskärpefilter kostar för mycket att rita om. */}
          <filter id="jb-neonglod" x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="6" result="o" />
            <feMerge>
              <feMergeNode in="o" />
              <feMergeNode in="o" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="jb-mjukglod" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" />
          </filter>

          <clipPath id="jb-himmelklipp">
            <rect x="0" y="0" width="1200" height="470" />
          </clipPath>
        </defs>

        {/* Himlen */}
        <rect width="1200" height="620" fill="url(#jb-himmel)" />

        {/* Solstrålarna bakom huset, som i väggmålningen. Roterar så
            långsamt att man knappt ser det hända, bara att bilden lever. */}
        <g clipPath="url(#jb-himmelklipp)">
          <g className="jb-stralar" opacity={tand ? 0.5 : 0.22}>
            {stralar.map((s, i) => (
              <path key={i} d={s.d} fill={s.farg} />
            ))}
          </g>
        </g>

        {/* Stjärnor, bara när det är mörkt */}
        {!tand ? (
          <g className="jb-stjarnor">
            {stjarnor.map((s, i) => (
              <circle
                key={i}
                cx={s.x}
                cy={s.y}
                r={s.r}
                fill="#fff"
                style={{ animationDelay: `${s.d}s` }}
              />
            ))}
          </g>
        ) : null}

        {/* Sol eller måne */}
        <g style={{ opacity: bana.synlighet }} clipPath="url(#jb-himmelklipp)">
          <circle cx={bana.x} cy={bana.y} r="200" fill="url(#jb-glod)" filter="url(#jb-mjukglod)" />
          <circle cx={bana.x} cy={bana.y} r={tand ? 76 : 46} fill={tand ? "url(#jb-sol)" : "url(#jb-mane)"} />
          {!tand ? (
            <>
              <circle cx={bana.x - 14} cy={bana.y - 10} r="9" fill="#c3cdf0" opacity="0.45" />
              <circle cx={bana.x + 13} cy={bana.y + 13} r="6" fill="#c3cdf0" opacity="0.4" />
              <circle cx={bana.x + 3} cy={bana.y - 21} r="4" fill="#c3cdf0" opacity="0.35" />
            </>
          ) : null}
        </g>

        {/* Palmer i siluett */}
        <g fill="#160a1f">
          <g className="jb-palm jb-palm-vanster">
            <Palm x={108} y={470} skala={1.15} />
          </g>
          <g className="jb-palm jb-palm-hoger">
            <Palm x={1104} y={470} skala={0.95} spegel />
          </g>
          <g className="jb-palm jb-palm-mitten">
            <Palm x={1010} y={470} skala={0.6} />
          </g>
        </g>

        {/* Kraftledningarna över scenen */}
        <g stroke="#160a1f" strokeWidth="3" fill="none">
          <path d="M0 96 Q 300 130 620 74" />
          <path d="M0 128 Q 320 168 620 104" />
        </g>

        {/* Skorna som hänger över ledningen */}
        <g className="jb-skor">
          <Skor x={286} y={124} />
        </g>

        {/* Baren */}
        <g>
          {/* Takskiva med utsprång */}
          <rect x="150" y="300" width="900" height="26" rx="3" fill="#1c1420" />
          {/* Fasad */}
          <rect x="172" y="326" width="856" height="144" fill="url(#jb-fasad)" />
          {/* Lodräta panelribbor, som på bilden */}
          <g stroke="#000" strokeOpacity="0.35" strokeWidth="2">
            {Array.from({ length: 28 }, (_, i) => (
              <line key={i} x1={186 + i * 31} y1={326} x2={186 + i * 31} y2={470} />
            ))}
          </g>

          {/* Fönsterrader. Tänds i tur och ordning när det är öppet. */}
          <g className={tand ? "jb-fonster-tanda" : undefined}>
            {fonster.map((f, i) => (
              <rect
                key={i}
                x={f.x}
                y={356}
                width={f.b}
                height={78}
                rx="2"
                fill={tand ? "url(#jb-fonsterljus)" : "#1d1630"}
                style={{ animationDelay: `${0.3 + i * 0.13}s` }}
              />
            ))}
          </g>

          {/* Ljuset som faller ut på marken framför fönstren */}
          {tand ? (
            <path
              d="M200 470 L1000 470 L1040 512 L160 512 Z"
              fill="#ffb457"
              opacity="0.13"
              className="jb-markljus"
            />
          ) : null}

          {/* Vägglampor */}
          <Vagglampa x={196} tand={tand} />
          <Vagglampa x={604} tand={tand} />
          <Vagglampa x={1004} tand={tand} />
        </g>

        {/*
          Neonskylten på ställning ovanför taket, centrerad på x=600 - mitten
          av både huset och hela viewBoxen (0-1200).

          Skylten satt tidigare centrerad på x=817, förskjuten åt höger
          relativt huset. Det märktes inte på bred skärm, men den smala
          beskärningen på mobil (preserveAspectRatio="slice" centrerar alltid
          på viewBoxens mitt) visade då bara skyltens vänstra kant, avhuggen
          mitt i ordet "JÄRNA". Centrerad här hamnar hela skylten inom det
          smalaste beskärningsfönstret också.
        */}
        <g>
          {/* Ställningens ben */}
          <rect x="461" y="272" width="9" height="34" fill="#160f1c" />
          <rect x="729" y="272" width="9" height="34" fill="#160f1c" />

          <g className="jb-neon">
            {/* Svart panel */}
            <rect x="405" y="150" width="390" height="126" rx="6" fill="#0a0710" />
            {/* Cyan neonram */}
            <rect
              x="417"
              y="161"
              width="366"
              height="104"
              rx="4"
              fill="none"
              stroke="#2de2e6"
              strokeWidth="3.5"
              filter="url(#jb-neonglod)"
            />
            <text x="600" y="186" textAnchor="middle" className="jb-skylt-ort" fill="#2de2e6">
              JÄRNA · SWEDEN
            </text>
            <text
              x="600"
              y="230"
              textAnchor="middle"
              className="jb-skylt-namn"
              fill="#ffc542"
              stroke="#2a0f18"
              strokeWidth="5"
              paintOrder="stroke"
            >
              JOE&apos;S BAR
            </text>
            <text x="600" y="256" textAnchor="middle" className="jb-skylt-under" fill="#ff2e88">
              MAT &amp; BAR
            </text>
          </g>
        </g>

        {/* Bänken framför fasaden */}
        <g fill="#c89a63">
          {Array.from({ length: 4 }, (_, i) => (
            <rect key={i} x="250" y={452 + i * 11} width="500" height="7" rx="2" opacity={0.85 - i * 0.07} />
          ))}
          <rect x="266" y="452" width="9" height="48" fill="#8f6b42" />
          <rect x="726" y="452" width="9" height="48" fill="#8f6b42" />
        </g>

        {/* Lowridern, med hydraulik som puttar till bakvagnen */}
        <g className="jb-bil">
          <Lowrider />
        </g>

        {/*
          Trafikljuset i förgrunden. x=250 håller det utanför skyltens fält
          (405-795) - stod det kvar på sin ursprungliga plats (430) skulle
          lådan hamna mitt i den nu centrerade skylten.
        */}
        <Trafikljus x={250} />

        {/* Marken */}
        <rect x="0" y="500" width="1200" height="120" fill="#3a3540" />
        <g stroke="#221f28" strokeWidth="2.5" fill="none" opacity="0.8">
          <path d="M0 528 H1200" />
          <path d="M140 528 L92 620" />
          <path d="M520 528 L566 620" />
          <path d="M900 528 L864 620" />
        </g>
      </svg>

      {/*
        Håller rubriken läsbar oavsett vad som händer bakom den. Mittzonen
        (via) höjdes från 35 till 65: precis där sitter skylten i sin nya,
        centrerade position, och på en smal mobilskärm - där rubriken
        breder ut sig över nästan hela bredden - hann den tidigare tonen
        inte dämpa den tillräckligt. Skylten lyste rakt igenom texten.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-jb-botten/70 via-jb-botten/65 to-jb-botten" />
      <div className="absolute inset-0 bg-gradient-to-r from-jb-botten/85 via-jb-botten/45 to-transparent" />
    </div>
  );
}

/**
 * Solens och månens bana: en båge från vänster till höger, hela tiden
 * ovanför trafikljuset och neonskylten (båda har sin topp vid y=150).
 *
 * En tidigare version lät banan dyka ned mot horisonten i kanterna, som en
 * riktig sol- eller månbana. Vid vissa klockslag hamnade då hela skivan
 * exakt bakom trafikljusets mörka låda och försvann helt - synligt fel,
 * inte en tillfällig skugga. Banan hålls därför alltid ovanför y=140.
 */
function himlakroppsbana(andel: number) {
  const x = 90 + andel * 1020;
  const y = 115 - Math.sin(andel * Math.PI) * 95;
  const synlighet = Math.min(1, Math.sin(andel * Math.PI) * 3.2);
  return { x, y, synlighet: Math.max(0.4, synlighet) };
}

/**
 * Strålknippet bakom huset. Beräknas en gång, inte per rendering.
 *
 * Koordinaterna avrundas till två decimaler. Utan det skiljde sig sista
 * decimalen i Math.cos/Math.sin ibland mellan servern (Node) och
 * webbläsaren, så att den SVG-sträng servern skickade inte matchade den
 * klienten räknade fram vid hydreringen - React varnade i konsolen för
 * varje sidladdning, trots att skillnaden var omärklig för ögat.
 */
const stralar = (() => {
  const cx = 640;
  const cy = 300;
  const langd = 1500;
  const antal = 26;
  const bitar: { d: string; farg: string }[] = [];
  const r = (tal: number) => Math.round(tal * 100) / 100;

  for (let i = 0; i < antal; i++) {
    const mitt = (i / antal) * 360;
    const bredd = i % 5 === 0 ? 2.6 : 5.4;
    const a1 = ((mitt - bredd) * Math.PI) / 180;
    const a2 = ((mitt + bredd) * Math.PI) / 180;
    const x1 = r(cx + Math.cos(a1) * langd);
    const y1 = r(cy + Math.sin(a1) * langd);
    const x2 = r(cx + Math.cos(a2) * langd);
    const y2 = r(cy + Math.sin(a2) * langd);
    bitar.push({
      d: `M${cx} ${cy} L${x1} ${y1} L${x2} ${y2} Z`,
      // Enstaka cyanstrålar bryter av det varma, precis som i målningen.
      farg: i % 5 === 0 ? "#5ad6ea" : i % 2 === 0 ? "#ff8fc4" : "#ffb968",
    });
  }
  return bitar;
})();

const stjarnor = [
  { x: 118, y: 74, r: 1.8, d: 0 },
  { x: 236, y: 146, r: 1.2, d: 1.4 },
  { x: 322, y: 48, r: 2, d: 2.9 },
  { x: 452, y: 112, r: 1.4, d: 0.7 },
  { x: 528, y: 58, r: 1.1, d: 3.6 },
  { x: 606, y: 128, r: 1.6, d: 2.1 },
  { x: 1046, y: 62, r: 1.4, d: 2.6 },
  { x: 1128, y: 122, r: 1.1, d: 4.8 },
  { x: 1088, y: 44, r: 1.7, d: 1.1 },
  { x: 168, y: 206, r: 1.3, d: 1.9 },
  { x: 1150, y: 208, r: 1.5, d: 3.9 },
];

/** Fönsterfälten i fasaden, i två grupper som på bilden. */
const fonster = [
  { x: 208, b: 34 },
  { x: 250, b: 34 },
  { x: 292, b: 34 },
  { x: 334, b: 34 },
  { x: 376, b: 34 },
  { x: 700, b: 34 },
  { x: 742, b: 34 },
  { x: 784, b: 34 },
  { x: 826, b: 34 },
  { x: 868, b: 34 },
  { x: 910, b: 34 },
  { x: 952, b: 34 },
];

function Palm({
  x,
  y,
  skala = 1,
  spegel = false,
}: {
  x: number;
  y: number;
  skala?: number;
  spegel?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${spegel ? -skala : skala} ${skala})`}>
      <path d="M-7 0 C-5 -70 3 -128 16 -180 L30 -176 C16 -124 9 -68 7 0 Z" />
      <path d="M23 -178 C-18 -214 -66 -212 -96 -190 C-60 -194 -32 -184 21 -168 Z" />
      <path d="M25 -180 C7 -230 -30 -256 -68 -260 C-36 -242 -14 -212 18 -174 Z" />
      <path d="M27 -182 C41 -232 27 -268 2 -288 C18 -254 20 -220 23 -176 Z" />
      <path d="M30 -180 C70 -218 114 -216 140 -196 C106 -198 74 -189 30 -170 Z" />
      <path d="M30 -178 C73 -228 109 -237 138 -235 C104 -224 70 -203 27 -169 Z" />
      <path d="M28 -184 C52 -240 92 -262 122 -266 C90 -248 58 -222 26 -178 Z" />
    </g>
  );
}

function Skor({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L2 26" stroke="#160a1f" strokeWidth="2.5" fill="none" />
      <path d="M8 0 L6 24" stroke="#160a1f" strokeWidth="2.5" fill="none" />
      <g fill="#f2f2f4" stroke="#2a1f33" strokeWidth="1.5">
        <path d="M-8 26 L10 26 Q17 26 17 32 L17 35 Q17 39 11 39 L-6 39 Q-11 39 -11 34 Q-11 28 -8 26 Z" />
        <path d="M2 40 L20 40 Q27 40 27 46 L27 49 Q27 53 21 53 L4 53 Q-1 53 -1 48 Q-1 42 2 40 Z" />
      </g>
    </g>
  );
}

function Vagglampa({ x, tand }: { x: number; tand: boolean }) {
  return (
    <g>
      <path d={`M${x - 7} 348 L${x + 7} 348 L${x + 4} 366 L${x - 4} 366 Z`} fill="#1a1220" />
      {tand ? (
        <>
          <path
            d={`M${x - 16} 366 L${x + 16} 366 L${x + 30} 434 L${x - 30} 434 Z`}
            fill="#ffc86b"
            opacity="0.16"
          />
          <circle cx={x} cy={366} r="16" fill="#ffc86b" opacity="0.28" filter="url(#jb-mjukglod)" />
          <circle cx={x} cy={365} r="4" fill="#ffe6ab" className="jb-lykta" />
        </>
      ) : null}
    </g>
  );
}

function Trafikljus({ x }: { x: number }) {
  return (
    <g>
      {/* Stolpen */}
      <rect x={x - 7} y={92} width="14" height="428" fill="#4a4552" />
      <rect x={x - 7} y={92} width="5" height="428" fill="#5d5769" />
      <rect x={x - 20} y={510} width="40" height="12" rx="3" fill="#39343f" />
      {/* Armen upp mot ledningen */}
      <path d={`M${x} 96 L${x + 52} 76`} stroke="#4a4552" strokeWidth="7" fill="none" />

      {/* Lådan. Lamporna växlar rött, gult, grönt. */}
      <rect x={x - 26} y={150} width="52" height="118" rx="8" fill="#2b2732" />
      <circle cx={x} cy={174} r="13" fill="#ff3b30" className="jb-ljus-rod" />
      <circle cx={x} cy={209} r="13" fill="#ffc542" className="jb-ljus-gul" />
      <circle cx={x} cy={244} r="13" fill="#35d07f" className="jb-ljus-gron" />
    </g>
  );
}

function Lowrider() {
  return (
    <g transform="translate(1010 392)">
      {/* Kaross */}
      <path
        d="M0 60 L6 30 Q40 6 96 4 Q150 3 186 26 L214 34 Q232 40 232 56 L232 74 Q232 82 222 82 L8 82 Q0 82 0 74 Z"
        fill="#12101a"
      />
      {/* Rutor */}
      <path d="M26 30 Q52 14 94 13 L94 32 Z" fill="#2c3550" opacity="0.9" />
      <path d="M104 13 Q146 14 174 30 L104 32 Z" fill="#2c3550" opacity="0.9" />
      {/* Kromlist */}
      <rect x="6" y="56" width="222" height="4" rx="2" fill="#8e93a8" opacity="0.75" />
      {/* Bakljus */}
      <rect x="216" y="44" width="14" height="9" rx="3" fill="#ff3b30" />
      {/* Hjul med vitsidor */}
      <g>
        <circle cx="52" cy="82" r="20" fill="#0a0810" />
        <circle cx="52" cy="82" r="11" fill="#e8e4dc" />
        <circle cx="52" cy="82" r="5" fill="#8e93a8" />
        <circle cx="186" cy="82" r="20" fill="#0a0810" />
        <circle cx="186" cy="82" r="11" fill="#e8e4dc" />
        <circle cx="186" cy="82" r="5" fill="#8e93a8" />
      </g>
    </g>
  );
}
