# Överlämning – joesbar-webbplatsen

Det här dokumentet är skrivet för dig som driver Joe's Bar, utan att du ska
behöva kunna programmering. Alla ändringar nedan görs i enkla textfiler –
be gärna den som hjälper dig med sajten att visa en gång, sedan klarar du det själv.

---

## ⚠️ Att komplettera (TODO-lista)

Sajten är fullt fungerande men väntar på följande uppgifter från dig:

| # | Vad | Var det fylls i |
|---|-----|-----------------|
| 1 | **Gatuadress** | `src/config/site.ts` → `adress` |
| 2 | **Telefonnummer** (visning + uppringningsbart) | `src/config/site.ts` → `telefon` och `telefonE164` |
| 3 | **Mobilnummer som tar emot order-SMS** | Netlify → Environment variables → `ORDER_SMS_TO` |
| 4 | **E-postadress** | `src/config/site.ts` → `epost` |
| 5 | **Organisationsnummer** | `src/config/site.ts` → `orgnr` |
| 6 | **Länk till Facebook-sidan** (exakt adress) | `src/config/site.ts` → `facebook` |
| 7 | **Instagram** (om ni har) | `src/config/site.ts` → `instagram` |
| 8 | **Öl, vin & drinkar till menyn** | `src/config/menu.ts` – lägg rätter med kategori `'ol-drinkar'`, kategorin dyker upp av sig själv |
| 9 | **Allergener per rätt** | `src/config/menu.ts` → `allergener: []` på varje rätt |
| 10 | **Logotyp som SVG** (eller PNG minst 1000 px, transparent bakgrund) | ersätter `src/components/Logo.astro` |
| 11 | **Foton på maten och lokalen** | ersätter `Placeholder`-ytorna – inga stockfoton! |
| 12 | **46elks-konto + API-nycklar** (för riktiga SMS) | se "Aktivera SMS" nedan |
| 13 | **Riktig domän** (t.ex. joesbar.se) | `src/config/site.ts` → `url`, plus domäninställning i Netlify |
| 14 | **Exakta kartkoordinater** när adressen är bekräftad | `src/components/MapEmbed.astro` → `lat`/`lon` |

**Viktigt om öppettiderna:** sajten använder de bekräftade tiderna
(mån stängt · tis–tors 14:30–23 · fre 14:30–01 · lör 13–01 · sön 13–21).
Google Business-profilen visar samma tider – **håll dem i synk** om något ändras.
Facebook-sidans text säger däremot "öppet från 12:00", vilket avviker –
**uppdatera Facebook-texten** så kunderna inte får fel information.

---

## Vanliga ändringar

### Ändra ett pris eller en beskrivning
Öppna `src/config/menu.ts`. Varje rätt är en rad, t.ex.:

```ts
{ id: 'schnitzel', namn: 'Schnitzel', pris: 139, ... },
```

Ändra siffran efter `pris:` och spara. Priset uppdateras överallt –
på menyn, i varukorgen, i serverns kontrollräkning och i SMS:et.

### Ta bort en rätt tillfälligt (t.ex. slut i kök)
Samma fil – ändra `tillganglig: true` till `tillganglig: false` på rätten.
Den försvinner från menyn och går inte längre att beställa. Sätt tillbaka
`true` när den finns igen.

### Stänga onlinebeställningen tillfälligt
Öppna `src/config/ordering.ts` och ändra:

```ts
aktiv: true,   →   aktiv: false,
```

Menyn och sajten fortsätter fungera; beställningsformuläret låses med ett
vänligt meddelande och servern avvisar alla beställningsförsök.
Här kan du också ändra förberedelsetiden (30 min) och sista beställning
före stängning (45 min).

### Ändra öppettider
Öppna `src/config/hours.ts`. Stängt = `null`. Stängning efter midnatt
skrivs som mer än 24 – fredagens `close: '25:00'` betyder 01:00 natten
till lördag. Öppettiderna styr automatiskt footern, "Öppet nu"-skylten
och vilka avhämtningstider som går att välja.

> Efter varje ändring: spara filen, committa och pusha (eller be din
> hjälpare) – Netlify bygger och publicerar automatiskt på ca 1 minut.

---

## Om ett SMS inte kommer fram

Sajten är byggd så att **ingen kund får en bekräftelse om ordern inte
nått er**: går restaurangens SMS inte att skicka får kunden ett felmeddelande
med uppmaning att ringa.

Varje beställning loggas dessutom i Netlify (Blobs-lagret `orders`) med
ordernummer, rätter, summa och tid – det är ert säkerhetsnät:

1. Logga in på Netlify → ert projekt → **Blobs** → `orders`.
2. Sök på dagens datum – där ligger varje order som JSON.
3. Kundens SMS är "bäst möjligt": om bara kundens SMS misslyckas finns
   ordern ändå hos er (och i loggen).

Av integritetsskäl rensas namn, mobilnummer och kommentar automatiskt ur
loggen efter 30 dagar; ordernummer, rätter och belopp blir kvar.

---

## Vad kostar SMS:en?

Två SMS per beställning (ett till er, ett till kunden) à ca 0,35 kr hos 46elks:

| Ordrar/månad | SMS | Ungefärlig kostnad |
|---|---|---|
| 100 | 200 | ca 70 kr |
| 300 | 600 | ca 210 kr |
| 600 | 1 200 | ca 420 kr |

Ingen månadsavgift – ni betalar per skickat SMS.

---

## Aktivera SMS (engångsjobb)

Sajten fungerar redan nu i "mock-läge": beställningar loggas men inga
riktiga SMS skickas. I skarp drift utan nycklar stängs beställningen av
med ett tydligt meddelande – den låtsas aldrig.

1. Skapa konto på [46elks.se](https://46elks.se) och sätt in pengar.
2. Kopiera **API username** och **API password** från deras dashboard.
3. I Netlify: **Site settings → Environment variables**, lägg in:
   - `ELKS_API_USERNAME` = användarnamnet
   - `ELKS_API_PASSWORD` = lösenordet
   - `ORDER_SMS_TO` = mobilnumret som ska ta emot order (t.ex. `+46701234567`)
4. Klicka **Deploy site** igen. Klart – SMS:en skickas nu på riktigt,
   med avsändarnamnet **JoesBar**.

Nycklarna ligger bara i Netlify – aldrig i koden.

---

## Publicera sajten (engångsjobb)

1. Skapa konto på [netlify.com](https://netlify.com) och välj **Import from Git**.
2. Peka på det här repot. Netlify läser `netlify.toml` och ställer in allt själv.
3. Lägg in miljövariablerna ovan (eller vänta – mock-läget funkar under test).
4. Koppla er domän under **Domain settings** och uppdatera `url` i
   `src/config/site.ts` till den riktiga adressen.

## För den som hjälper till tekniskt

```bash
npm install       # en gång
npm test          # 47 enhetstester (öppettider, priser, orderfunktionen)
npm run check     # typkontroll
npm run build     # bygger sajten till dist/
npm run e2e       # röktest av hela orderflödet + tillgänglighetsskanning
```

Arkitekturen: Astro (statisk sajt) + en enda Netlify-funktion
(`netlify/functions/order.mts`) som validerar allt på servern – priser
räknas alltid om från `menu.ts`, aldrig från klienten. All kundspecifik
data ligger i `src/config/` – inga priser, tider eller telefonnummer är
hårdkodade i komponenterna.
