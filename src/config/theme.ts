/**
 * Designtokens – nordisk minimalism i vitt, svart och grått.
 *
 * Systemet vilar på tre saker: gott om luft, hårfina linjer i stället för
 * ramar och rutor, och en enda typsnittsfamilj där vikten bär hierarkin.
 * Inga skuggor, inga fyllda ytor som inte behövs.
 */
export const theme = {
  farger: {
    /** Sidans botten */
    white: '#FFFFFF',
    /** Text och knappar. Nästan svart – rent svart blir hårt mot vitt. */
    black: '#111111',
    /** Vilande ytor, t.ex. sektioner som ska skiljas ut mycket svagt */
    surface: '#FAFAFA',
    /** Hårfin linje – all avgränsning på sajten görs med den här */
    line: '#E6E6E6',
    /**
     * Dämpad text: beskrivningar, bildtexter.
     * Vald mot `surface`, inte mot vitt – 4,8:1 där och 5,0:1 mot vitt.
     * Ett ljusare grått klarar vitt men faller på den grå ytan.
     */
    muted: '#6F6F6F',
  },
  /** En familj, tre vikter. Schibsted Grotesk är ritad i Skandinavien. */
  typsnitt: {
    sans: "'Schibsted Grotesk Variable', 'Helvetica Neue', Arial, sans-serif",
  },
  radie: {
    /** Nästan raka hörn – runda hörn gör designen mjukare än den ska vara */
    liten: '2px',
    stor: '4px',
  },
} as const;
