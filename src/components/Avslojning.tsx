/**
 * Scroll-reveal för stödinnehåll.
 *
 * Ren CSS, ingen klientkomponent. Innehållet är synligt som utgångsläge
 * och animeras bara där webbläsaren stöder scroll-drivna animationer;
 * saknas stödet, eller JavaScript, står texten still och läsbar.
 *
 * Rubriker animeras aldrig in. På en sida som ska sälja mat får skärmen
 * inte stå tom medan något tonar fram.
 */
export function Avslojning({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`jb-avsloj ${className}`}>{children}</div>;
}
