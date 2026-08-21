/**
 * Inställningar för beställningsflödet.
 */
export const ordering = {
  /**
   * Sätt till false för att tillfälligt stänga beställningar
   * (t.ex. vid fullt kök). Låser både formuläret och servern.
   */
  aktiv: true,

  /** Minuter från beställning till tidigaste avhämtning */
  forberedelseMin: 30,
  /** Avhämtningstider genereras i det här intervallet (minuter) */
  intervallMin: 15,
  /** Sista avhämtning så här många minuter före stängning */
  stoppForeStangningMin: 45,

  /** Ordrar över det här beloppet (kr) avvisas med uppmaning att ringa */
  maxOrderVarde: 3000,
  /** Rate limit per IP-adress och timme */
  maxOrdrarPerIpPerTimme: 5,

  /** Alfanumeriskt SMS-avsändarnamn, max 11 tecken */
  smsAvsandare: 'JoesBar',
} as const;
