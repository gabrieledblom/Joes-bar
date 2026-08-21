import { describe, expect, it } from 'vitest';
import { normaliseraMobil } from './phone';

describe('mobilnummer', () => {
  it('normaliserar 07-format till E.164', () => {
    expect(normaliseraMobil('0701234567')).toBe('+46701234567');
    expect(normaliseraMobil('070-123 45 67')).toBe('+46701234567');
  });
  it('accepterar +46-format', () => {
    expect(normaliseraMobil('+46 70 123 45 67')).toBe('+46701234567');
    expect(normaliseraMobil('0046701234567')).toBe('+46701234567');
  });
  it('avvisar fasta nummer och skräp', () => {
    expect(normaliseraMobil('08-551 700 00')).toBeNull();
    expect(normaliseraMobil('+468551700')).toBeNull();
    expect(normaliseraMobil('070123456')).toBeNull();
    expect(normaliseraMobil('07012345678')).toBeNull();
    expect(normaliseraMobil('ring mig')).toBeNull();
  });
});
