CREATE TYPE "public"."notification_errors" AS ENUM('NO_PHONE_NUMBER', 'INVALID_PHONE', 'PHONE_NOT_ON_WHATSAPP', 'UNKNOWN_ERROR');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('NOT_SENT', 'SENT', 'SCHEDULED', 'ERROR');--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "status" "notification_status" DEFAULT 'NOT_SENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "error" "notification_errors";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "is_scheduled";