ALTER TABLE "movimentations" DROP CONSTRAINT "movimentations_publication_id_publications_id_fk";
--> statement-breakpoint
ALTER TABLE "movimentations" ADD COLUMN "lawsuit_id" char(12) NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "movimentations" ADD CONSTRAINT "movimentations_lawsuit_id_lawsuit_id_fk" FOREIGN KEY ("lawsuit_id") REFERENCES "public"."lawsuit"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "movimentations" DROP COLUMN IF EXISTS "publication_id";