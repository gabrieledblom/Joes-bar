/**
 * Designtokens – härledda från den tryckta menyn (djupgrön, cream,
 * tung versalgrotesk, schackrutmönster). Matas in i Tailwind via
 * CSS-variabler i Layout.astro + @theme i global.css.
 */
export const theme = {
  farger: {
    /** Djupgrön – huvudfärg, mörka sektioner, stora rubriker */
    green: '#1B6B3C',
    /** Mörkare grön för hover/tryckta lägen */
    greenDeep: '#12522C',
    /** Cream – ljus bakgrund, aldrig ren vit */
    cream: '#F6F1E3',
    /** Nästan-svart – all brödtext */
    ink: '#161A14',
    /** Bärnstensgul – CTA-ytor, med ink-text ovanpå */
    amber: '#E8A82B',
    /** Mörk ockra – accentTEXT på cream (klarar 4.5:1) */
    amberText: '#7A5600',
    /** Dämpad grön – ramar och avdelare */
    sage: '#7C9A82',
  },
  typsnitt: {
    display: "'Anton', 'Arial Narrow', Impact, sans-serif",
    body: "'Archivo Variable', 'Helvetica Neue', Arial, sans-serif",
  },
  radie: {
    kort: '1.25rem',
    knapp: '0.65rem',
  },
} as const;
