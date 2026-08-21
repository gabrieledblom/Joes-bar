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
- `npm run e2e` – korg → utcheckning → bekräftelse, låst läge utanför
  öppettid, axe (WCAG 2.2 AA) utan fel på alla sidor
- Lighthouse mobil: 100/100/100/100 på alla sidor vid senaste mätning

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
