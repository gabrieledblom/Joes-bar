/**
 * Hela menyn – enda källan för både UI och serverns prisberäkning.
 *
 * Ändra ett pris: hitta rätten nedan och ändra `pris`.
 * Ta bort en rätt tillfälligt: sätt `tillganglig: false`.
 * Ny kategori (t.ex. öl & drinkar): lägg rätter med kategori 'ol-drinkar'
 * – kategorin finns redan och visas automatiskt när den får innehåll.
 */
export type KategoriId =
  | 'snacks'
  | 'huvudratter'
  | 'planka'
  | 'burgare'
  | 'sallader'
  | 'kebab'
  | 'dryck'
  | 'ol-drinkar';

export interface Kategori {
  id: KategoriId;
  namn: string;
  /** Gemensam rad som gäller alla rätter i kategorin */
  beskrivning?: string;
}

export interface Tillval {
  label: string;
  alternativ: readonly string[];
}

export interface MenyRatt {
  id: string;
  namn: string;
  /** SEK */
  pris: number;
  beskrivning?: string;
  kategori: KategoriId;
  /** Måste väljas innan rätten kan läggas i korgen */
  tillval?: Tillval;
  /** TODO: fylls i av ägaren */
  allergener: string[];
  tillganglig: boolean;
  /** Visas i "populära rätter" på startsidan */
  popular?: boolean;
}

export const kategorier: Kategori[] = [
  { id: 'snacks', namn: 'Snacks' },
  { id: 'huvudratter', namn: 'Huvudrätter' },
  { id: 'planka', namn: 'Planka', beskrivning: 'Serveras med baconlindad sparris, tomat, rödvinssås & bearnaise' },
  { id: 'burgare', namn: 'Burgare', beskrivning: 'Sallad, tomat, lök & pommes till alla' },
  { id: 'sallader', namn: 'Sallader', beskrivning: 'Sallad, tomat, gurka & lök i nr 1–4' },
  { id: 'kebab', namn: 'Kebabrätter', beskrivning: 'Sallad, tomat, lök & feferoni till alla' },
  { id: 'dryck', namn: 'Dryck' },
  { id: 'ol-drinkar', namn: 'Öl & drinkar' },
];

const TILLBEHOR3: Tillval = { label: 'Tillbehör', alternativ: ['Ris', 'Pommes', 'Klyftpotatis'] };
const TILLBEHOR2: Tillval = { label: 'Tillbehör', alternativ: ['Ris', 'Pommes'] };

export const meny: MenyRatt[] = [
  // Snacks
  { id: 'vitloksbrod', namn: 'Vitlöksbröd', pris: 39, kategori: 'snacks', allergener: [], tillganglig: true },
  { id: 'chili-cheese', namn: 'Chili cheese', pris: 39, kategori: 'snacks', allergener: [], tillganglig: true },
  { id: 'onion-rings', namn: 'Onion rings', pris: 39, kategori: 'snacks', allergener: [], tillganglig: true },
  { id: 'mozzarellasticks', namn: 'Mozzarellasticks', pris: 39, kategori: 'snacks', allergener: [], tillganglig: true },
  { id: 'pommes', namn: 'Pommes', pris: 49, kategori: 'snacks', allergener: [], tillganglig: true },
  { id: 'crispy-halloumi', namn: 'Crispy halloumi', pris: 69, kategori: 'snacks', allergener: [], tillganglig: true },
  { id: 'dirty-fries', namn: 'Dirty fries', pris: 69, beskrivning: 'Pommes med ostsås, jalapeños & rödlök', kategori: 'snacks', allergener: [], tillganglig: true, popular: true },
  { id: 'buffalo-wings', namn: 'Buffalo wings', pris: 79, beskrivning: 'BBQ-marinerade kycklingvingar och ben', kategori: 'snacks', allergener: [], tillganglig: true },

  // Huvudrätter
  { id: 'flasknoisette', namn: 'Fläsknoisette', pris: 129, kategori: 'huvudratter', tillval: TILLBEHOR3, allergener: [], tillganglig: true },
  { id: 'schnitzel', namn: 'Schnitzel', pris: 139, kategori: 'huvudratter', tillval: TILLBEHOR3, allergener: [], tillganglig: true, popular: true },
  { id: 'fish-chips', namn: 'Fish & chips', pris: 139, beskrivning: 'Fisk med pommes & remouladsås', kategori: 'huvudratter', allergener: [], tillganglig: true },
  { id: 'kycklingpasta', namn: 'Kycklingpasta', pris: 129, beskrivning: 'Curry, champinjoner & tomat', kategori: 'huvudratter', allergener: [], tillganglig: true },
  { id: 'oxfilepasta', namn: 'Oxfilépasta', pris: 149, beskrivning: 'Champinjoner, vitlök & tomat', kategori: 'huvudratter', allergener: [], tillganglig: true },
  { id: 'kycklingspett', namn: 'Kycklingspett', pris: 159, kategori: 'huvudratter', tillval: TILLBEHOR3, allergener: [], tillganglig: true },
  { id: 'notfarsspett', namn: 'Nötfärsspett', pris: 169, kategori: 'huvudratter', tillval: TILLBEHOR3, allergener: [], tillganglig: true },
  { id: 'grillad-lax', namn: 'Grillad lax', pris: 169, kategori: 'huvudratter', tillval: TILLBEHOR3, allergener: [], tillganglig: true },

  // Planka
  { id: 'plankstek-flask', namn: 'Plankstek fläsk', pris: 149, kategori: 'planka', allergener: [], tillganglig: true },
  { id: 'plankstek-biff', namn: 'Plankstek biff', pris: 219, kategori: 'planka', allergener: [], tillganglig: true },
  { id: 'plankstek-lax', namn: 'Plankstek lax', pris: 189, beskrivning: 'Serveras med sparris, grillad citron & hollandaisesås', kategori: 'planka', allergener: [], tillganglig: true },

  // Burgare
  { id: 'husets-original', namn: 'Husets original', pris: 149, beskrivning: 'Bacon, ost & dressing', kategori: 'burgare', allergener: [], tillganglig: true, popular: true },
  { id: 'pepper-jack', namn: 'Pepper Jack', pris: 149, beskrivning: 'Bacon, ost, jalapeño & BBQ', kategori: 'burgare', allergener: [], tillganglig: true },
  { id: 'crispy-chicken', namn: 'Crispy chicken', pris: 149, beskrivning: 'Friterad kyckling, ost & vitlökssås', kategori: 'burgare', allergener: [], tillganglig: true },
  { id: 'halloumiburgare', namn: 'Halloumiburgare', pris: 149, beskrivning: 'Friterad halloumi, ruccola & vitlökssås', kategori: 'burgare', allergener: [], tillganglig: true },

  // Sallader
  { id: 'sallad-ost-skinka', namn: '1. Ost & skinka', pris: 129, beskrivning: 'Ost, skinka & kokt ägg', kategori: 'sallader', allergener: [], tillganglig: true },
  { id: 'sallad-tonfisk', namn: '2. Tonfisk', pris: 129, beskrivning: 'Tonfisk, majs & kokt ägg', kategori: 'sallader', allergener: [], tillganglig: true },
  { id: 'sallad-grekisk', namn: '3. Grekisk', pris: 129, beskrivning: 'Fetaost, oliver & olivolja', kategori: 'sallader', allergener: [], tillganglig: true },
  { id: 'sallad-rak-avokado', namn: '4. Räk & avokado', pris: 149, beskrivning: 'Räkor, avokado & kokt ägg', kategori: 'sallader', allergener: [], tillganglig: true },
  { id: 'sallad-caesar', namn: '5. Caesar', pris: 149, beskrivning: 'Romansallad, krutonger, kyckling & parmesan', kategori: 'sallader', allergener: [], tillganglig: true },

  // Kebabrätter – tallrikar 129, välj ris eller pommes
  { id: 'kebabtallrik', namn: 'Kebabtallrik', pris: 129, kategori: 'kebab', tillval: TILLBEHOR2, allergener: [], tillganglig: true, popular: true },
  { id: 'gyrostallrik', namn: 'Gyrostallrik', pris: 129, kategori: 'kebab', tillval: TILLBEHOR2, allergener: [], tillganglig: true },
  { id: 'kycklingtallrik', namn: 'Kycklingtallrik', pris: 129, kategori: 'kebab', tillval: TILLBEHOR2, allergener: [], tillganglig: true },
  { id: 'falafeltallrik', namn: 'Falafeltallrik', pris: 129, kategori: 'kebab', tillval: TILLBEHOR2, allergener: [], tillganglig: true },
  { id: 'halloumitallrik', namn: 'Halloumitallrik', pris: 129, kategori: 'kebab', tillval: TILLBEHOR2, allergener: [], tillganglig: true },

  // Kebabrätter – rullar 119, sallad, tomat & lök till alla
  { id: 'kebabrulle', namn: 'Kebabrulle', pris: 119, beskrivning: 'Sallad, tomat & lök', kategori: 'kebab', allergener: [], tillganglig: true },
  { id: 'gyrosrulle', namn: 'Gyrosrulle', pris: 119, beskrivning: 'Sallad, tomat & lök', kategori: 'kebab', allergener: [], tillganglig: true },
  { id: 'kycklingrulle', namn: 'Kycklingrulle', pris: 119, beskrivning: 'Sallad, tomat & lök', kategori: 'kebab', allergener: [], tillganglig: true },
  { id: 'falafelrulle', namn: 'Falafelrulle', pris: 119, beskrivning: 'Sallad, tomat & lök', kategori: 'kebab', allergener: [], tillganglig: true },
  { id: 'halloumirulle', namn: 'Halloumirulle', pris: 119, beskrivning: 'Sallad, tomat & lök', kategori: 'kebab', allergener: [], tillganglig: true },

  // Dryck
  { id: 'pepsi', namn: 'Pepsi', pris: 30, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'pepsi-max', namn: 'Pepsi Max', pris: 30, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'zingo', namn: 'Zingo', pris: 30, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: '7up-zero', namn: '7Up Zero', pris: 30, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'apelsinjuice', namn: 'Apelsinjuice', pris: 30, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'ramlosa', namn: 'Ramlösa', pris: 20, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'ramlosa-citrus', namn: 'Ramlösa Citrus', pris: 20, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'festis-apelsin', namn: 'Festis apelsin', pris: 15, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'festis-paron', namn: 'Festis päron', pris: 15, kategori: 'dryck', allergener: [], tillganglig: true },
  { id: 'festis-hallon', namn: 'Festis hallon', pris: 15, kategori: 'dryck', allergener: [], tillganglig: true },

  // TODO: Öl, vin och drinkar saknas i underlaget. Lägg dem här med
  // kategori 'ol-drinkar' så dyker kategorin upp av sig själv.
];

export const rattMedId = (id: string): MenyRatt | undefined => meny.find((r) => r.id === id);

/** Kategorier som faktiskt har tillgängliga rätter – tomma renderas aldrig */
export const synligaKategorier = (): Kategori[] =>
  kategorier.filter((k) => meny.some((r) => r.kategori === k.id && r.tillganglig));
