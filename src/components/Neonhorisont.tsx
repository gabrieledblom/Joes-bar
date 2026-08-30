/**
 * Bakgrunden till heron: horisonten och rutnätet från menyns tryck, satt i
 * CSS i stället för som bild. Den väger ingenting, blir aldrig suddig och
 * ligger bakom texten utan att sänka kontrasten.
 *
 * Ersätts av ett riktigt foto på lokalen när ett sådant finns. Lägg då
 * bilden i public/ och byt ut det här elementet mot next/image med priority.
 */
export function Neonhorisont() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Solnedgången */}
      <div
        className="absolute left-1/2 top-[18%] h-[420px] w-[820px] max-w-[160vw] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, #ff2e88 0%, #b3247a 38%, transparent 70%)",
        }}
      />
      {/* Ljusstråk från vänster, som lampan i menyns illustration */}
      <div
        className="absolute -left-24 top-0 h-[520px] w-[420px] opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #2de2e6 0%, transparent 68%)",
        }}
      />
      {/* Rutnätet mot horisonten */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45%] opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ff2e8830 1px, transparent 1px), linear-gradient(to bottom, #ff2e8830 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom, transparent, black 85%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 85%)",
        }}
      />
      {/* Håller texten läsbar oavsett vad som ligger bakom */}
      <div className="absolute inset-0 bg-gradient-to-b from-jb-botten/40 via-jb-botten/55 to-jb-botten" />
    </div>
  );
}
