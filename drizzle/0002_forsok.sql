CREATE TABLE "forsok" (
	"id" serial PRIMARY KEY NOT NULL,
	"nyckel" text NOT NULL,
	"tid" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "forsok_nyckel_tid_idx" ON "forsok" USING btree ("nyckel","tid");