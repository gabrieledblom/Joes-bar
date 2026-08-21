/**
 * Designtokens – monokromt system i vitt, svart och grått.
 *
 * Schackrutmönstret från den tryckta menyn är kvar som signaturelement;
 * i svart och vitt blir det snarast starkare. Matas in i Tailwind via
 * CSS-variabler i Layout.astro + @theme i global.css.
 */
export const theme = {
  farger: {
    /** Rent vitt – huvudbakgrund */
    white: '#FFFFFF',
    /** Svart – text, mörka sektioner, CTA-ytor */
    black: '#0B0B0B',
    /** Ljusgrått – alternerande sektionsbakgrund */
    greyLight: '#F2F2F2',
    /** Mellangrått – ramar och avdelare */
    greyLine: '#D8D8D8',
    /** Mörkgrått – dämpad text (6,4:1 mot vitt) */
    greyText: '#5F5F5F',
  },
  typsnitt: {
    display: "'Anton', 'Arial Narrow', Impact, sans-serif",
    body: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif",
  },
  radie: {
    kort: '1rem',
    knapp: '0.5rem',
  },
} as const;
