import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Orderns väg genom köket. "vantar_betalning" är läget mellan att gästen
 * tryckt betala och att Stripe bekräftat: en sådan order syns aldrig på
 * köksskärmen. Först webhooken flyttar den till "ny".
 */
export const orderStatus = pgEnum("order_status", [
  "vantar_betalning",
  "ny",
  "tillagas",
  "klar",
  "levererad",
  "avbruten",
]);

export const orderTyp = pgEnum("order_typ", ["avhamtning", "bord"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ordernummer: text("ordernummer").notNull().unique(),
    status: orderStatus("status").notNull().default("vantar_betalning"),

    kundNamn: text("kund_namn").notNull(),
    kundTelefon: text("kund_telefon"),
    kundEpost: text("kund_epost"),

    typ: orderTyp("typ").notNull().default("avhamtning"),
    bordsnummer: integer("bordsnummer"),
    notering: text("notering"),

    /**
     * Raderna fryses vid köpet. Ändras ett pris i menu-data.ts i morgon ska
     * gårdagens kvitto fortfarande visa vad gästen faktiskt betalade.
     */
    rader: jsonb("rader").$type<OrderRad[]>().notNull(),
    summaOren: integer("summa_oren").notNull(),

    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    betaldMed: text("betald_med"),

    kvittoEpostSkickat: timestamp("kvitto_epost_skickat", { withTimezone: true }),
    kvittoSmsSkickat: timestamp("kvitto_sms_skickat", { withTimezone: true }),

    skapad: timestamp("skapad", { withTimezone: true }).notNull().defaultNow(),
    betald: timestamp("betald", { withTimezone: true }),
    uppdaterad: timestamp("uppdaterad", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_skapad_idx").on(t.skapad),
  ],
);

/**
 * Det personalen ändrar under dagen utan att koden behöver ändras: rätter
 * som tagit slut och om onlinebeställningen är pausad. En rad per sak
 * ("pausad", "slut:pizza-capri"), så att två i köket som klickar samtidigt
 * aldrig skriver över varandra.
 */
export const installningar = pgTable("installningar", {
  nyckel: text("nyckel").primaryKey(),
  /** När det sattes. Gäller bara till nästa morgon, se butik.ts. */
  satt: timestamp("satt", { withTimezone: true }).notNull().defaultNow(),
});

export interface OrderRad {
  rattId: string;
  namn: string;
  antal: number;
  /** Styckpris i ören, som det stod när ordern lades - inkluderar en vald side. */
  styckprisOren: number;
  notering: string;
  protein?: string;
  /** Namnet på en vald side, t.ex. till en smash-burgare. Priset ingår redan i styckprisOren. */
  sideNamn?: string;
  /** Ris eller pommes, t.ex. till Tallrik. Ingen prisskillnad. */
  tillbehor?: string;
  /** Fria tillval, t.ex. glutenfri botten eller veganost. Priset ingår redan i styckprisOren. */
  tillvalNamn?: string[];
}

export type Order = typeof orders.$inferSelect;
export type NyOrder = typeof orders.$inferInsert;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
