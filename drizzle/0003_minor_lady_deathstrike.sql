ALTER TABLE "lawsuit" RENAME TO "lawsuits";--> statement-breakpoint
ALTER TABLE "lawsuits" DROP CONSTRAINT "lawsuit_judiceId_unique";--> statement-breakpoint
ALTER TABLE "lawsuits" DROP CONSTRAINT "lawsuit_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "movimentations" DROP CONSTRAINT "movimentations_lawsuit_id_lawsuit_id_fk";
--> statement-breakpoint
ALTER TABLE "publications" DROP CONSTRAINT "publications_lawsuit_id_lawsuit_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimentations" ADD CONSTRAINT "movimentations_lawsuit_id_lawsuits_id_fk" FOREIGN KEY ("lawsuit_id") REFERENCES "public"."lawsuits"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "publications" ADD CONSTRAINT "publications_lawsuit_id_lawsuits_id_fk" FOREIGN KEY ("lawsuit_id") REFERENCES "public"."lawsuits"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "lawsuits" ADD CONSTRAINT "lawsuits_judiceId_unique" UNIQUE("judice_id");