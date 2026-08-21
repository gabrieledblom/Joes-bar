import { describe, expect, it } from 'vitest';
import { beraknaOrder } from './pricing';

describe('prisberäkning på servern', () => {
  it('räknar radpris och totalsumma från menyn', () => {
    const r = beraknaOrder([
      { id: 'husets-original', antal: 2 },
      { id: 'kebabtallrik', antal: 1, tillval: 'Pommes' },
      { id: 'ramlosa', antal: 3 },
    ]);
    expect(r).toMatchObject({ ok: true, summa: 149 * 2 + 129 + 20 * 3 });
  });
  it('avvisar okänd rätt (manipulerat id)', () => {
    expect(beraknaOrder([{ id: 'gratis-mat', antal: 1 }])).toMatchObject({ ok: false });
  });
  it('kräver tillval där menyn kräver det', () => {
    expect(beraknaOrder([{ id: 'schnitzel', antal: 1 }])).toMatchObject({ ok: false });
    expect(beraknaOrder([{ id: 'schnitzel', antal: 1, tillval: 'Ris' }])).toMatchObject({ ok: true });
  });
  it('avvisar påhittat tillval', () => {
    expect(beraknaOrder([{ id: 'kebabtallrik', antal: 1, tillval: 'Tryffel' }])).toMatchObject({ ok: false });
  });
  it('avvisar ogiltigt antal', () => {
    expect(beraknaOrder([{ id: 'pommes', antal: 0 }])).toMatchObject({ ok: false });
    expect(beraknaOrder([{ id: 'pommes', antal: 2.5 }])).toMatchObject({ ok: false });
    expect(beraknaOrder([{ id: 'pommes', antal: 100 }])).toMatchObject({ ok: false });
  });
  it('avvisar tom korg', () => {
    expect(beraknaOrder([])).toMatchObject({ ok: false });
  });
});
