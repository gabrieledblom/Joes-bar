/**
 * Svenska mobilnummer: 07XXXXXXXX eller +467XXXXXXXX.
 * Normaliseras till E.164 (+467XXXXXXXX) innan SMS.
 */
export function normaliseraMobil(input: string): string | null {
  const s = input.replace(/[\s\-()]/g, '');
  if (/^07\d{8}$/.test(s)) return `+46${s.slice(1)}`;
  if (/^\+467\d{8}$/.test(s)) return s;
  if (/^00467\d{8}$/.test(s)) return `+${s.slice(2)}`;
  return null;
}
