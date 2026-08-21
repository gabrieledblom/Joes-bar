# Joe's Bar – Järna

Webbplats med SMS-beställning för Joe's Bar, restaurang & bar i Järna.
Byggd med Astro + Tailwind CSS, driftad på Vercel, SMS via 46elks.

**Icke-teknisk?** Läs [HANDOVER.md](./HANDOVER.md) – där står hur du ändrar
priser, öppettider och stänger beställningar, plus alla uppgifter som
fortfarande behöver fyllas i (TODO-listan).

## Kommandon

```bash
npm install       # installera beroenden
npm run dev       # utvecklingsserver
npm test          # enhetstester (Vitest)
npm run check     # typkontroll (astro check)
npm run build     # produktionsbygge till dist/
npm run e2e       # röktest av orderflödet + axe-tillgänglighetsskanning
```

## Struktur

```
src/config/    all kundspecifik data – meny, öppettider, tema, beställnings-
               inställningar, kontaktuppgifter. Komponenterna läser härifrån;
               inga priser/tider/telefonnummer är hårdkodade någon annanstans.
src/lib/       öppettidslogik (inkl. stängning efter midnatt), prisberäkning,
               telefonnormalisering, varukorg – delas av klient, server och tester.
src/pages/     /, /meny, /bestall, /bestall/tack, /om-oss, /integritetspolicy
api/order.ts   beställningsendpointen (Vercel Function): validerar allt på
               servern, räknar om priser från menyn, rate-limitar, loggar till
               Upstash Redis (via src/lib/store.ts) och skickar två SMS via
               46elks (mock-läge utan API-nycklar).
```

## Miljövariabler

Se `.env.example`. Utan 46elks-nycklar körs SMS i mock-läge (loggas i stället
för att skickas); i produktion utan nycklar stängs beställningen av med ett
tydligt fel. Orderloggen kräver "Upstash for Redis" via Vercel Marketplace
(miljövariablerna injiceras automatiskt); utan den används ett in-memory-
fallback. Nycklar läggs i Vercel – aldrig i repot.

## Kvalitetskrav som CI-checklista

- `npm test` – 47 tester: öppettider (inkl. natten till lördag), serverside-
  prisomräkning, rate limit, honeypot, SMS-fellägen, GDPR-rensning
- `npm run e2e` – beställningsmodalen (öppna, kräva tillval, summa, Esc),
  korg → utcheckning → bekräftelse, låst läge utanför öppettid, axe
  (WCAG 2.2 AA) utan fel på alla sidor
- `npm run verify` – kör check, test, build och e2e i rätt ordning.
  Använd den före push: e2e ensam kör mot en redan byggd `dist/`.
- Lighthouse mobil: Performance / Accessibility / Best Practices 100 på
  alla sidor. SEO visar 66 så länge indexeringen är avstängd – enda
  fallerande audit är `is-crawlable`, alltså noindex-spärren nedan. Den
  går till 100 i samma stund flaggan slås på.

## Design och rörelse

Monokromt system i vitt, svart och grått – tokens i `src/config/theme.ts`.
Schackrutmönstret från den tryckta menyn är signaturelementet; ytan måste
vara minst `--checker-storlek` hög, annars syns bara en rad och mönstret
läser som streck.

Rörelsen ligger samlad i `src/styles/global.css`: hero-entré, staggered
scroll-reveal via `--fordrojning`, löpande textremsa (`Marquee.astro`,
rullar bara när den syns), invert-hover på menykort och svep på knappar.
Allt tystnar under `prefers-reduced-motion`.

## Beställningsmodalen

`OrderModal.astro` renderas på alla sidor utom `/bestall*` och öppnas av
varje länk med `data-oppna-order`. Länkarna pekar på `/bestall`, så utan
JavaScript – eller vid ctrl/cmd-klick – fungerar de som vanliga länkar.
Bygger på `<dialog showModal()>`, vilket ger fokusfälla, Esc och
bakgrundsinertisering från webbläsaren.

## Sökmotorindexering

`site.sokmotorindexering` i `src/config/site.ts` styr om sajten får
indexeras. Den står på `false` tills adress och telefonnummer är ifyllda:
sidorna får `noindex`, robots.txt svarar `Disallow: /` och ingen sitemap
genereras. Sätt `true` när innehållet är komplett.

---

## Agent skills

Det här repot innehåller också `scripts/install-skills.sh` som installerar
de design-/frontend-skills som användes när sajten byggdes. Skillsen hämtas
från sina upstream-repon vid körning – inget vendras här:

```bash
./scripts/install-skills.sh                    # globalt (~/.claude/skills)
SKILLS_SCOPE=-p ./scripts/install-skills.sh    # till ./.claude/skills
```

| Källa | Skills | Täcker |
| --- | --- | --- |
| `emilkowalski/skill` | 9 | Animation, UI-polish, prototyper |
| `Leonxlnx/taste-skill` | 10 | Visuell riktning, brand kits |
| `pbakaus/impeccable` | 1 | Bred frontend-design/kritik |
| `nextlevelbuilder/ui-ux-pro-max-skill` | 7 | Tokens, paletter, stilbibliotek |
| `anthropics/skills` | 9 | Frontend-design, docs, artifacts |
| `vercel-labs/agent-skills` | 9 | React/Next-praxis, deploys, granskningar |
| `remotion-dev/skills` | 12 | Programmatisk video |
| `bencium/bencium-marketplace` | 7 | UX-perspektiv, design-audits, AEO |
| `AccessLint/skills` | 5 | Tillgänglighet: scan/inspect/audit/fix/diff |

> Skills körs med agentens fulla behörigheter – läs igenom en skills
> `SKILL.md` innan du litar på den.
