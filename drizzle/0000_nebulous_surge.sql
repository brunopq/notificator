CREATE TYPE "public"."lawsuit_status" AS ENUM('NÃO INICIADO', 'ATIVO', 'ENCERRADO');--> statement-breakpoint
CREATE TYPE "public"."movimentation_types" AS ENUM('AUDIENCIA', 'PERICIA');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"judice_id" integer NOT NULL,
	"name" text NOT NULL,
	"cpf" text,
	"phones" text[] NOT NULL,
	CONSTRAINT "clients_judiceId_unique" UNIQUE("judice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lawsuit" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"judice_id" integer NOT NULL,
	"cnj" text NOT NULL,
	"client_id" char(12) NOT NULL,
	CONSTRAINT "lawsuit_judiceId_unique" UNIQUE("judice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimentations" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"judice_id" integer NOT NULL,
	"publication_id" char(12) NOT NULL,
	"type" "movimentation_types" NOT NULL,
	"expedition_date" timestamp with time zone NOT NULL,
	"final_date" timestamp with time zone,
	CONSTRAINT "movimentations_judiceId_unique" UNIQUE("judice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"movimentation_id" char(12),
	"client_id" char(12),
	"message" text NOT NULL,
	"sent" boolean NOT NULL,
	"recieved" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publications" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"judice_id" integer NOT NULL,
	"lawsuit_id" char(12) NOT NULL,
	"movimentation_id" char(12),
	"expedition_date" timestamp with time zone NOT NULL,
	"has_been_treated" boolean DEFAULT false,
	CONSTRAINT "publications_judiceId_unique" UNIQUE("judice_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lawsuit" ADD CONSTRAINT "lawsuit_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimentations" ADD CONSTRAINT "movimentations_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_movimentation_id_movimentations_id_fk" FOREIGN KEY ("movimentation_id") REFERENCES "public"."movimentations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "publications" ADD CONSTRAINT "publications_lawsuit_id_lawsuit_id_fk" FOREIGN KEY ("lawsuit_id") REFERENCES "public"."lawsuit"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
