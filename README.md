# Joe's Bar - beställning online och köksskärm

Två sammankopplade ytor i samma Next.js-app:

- **Gästens sajt** (`/`, `/meny`, `/kassa`) - bläddra i menyn, lägg i varukorg,
  betala med kort eller Swish.
- **Köksskärmen** (`/kok`) - inkommande ordrar i realtid, lösenordsskyddad.

Astro-sajten som låg här tidigare är ersatt. Den tog beställningar via sms
utan betalning; den här tar betalt innan köket börjar laga.

---

## Snabbstart

```bash
npm install
cp .env.example .env.local     # fyll i det du har
npm run dev                    # http://localhost:3000
```

| Kommando | Gör |
| --- | --- |
| `npm run dev` | utvecklingsserver |
| `npm test` | enhetstester (priser, validering, menydata) |
| `npm run typecheck` | typkontroll |
| `npm run build` | produktionsbygge |
| `npm run db:push` | skapar tabellerna i databasen |

Utan `DATABASE_URL` körs ordrarna i minnet och försvinner när servern startas
om. Utan Stripe-nycklar går det inte att betala; kassan säger till i stället
för att låtsas. Resten av sajten fungerar.

---

## ⚠️ Driftsättning i rätt ordning

`STRIPE_WEBHOOK_SECRET` går inte att skapa i förväg. Den kräver en färdig
URL, och utan den blir **ingen betald order synlig i köket**. Pengarna dras,
gästen väntar, skärmen är tom. Följ ordningen:

1. **Skapa databasen.** Neon eller Vercel Postgres. Lägg `DATABASE_URL` i
   Vercel och kör `npm run db:push` mot den.
2. **Deploya** med Stripes testnycklar (`sk_test_...`). Nu finns en riktig
   URL, t.ex. `https://joesbar.vercel.app`.
3. **Registrera webhooken** i Stripe Dashboard → Developers → Webhooks:
   - Endpoint: `https://DIN-URL/api/webhooks/stripe`
   - Händelser: `payment_intent.succeeded`,
     `payment_intent.payment_failed`, `payment_intent.canceled`
4. **Kopiera signeringshemligheten** (`whsec_...`) som Stripe visar, lägg in
   den som `STRIPE_WEBHOOK_SECRET` i Vercel.
5. **Deploya om.** Miljövariabler slår igenom först vid ny deploy.
6. **Testa hela vägen** med Stripes testkort `4242 4242 4242 4242`. Ordern
   ska dyka upp på `/kok` inom några sekunder.
7. Byt till skarpa nycklar och **upprepa steg 3 till 5** - testläge och
   skarpt läge har varsin webhook och varsin hemlighet.

### Slå på Swish

Swish visas bara om det är påslaget i Stripe: **Dashboard → Settings →
Payment methods → Swish**. Koden ber om alla aktiverade metoder, så kort och
Swish dyker upp av sig själva när de är på. Swish kräver att beloppet är i
SEK, vilket det alltid är här.

---

### Varför det ligger en vercel.json här

Vercel-projektet var uppsatt med framework-förinställningen **Blitz.js**,
kvar sedan Astro-tiden då den inte spelade någon roll. Blitz-förinställningen
skjuter in `target` i Next-konfigurationen, och Next.js 16 vägrar starta med
den:

```
Error: The "target" property is no longer supported in next.config.js.
```

`vercel.json` sätter `"framework": "nextjs"` och överstyr projektinställningen
från koden, så bygget inte kan gå sönder igen av en inställning i
webbgränssnittet. Ändra gärna även förinställningen under **Project Settings →
Build & Development Settings → Framework Preset** till Next.js, men filen
räcker.

---

## Miljövariabler

| Variabel | Vad den gör | Var den kommer ifrån |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Serverns Stripe-nyckel | Stripe → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publik Stripe-nyckel | Samma ställe |
| `STRIPE_WEBHOOK_SECRET` | Bevisar att betalningsbeskedet är äkta | Skapas när webhooken registreras, se ovan |
| `DATABASE_URL` | Postgres-anslutning | Neon eller Vercel Postgres |
| `ELKS_API_USERNAME` / `ELKS_API_PASSWORD` | 46elks Basic Auth | 46elks dashboard |
| `ELKS_SMS_FROM` | Avsändarnamn i sms, max 11 tecken | Väljs av er |
| `RESEND_API_KEY` | E-postkvitton | resend.com → API Keys |
| `RESEND_FROM` | Avsändaradress | Verifierad domän hos Resend |
| `KITCHEN_DASHBOARD_PASSWORD` | Lösenord till `/kok` | Väljs av er |
| `NEXT_PUBLIC_SITE_URL` | Länkar i kvitton, Stripes återkomst-URL | Er domän |

---

## 📋 Menyn: ändra priser och rätter

Allt ligger i **`src/data/menu-data.ts`**. Ingen annan fil behöver röras.

```ts
{ id: "pizza-the-classic", namn: "The Classic", pris: 113, ... }
```

- **Ändra pris:** byt siffran efter `pris:`.
- **Sätt pris på en rätt som saknar det:** `pris: null` → `pris: 129`.
  Så länge priset är `null` visas "Pris kommer snart" och rätten går inte
  att lägga i varukorgen. Ingen kan beställa något utan pris.
- **Slut i köket:** `tillganglig: true` → `false`.

Priserna slår igenom överallt samtidigt: menyn, varukorgen, serverns
kontrollräkning, kvittot och köksskärmen.

### Rätter som väntar på pris

Menyn är inlagd efter det tryckta underlaget. Tio rätter saknar pris där och
har därför `pris: null`:

- **Smash Burgare** (8 st): Joe's Original, Smokey West, Bacon Blvd,
  Crispy Bird, Black Gold, Firebird, Hot Shot, Green Light
- **Andra alternativ** (2 st): Fish & Chips, Ribs

De syns på menyn men går inte att beställa. Fyll i priserna så släpps de in
automatiskt.

### Övriga uppgifter som saknas

`src/data/restaurang.ts` har tomma fält som måste fyllas i innan lansering:
gatuadress, telefonnummer, e-post och organisationsnummer. Stripes
Swish-villkor kräver att kontaktuppgifterna syns för gästen, och `/villkor`
visar en tydlig varning så länge de saknas.

Sajten är dessutom märkt `noindex` tills innehållet är komplett. Ta bort
`robots`-raden i `src/app/layout.tsx` när adress och telefon är på plats.

---

## Så hänger det ihop

```
src/data/menu-data.ts     menyn - enda stället priser ändras
src/data/restaurang.ts    adress, öppettider, beställningsregler

src/lib/order-validering.ts  räknar om priser från menyn på servern
src/lib/db/                  schema och orderhantering (Drizzle + Neon)
src/lib/kvitto/              sms via 46elks, e-post via Resend

src/app/api/order              skapar order + PaymentIntent
src/app/api/webhooks/stripe    enda stället en order blir betald
src/app/api/kok/ordrar         köksskärmen hämtar härifrån var 3:e sekund
src/proxy.ts                   låser /kok och /api/kok
```

### Två regler koden vilar på

**Priser räknas alltid om på servern.** Klienten skickar bara rätt-id och
antal. Skulle den skicka en egen summa spelar det ingen roll; servern slår
upp priset i menyn på nytt. Utan det kunde vem som helst betala en krona för
en pizza.

**Bara Stripes webhook gör en order betald.** Ordern skapas i läget
`vantar_betalning` och syns inte i köket. Först när webhooken kommer, med
verifierad signatur, flyttas den till `ny`. En avbruten betalning blir därför
aldrig mat.

### Varför polling och inte websockets

Köksskärmen frågar `/api/kok/ordrar` var tredje sekund. Ett kök på en adress
med en skärm märker inte tre sekunder när maten tar en halvtimme. Polling
behöver ingen extra tjänst, fungerar på Vercel utan särskild konfiguration
och reder ut sig själv efter ett tapp i wifi utan att någon laddar om sidan.

---

## Design

Paletten och typografin kommer från den tryckta menyn: neon på nästan svart
lila, tungt kondenserat displaysnitt (Anton) för rubriker, Geist för text.
Tokens ligger i `src/app/globals.css`.

**Färgregeln:** rosa är enda accentfärgen för interaktion; varje knapp, länk
och fokusring är rosa. Gult, cyan och orange används bara som
kategoriidentitet, aldrig som knapp. Neonfyllningar bär alltid nästan svart
text, eftersom vit text på rosa ger 3,5:1 och underkänns.

**Temat är låst mörkt.** Menyn är tryckt mörk och stället är en bar.

**Rörelsen är avsiktligt sparsam.** Scroll-reveal görs helt i CSS med
`animation-timeline: view()`, inte med JavaScript. Den tidigare
Framer Motion-varianten renderade `opacity: 0` på servern, så utan
JavaScript var halva startsidan osynlig. Innehållet är nu synligt som
utgångsläge och animationen läggs på först där webbläsaren klarar den.
Rubriker animeras aldrig in.

---

## Vad som inte är byggt

Uttalat utanför uppdraget: flera restauranger, stämpelkort, bordsbokning.

Värt att veta:

- **Ingen spärr mot spam-beställningar.** `/api/order` kan anropas i loop och
  skapa obetalda ordrar. De når aldrig köket, men databasen växer. Lägg till
  rate limit innan sajten sprids.
- **Betalflödet är inte testat mot riktiga Stripe-nycklar.** Koden är
  granskad och byggd, men steg 6 i listan ovan måste göras med testkort
  innan ni tar emot en första riktig beställning.
- **Inga foton.** Startsidan är typdriven med menyns färgfält. Egna bilder på
  maten och lokalen skulle lyfta den; lägg dem i `public/` och byt ut
  `Neonhorisont` i heron mot `next/image` med `priority`.

---

## Agent skills

`scripts/install-skills.sh` installerar de design- och frontend-skills som
användes när sajten byggdes. De hämtas från sina upstream-repon vid körning
och vendras inte här.

```bash
./scripts/install-skills.sh                    # globalt (~/.claude/skills)
SKILLS_SCOPE=-p ./scripts/install-skills.sh    # till ./.claude/skills
```

> Skills körs med agentens fulla behörigheter. Läs en skills `SKILL.md`
> innan du litar på den.
