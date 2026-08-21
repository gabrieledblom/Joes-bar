/**
 * All kundspecifik grundinfo för sajten. Ändra här – aldrig i komponenterna.
 * Fält märkta TODO fylls i av ägaren (se HANDOVER.md).
 */
export const site = {
  namn: "Joe's Bar",
  tagline: 'Mat & Dryck',
  ort: 'Järna',

  // TODO: hämta från ägaren
  adress: {
    gata: 'TODO Gatuadress 0',
    postnummer: 'TODO',
    postort: 'Järna',
  },
  /** Visningsformat, t.ex. "08-551 700 00" */
  telefon: 'TODO',
  /** Uppringningsbart format, t.ex. "+468551700 00" utan mellanslag */
  telefonE164: '',
  epost: '', // TODO
  facebook: 'https://www.facebook.com/', // TODO: länk till "Joe's bar | Järna"
  instagram: '', // TODO
  orgnr: '', // TODO

  /** TODO: byt till riktig domän när den finns. Driver sitemap + schema.org. */
  url: 'https://joesbar-jarna.vercel.app',
  prisklass: '100–200 kr',
  koket: ['Husmanskost', 'Hamburgare', 'Kebab', 'Sallader'],
} as const;

/** true när ägaren fyllt i ett riktigt telefonnummer */
export const harTelefon = !site.telefon.includes('TODO');
