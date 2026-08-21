import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from './order.js';
import { aterstallMinnesStore, orderStore } from '../src/lib/store.js';

/** Tisdag 2026-08-18 kl 15:00 i Stockholm (CEST = UTC+2) */
const TISDAG_15 = new Date('2026-08-18T13:00:00Z');

const giltigOrder = () => ({
  namn: 'Anna',
  mobil: '070-123 45 67',
  pickupAt: '2026-08-18T16:00',
  kommentar: 'ingen lök',
  webbplats: '',
  rader: [
    { id: 'husets-original', antal: 2 },
    { id: 'kebabtallrik', antal: 1, tillval: 'Pommes' },
  ],
});

const skicka = (body: unknown, ip = '198.51.100.7') =>
  handler(
    new Request('http://localhost/api/order', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `${ip}, 10.0.0.1` },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  aterstallMinnesStore();
  vi.useFakeTimers();
  vi.setSystemTime(TISDAG_15);
  delete process.env.ELKS_API_USERNAME;
  delete process.env.ELKS_API_PASSWORD;
  delete process.env.VERCEL_ENV;
  process.env.ORDER_SMS_TO = '+46700000001';
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('order-funktionen', () => {
  it('tar emot en giltig order i mock-läge och räknar summan på servern', async () => {
    const res = await skicka({ ...giltigOrder(), summa: 1 }); // klientens "summa" ska ignoreras
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ ok: true, ordernummer: '1', tid: '16:00', summa: 149 * 2 + 129 });
  });

  it('räknar upp ordernumret per dag', async () => {
    await skicka(giltigOrder(), '198.51.100.1');
    const res = await skicka(giltigOrder(), '198.51.100.2');
    expect((await res.json()).ordernummer).toBe('2');
  });

  it('loggar ordern som säkerhetsnät', async () => {
    await skicka(giltigOrder());
    const post = await orderStore().hamtaJson<Record<string, unknown>>('order:2026-08-18:1');
    expect(post).toMatchObject({ ordernummer: '1', summa: 427, mobil: '+46701234567', smsStatus: 'mock' });
  });

  it('arkivposten saknar personuppgifter och överlever 30-dagarsgränsen', async () => {
    await skicka(giltigOrder());
    const arkiv = await orderStore().hamtaJson<Record<string, unknown>>('orderarkiv:2026-08-18:1');
    expect(arkiv).toMatchObject({ ordernummer: '1', summa: 427 });
    expect(arkiv!.mobil).toBeUndefined();
    expect(arkiv!.namn).toBeUndefined();
    expect(arkiv!.kommentar).toBeUndefined();

    // 31 dagar senare: fulla loggposten (med personuppgifter) har gått ut, arkivet finns kvar
    vi.setSystemTime(new Date('2026-09-18T13:00:00Z'));
    expect(await orderStore().hamtaJson('order:2026-08-18:1')).toBeNull();
    expect(await orderStore().hamtaJson('orderarkiv:2026-08-18:1')).not.toBeNull();
  });

  it('avvisar manipulerade rader (okänt id)', async () => {
    const res = await skicka({ ...giltigOrder(), rader: [{ id: 'gratis-mat', antal: 1 }] });
    expect(res.status).toBe(400);
  });

  it('avvisar rätt utan obligatoriskt tillval', async () => {
    const res = await skicka({ ...giltigOrder(), rader: [{ id: 'schnitzel', antal: 1 }] });
    expect(res.status).toBe(400);
  });

  it('avvisar ifyllt honeypot-fält', async () => {
    const res = await skicka({ ...giltigOrder(), webbplats: 'http://spam.example' });
    expect(res.status).toBe(400);
  });

  it('avvisar ogiltigt mobilnummer', async () => {
    const res = await skicka({ ...giltigOrder(), mobil: '08-551 700 00' });
    expect(res.status).toBe(400);
  });

  it('avvisar avhämtningstid utanför öppettid', async () => {
    const res = await skicka({ ...giltigOrder(), pickupAt: '2026-08-18T23:00' });
    expect(res.status).toBe(400);
  });

  it('godkänner tid över midnatt natt mot lördag', async () => {
    vi.setSystemTime(new Date('2026-08-21T21:30:00Z')); // fredag 23:30 i Stockholm
    const res = await skicka({ ...giltigOrder(), pickupAt: '2026-08-22T00:15' });
    expect(res.status).toBe(200);
    expect((await res.json()).tid).toBe('00:15');
  });

  it('avvisar order över maxvärdet', async () => {
    const res = await skicka({ ...giltigOrder(), rader: [{ id: 'plankstek-biff', antal: 15 }] }); // 3285 kr
    expect(res.status).toBe(400);
    expect((await res.json()).fel).toContain('3000');
  });

  it('rate-limitar per IP', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await skicka(giltigOrder(), '203.0.113.9');
      expect(res.status).toBe(200);
    }
    const res = await skicka(giltigOrder(), '203.0.113.9');
    expect(res.status).toBe(429);
  });

  it('stänger beställningar i produktion utan SMS-nycklar', async () => {
    process.env.VERCEL_ENV = 'production';
    const res = await skicka(giltigOrder());
    expect(res.status).toBe(503);
  });

  it('returnerar fel när restaurangens SMS inte går fram – ingen falsk bekräftelse', async () => {
    process.env.ELKS_API_USERNAME = 'u';
    process.env.ELKS_API_PASSWORD = 'p';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const res = await skicka(giltigOrder());
    expect(res.status).toBe(502);
    const post = await orderStore().hamtaJson<Record<string, unknown>>('order:2026-08-18:1');
    expect(post!.smsStatus).toBe('misslyckades');
  });

  it('skickar två SMS via 46elks när nycklar finns', async () => {
    process.env.ELKS_API_USERNAME = 'u';
    process.env.ELKS_API_PASSWORD = 'p';
    const anrop: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        anrop.push(String(init.body));
        return new Response('{}', { status: 200 });
      }),
    );
    const res = await skicka(giltigOrder());
    expect(res.status).toBe(200);
    expect(anrop).toHaveLength(2);
    expect(anrop[0]).toContain('NY+ORDER');
    expect(anrop[0]).toContain('%2B46700000001'); // först till restaurangen
    expect(anrop[1]).toContain('%2B46701234567'); // sedan till kunden
    expect(anrop[1]).toContain('betalas+p%C3%A5+plats');
  });
});
