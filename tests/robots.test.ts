import { describe, expect, it } from 'vitest';
import { site } from '../src/config/site';
import { GET } from '../src/pages/robots.txt';

describe('robots.txt', () => {
  it('följer flaggan sokmotorindexering', async () => {
    const kropp = await (GET({} as never) as Response).text();
    if (site.sokmotorindexering) {
      expect(kropp).toContain('Allow: /');
      expect(kropp).toContain(`Sitemap: ${site.url}/sitemap-index.xml`);
    } else {
      // Halvfärdig sajt ska inte hamna i Googles index
      expect(kropp).toContain('Disallow: /');
      expect(kropp).not.toContain('Sitemap:');
    }
  });
});
