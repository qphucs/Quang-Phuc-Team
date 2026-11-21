CREATE TYPE "public"."download_kind" AS ENUM('video', 'audio', 'image');--> statement-breakpoint
CREATE TYPE "public"."download_status" AS ENUM('ok', 'failed');--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"kind" "download_kind" NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"author" text DEFAULT '' NOT NULL,
	"status" "download_status" NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "downloads_user_created_idx" ON "downloads" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "downloads_created_idx" ON "downloads" USING btree ("created_at");