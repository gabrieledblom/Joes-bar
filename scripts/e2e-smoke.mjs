/**
 * E2E-röktest: korg → utcheckning → (mockad orderfunktion) → bekräftelsesida,
 * plus låst läge utanför öppettid och axe-tillgänglighetsskanning av alla sidor.
 *
 * Körs mot en byggd sajt:  npm run build && node scripts/e2e-smoke.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BAS = 'http://localhost:4321';
let fel = 0;
const ok = (namn) => console.log(`  ✓ ${namn}`);
const misslyckat = (namn, detalj) => {
  console.error(`  ✗ ${namn}\n    ${detalj}`);
  fel++;
};

// Starta astro preview och vänta tills servern svarar
const server = spawn('npx', ['astro', 'preview', '--port', '4321'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) {
  try {
    await fetch(BAS);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
try {
  // ---- Flöde 1: beställning hela vägen (fredag kväll, öppet) ----
  console.log('Orderflödet (fredag 18:00):');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-08-21T16:00:00Z') }); // 18:00 i Stockholm

  await page.route('**/api/order', async (route) => {
    const body = route.request().postDataJSON();
    if (body.namn === 'Testina' && body.mobil === '+46701234567' && body.rader?.length === 2 && !body.summa) {
      await route.fulfill({ json: { ok: true, ordernummer: '42', tid: body.pickupAt.slice(11), summa: 337 } });
    } else {
      await route.fulfill({ status: 400, json: { ok: false, fel: 'Oväntad payload i testet' } });
    }
  });

  await page.goto(`${BAS}/meny`);
  await page.locator('[data-ratt-id="husets-original"] [data-lagg-till]').click();

  // Tillval krävs innan tallriken kan läggas till
  const kebabkort = page.locator('[data-ratt-id="kebabtallrik"]');
  await kebabkort.locator('[data-lagg-till]').click();
  if (await kebabkort.locator('[data-tillval].behover-val').count()) ok('tillval krävs före "Lägg till"');
  else misslyckat('tillval krävs före "Lägg till"', 'ingen markering på select');
  await kebabkort.locator('[data-tillval]').selectOption('Pommes');
  await kebabkort.locator('[data-lagg-till]').click();

  const badge = await page.locator('[data-korg-antal]').textContent();
  if (badge === '2') ok('korg-badgen visar 2');
  else misslyckat('korg-badgen visar 2', `visar "${badge}"`);

  await page.goto(`${BAS}/bestall`);
  const summa = await page.locator('[data-korg-summa]').textContent();
  if (summa === '278 kr') ok('summan i korgen är 278 kr');
  else misslyckat('summan i korgen är 278 kr', `visar "${summa}"`);

  await page.locator('#namn').fill('Testina');
  await page.locator('#mobil').fill('070-123 45 67');
  const forstaTid = await page.locator('#tid option:nth-child(2)').getAttribute('value');
  if (forstaTid === '2026-08-21T18:30') ok('första avhämtningstid är 18:30 (nu + 30 min)');
  else misslyckat('första avhämtningstid är 18:30', `är "${forstaTid}"`);
  await page.locator('#tid').selectOption(forstaTid);
  await page.locator('[data-skicka]').click();

  await page.waitForURL('**/bestall/tack', { timeout: 5000 });
  const bekraftelse = await page.locator('[data-bekraftelse]').textContent();
  if (bekraftelse?.includes('#42') && bekraftelse.includes('337 kr')) ok('bekräftelsesidan visar ordernummer och summa');
  else misslyckat('bekräftelsesidan visar ordernummer och summa', bekraftelse?.slice(0, 120) ?? 'tom');
  await ctx.close();

  // ---- Flöde 2: låst läge på måndag ----
  console.log('Låst läge (måndag 18:00):');
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.clock.install({ time: new Date('2026-08-17T16:00:00Z') });
  await page2.goto(`${BAS}/bestall`);
  await page2.evaluate(() => sessionStorage.setItem('jb-korg', JSON.stringify([{ id: 'pommes', antal: 1 }])));
  await page2.reload();
  const meddelande = await page2.locator('[data-last-meddelande]').textContent();
  if (meddelande?.includes('Vi öppnar igen tisdag kl 14:30')) ok('formuläret är låst med "Vi öppnar igen tisdag kl 14:30"');
  else misslyckat('formuläret är låst med öppningstid', meddelande?.slice(0, 120) ?? 'tomt');
  const inaktiverat = await page2.locator('#namn').isDisabled();
  if (inaktiverat) ok('fälten är inaktiverade men formuläret syns');
  else misslyckat('fälten är inaktiverade', 'fieldset ej disabled');
  await ctx2.close();

  // ---- Axe-skanning av alla sidor ----
  console.log('Tillgänglighet (axe, WCAG 2.1 AA):');
  const ctx3 = await browser.newContext({ reducedMotion: 'reduce' });
  const page3 = await ctx3.newPage();
  for (const sokvag of ['/', '/meny', '/bestall', '/bestall/tack', '/om-oss', '/integritetspolicy']) {
    await page3.goto(`${BAS}${sokvag}`);
    const resultat = await new AxeBuilder({ page: page3 })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    if (resultat.violations.length === 0) ok(`${sokvag} – inga axe-fel`);
    else
      misslyckat(
        `${sokvag} – ${resultat.violations.length} axe-fel`,
        resultat.violations.map((v) => `${v.id}: ${v.nodes.length} st (${v.nodes[0]?.target})`).join('; '),
      );
  }
  await ctx3.close();
} finally {
  await browser.close();
  server.kill();
  spawn('npx', ['astro', 'preview', 'stop'], { stdio: 'ignore' });
}

console.log(fel === 0 ? '\nAlla röktester gröna.' : `\n${fel} test misslyckades.`);
process.exit(fel === 0 ? 0 : 1);
