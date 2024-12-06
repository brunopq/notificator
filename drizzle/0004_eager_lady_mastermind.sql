ALTER TABLE "notifications" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "sent";