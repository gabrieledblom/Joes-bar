/**
 * Lagring för orderfunktionen: löpnummer, rate limit och orderlogg.
 *
 * I drift används Upstash Redis (läggs till via Vercel Marketplace →
 * "Upstash for Redis"; miljövariablerna KV_REST_API_URL/KV_REST_API_TOKEN
 * eller UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN injiceras då
 * automatiskt). Utan de variablerna används ett in-memory-fallback –
 * rätt för lokal utveckling och tester, men i produktion betyder det att
 * loggen försvinner vid omstart, så där varnas det högt.
 *
 * GDPR sköts med TTL i stället för städjobb: den fulla loggposten (med
 * namn/mobil/kommentar) får 30 dagars livslängd, medan en avskalad
 * arkivpost (ordernummer, rätter, belopp) sparas utan personuppgifter.
 */
import { Redis } from '@upstash/redis';

export interface OrderStore {
  /** Ökar räknaren och sätter TTL första gången. Returnerar nya värdet. */
  okaRaknare(nyckel: string, ttlSek: number): Promise<number>;
  hamtaJson<T>(nyckel: string): Promise<T | null>;
  sattJson(nyckel: string, varde: unknown, ttlSek?: number): Promise<void>;
}

/* ------------------------------------------------ In-memory-fallback -- */

interface MinnesPost {
  varde: unknown;
  gallerTill: number | null;
}

const minne = new Map<string, MinnesPost>();

/** Endast för tester */
export function aterstallMinnesStore(): void {
  minne.clear();
}

const minnesHamta = (nyckel: string): MinnesPost | null => {
  const post = minne.get(nyckel);
  if (!post) return null;
  if (post.gallerTill !== null && post.gallerTill <= Date.now()) {
    minne.delete(nyckel);
    return null;
  }
  return post;
};

const minnesStore: OrderStore = {
  async okaRaknare(nyckel, ttlSek) {
    const post = minnesHamta(nyckel);
    const varde = (typeof post?.varde === 'number' ? post.varde : 0) + 1;
    minne.set(nyckel, { varde, gallerTill: post?.gallerTill ?? Date.now() + ttlSek * 1000 });
    return varde;
  },
  async hamtaJson<T>(nyckel: string) {
    return (minnesHamta(nyckel)?.varde as T | undefined) ?? null;
  },
  async sattJson(nyckel, varde, ttlSek) {
    minne.set(nyckel, { varde, gallerTill: ttlSek ? Date.now() + ttlSek * 1000 : null });
  },
};

/* -------------------------------------------------------- Upstash ----- */

function redisStore(url: string, token: string): OrderStore {
  const redis = new Redis({ url, token });
  return {
    async okaRaknare(nyckel, ttlSek) {
      const varde = await redis.incr(nyckel);
      if (varde === 1) await redis.expire(nyckel, ttlSek);
      return varde;
    },
    async hamtaJson<T>(nyckel: string) {
      return (await redis.get<T>(nyckel)) ?? null;
    },
    async sattJson(nyckel, varde, ttlSek) {
      await redis.set(nyckel, varde, ttlSek ? { ex: ttlSek } : undefined);
    },
  };
}

export function orderStore(): OrderStore {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url, token);
  if (process.env.VERCEL_ENV === 'production') {
    console.warn(
      'Ingen Redis konfigurerad i produktion – orderlogg och rate limit lever bara per instans. ' +
        'Lägg till "Upstash for Redis" via Vercel Marketplace (se HANDOVER.md).',
    );
  }
  return minnesStore;
}
