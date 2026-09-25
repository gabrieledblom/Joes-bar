CREATE TABLE "installningar" (
	"nyckel" text PRIMARY KEY NOT NULL,
	"satt" timestamp with time zone DEFAULT now() NOT NULL
);
