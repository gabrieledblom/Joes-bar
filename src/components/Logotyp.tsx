/**
 * Ordmärket sätts i sajtens displaysnitt i stället för att laddas som bild.
 * Det håller sig skarpt i alla storlekar och kostar inget extra att hämta.
 * Byt till en riktig SVG-logotyp när den finns.
 */
export function Logotyp({ className = "" }: { className?: string }) {
  return (
    <span
      className={`jb-display leading-none text-jb-rosa ${className}`}
      aria-label="Joe's Bar"
    >
      Joe&apos;s Bar
    </span>
  );
}
