CREATE TYPE "public"."order_status" AS ENUM('vantar_betalning', 'ny', 'tillagas', 'klar', 'levererad', 'avbruten');--> statement-breakpoint
CREATE TYPE "public"."order_typ" AS ENUM('avhamtning', 'bord');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ordernummer" text NOT NULL,
	"status" "order_status" DEFAULT 'vantar_betalning' NOT NULL,
	"kund_namn" text NOT NULL,
	"kund_telefon" text,
	"kund_epost" text,
	"typ" "order_typ" DEFAULT 'avhamtning' NOT NULL,
	"bordsnummer" integer,
	"notering" text,
	"rader" jsonb NOT NULL,
	"summa_oren" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"betald_med" text,
	"kvitto_epost_skickat" timestamp with time zone,
	"kvitto_sms_skickat" timestamp with time zone,
	"skapad" timestamp with time zone DEFAULT now() NOT NULL,
	"betald" timestamp with time zone,
	"uppdaterad" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_ordernummer_unique" UNIQUE("ordernummer"),
	CONSTRAINT "orders_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_skapad_idx" ON "orders" USING btree ("skapad");