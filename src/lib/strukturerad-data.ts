import {
  dagOrdning,
  oppettider,
  restaurang,
  type Veckodag,
} from "@/data/restaurang";

const schemaDag: Record<Veckodag, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** "25:00" betyder 01:00 natten efter, och det är så Google vill läsa det. */
function klockslag(tid: string): string {
  const [timme, minut] = tid.split(":").map(Number);
  return `${String(timme % 24).padStart(2, "0")}:${String(minut).padStart(2, "0")}`;
}

/**
 * Restaurangen beskriven för sökmotorer (schema.org). Det är det här som gör
 * att Google kan visa öppettider, adress och telefonnummer direkt i
 * sökresultatet. Uppgifterna hämtas från samma ställe som resten av sajten,
 * så en ändrad öppettid slår igenom här också.
 */
export function restaurangJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurang.namn,
    url: restaurang.url,
    image: `${restaurang.url}/opengraph-image`,
    description:
      "Pizza, smash burgare, kebab och sides i Järna. Beställ och betala online, hämta när det är klart.",
    servesCuisine: ["Pizza", "Burgare", "Kebab"],
    hasMenu: `${restaurang.url}/meny`,
    telephone: restaurang.telefonE164,
    ...(restaurang.epost ? { email: restaurang.epost } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurang.adress.gata,
      postalCode: restaurang.adress.postnummer,
      addressLocality: restaurang.adress.postort,
      addressCountry: "SE",
    },
    openingHoursSpecification: dagOrdning.flatMap((dag) => {
      const tid = oppettider[dag];
      return tid
        ? [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: `https://schema.org/${schemaDag[dag]}`,
              opens: klockslag(tid.open),
              closes: klockslag(tid.close),
            },
          ]
        : [];
    }),
  };
}

/** JSON att lägga i en script-tagg. "<" görs om så att en text aldrig kan stänga taggen. */
export function tillScriptJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
