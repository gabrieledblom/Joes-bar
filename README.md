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
  alla sidor, CLS 0. SEO visar 66 så länge indexeringen är avstängd – enda
  fallerande audit är `is-crawlable`, alltså noindex-spärren nedan. Den
  går till 100 i samma stund flaggan slås på.

## Design och rörelse

Lugnt och enkelt, men varmt – tokens i `src/config/theme.ts`. Gott om luft,
hårfina linjer i stället för ramar, och en enda typsnittsfamilj (Schibsted
Grotesk) där vikten bär hierarkin. Menyn sätts som en lista med ledarlinje
fram till priset, inte som kort.

**Neutralerna är varma, inte kliniska.** Rent `#FFFFFF` och kallgrått fick
sajten att se ut som ett ordbehandlingsdokument bredvid ett foto av en varm
bar. Bottnen är benvitt `#F7F4EF`, texten en nästan-svart som lutar åt brunt.

**Sidan alternerar ljust och mörkt.** Hero (mörk) → urval (ljus) →
öppettider (mörk) → hitta hit (ljus) → footer (mörk). Utan den rytmen föll
sidan rakt ned i platt ljust efter heron och tappade all stämning. `.mork`
vänder allt inuti en sektion i ett svep i stället för att varje textklass
ska dubbleras per sektion.

**En accent, hämtad ur fotot.** Mässing från barlamporna i hero-bilden,
använd på priser och sektionsreglar. Två toner behövs: `brass` lyser på
mörk botten, `brassText` är den mörkare som klarar 4,5:1 på ljus.

Tre fallgropar som är lätta att återinföra:

- **`muted` är kalibrerad mot `surface`, inte mot bottnen.** En ljusare ton
  klarar bottnen men faller på den något mörkare ytan.
- **Mässing på ljus botten måste vara den mörka tonen.** `#D9A441` ger bara
  3,3:1 mot benvitt – för lite för pristext.
- **Animera aldrig in en stor rubrik från `opacity: 0`.** På en ljus sida
  står skärmen tom tills animationen är klar; det sänkte Speed Index från
  1,1 s till 4,2 s. Rubrikerna målas direkt, stödtexterna får röra sig.

Rörelsen ligger samlad i `src/styles/global.css`: kort entré på
stödelement, staggered scroll-reveal via `--fordrojning`, linjer som växer
fram under länkar och en dämpad modalanimation. Allt tystnar under
`prefers-reduced-motion`.

## Hero-bilden

`Hero.astro` plockar upp `src/assets/hero.{jpg,jpeg,png,webp,avif}` via
`import.meta.glob` och kör den genom `astro:assets`, som komprimerar,
konverterar till webp och genererar srcset i fyra bredder. Ägaren kan
alltså lägga in en obehandlad originalfil utan att prestandan tar skada.

Hittas ingen fil renderas varken bilden eller den mörka gradienten, så det
blir ingen 404 – bara den svarta bottnen. Det är avsiktligt: en `<img>` som
alltid pekade på en fil som kanske inte fanns kostade 4 poäng i Best
Practices och 1,2 s Speed Index.

Gradienten är satt så att vit text är läsbar även över en nästan vit bild
(stresstestat), utan att mörka ned ett redan mörkt foto i onödan.

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
