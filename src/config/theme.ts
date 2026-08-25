/**
 * Designtokens.
 *
 * Fortfarande ett lugnt, enkelt system – men neutralerna är varma i
 * stället för kliniska. Rent #FFFFFF och kallgrått fick sajten att kännas
 * som ett ordbehandlingsdokument bredvid ett foto av en varm bar. Allt
 * här är dragen mot samma varma håll som fotot: benvitt papper, en
 * nästan-svart som lutar åt brunt, och en mässingston hämtad ur
 * barlamporna i bilden.
 *
 * Kontrast är kontrollerad för varje kombination som faktiskt används;
 * siffrorna nedan är uträknade, inte gissade.
 */
export const theme = {
  farger: {
    /** Sidans botten – benvitt papper, inte rent vitt */
    bone: '#F7F4EF',
    /** Text och mörka ytor. Nästan svart med en dragning åt brunt. */
    ink: '#14110E',
    /** Vilande yta, en nyans varmare än bottnen */
    surface: '#EFEAE1',
    /** Hårfin linje – all avgränsning på ljus botten görs med den här */
    line: '#DFD8CC',
    /** Dämpad text på ljus botten (5,4:1 mot benvitt, 4,9:1 mot ytan) */
    muted: '#6B635A',
    /** Dämpad text på mörk botten (7,5:1 mot ink) */
    mutedDark: '#ADA294',
    /**
     * Accent, hämtad ur fotots barlampor. Två toner behövs:
     * den ljusa lyser på mörk botten, den mörka är läsbar på ljus.
     */
    brass: '#D9A441',
    brassText: '#835C1D',
  },
  /** En familj, vikten bär hierarkin. Schibsted Grotesk är ritad i Skandinavien. */
  typsnitt: {
    sans: "'Schibsted Grotesk Variable', 'Helvetica Neue', Arial, sans-serif",
  },
  radie: {
    liten: '2px',
    stor: '4px',
  },
} as const;
