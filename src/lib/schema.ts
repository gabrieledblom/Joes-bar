/**
 * Schema.org-data (JSON-LD) för Restaurant – genereras från config
 * vid build. Fält som ägaren inte fyllt i ännu utelämnas hellre än
 * att publiceras som platshållare.
 */
import { hours, type DayKey } from '../config/hours';
import { harTelefon, site } from '../config/site';
import { formatMinuter, minuterFran } from './hours';

const SCHEMA_DAG: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function restaurangJsonLd(): object {
  const oppettider = (Object.keys(hours) as DayKey[])
    .filter((dag) => hours[dag] !== null)
    .map((dag) => {
      const f = hours[dag]!;
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAG[dag],
        opens: f.open,
        closes: formatMinuter(minuterFran(f.close)),
      };
    });

  const harAdress = !site.adress.gata.includes('TODO');
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: site.namn,
    alternateName: `${site.namn} – ${site.tagline}`,
    url: site.url,
    ...(harTelefon && { telephone: site.telefonE164 }),
    servesCuisine: site.koket,
    priceRange: site.prisklass,
    menu: `${site.url}/meny`,
    address: {
      '@type': 'PostalAddress',
      ...(harAdress && { streetAddress: site.adress.gata, postalCode: site.adress.postnummer }),
      addressLocality: site.adress.postort,
      addressCountry: 'SE',
    },
    openingHoursSpecification: oppettider,
    sameAs: [site.facebook, site.instagram].filter(Boolean),
  };
}
