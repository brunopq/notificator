ALTER TYPE "public"."notification_status" ADD VALUE 'WILL_RETRY' BEFORE 'SCHEDULED';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "executions" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_snapshots" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"execution_id" char(12),
	"notification_id" char(12),
	"status" "notification_status" NOT NULL,
	"error" "notification_errors"
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_snapshots" ADD CONSTRAINT "notification_snapshots_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_snapshots" ADD CONSTRAINT "notification_snapshots_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
