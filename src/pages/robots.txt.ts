import type { APIRoute } from 'astro';
import { site } from '../config/site';

/**
 * Så länge site.sokmotorindexering är false ber vi sökmotorerna hålla sig
 * borta – sajten ska inte indexeras med platshållarinnehåll.
 */
const kropp = site.sokmotorindexering
  ? `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap-index.xml\n`
  : 'User-agent: *\nDisallow: /\n';

export const GET: APIRoute = () =>
  new Response(kropp, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
