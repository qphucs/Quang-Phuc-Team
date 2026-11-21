CREATE TYPE "public"."trend_status" AS ENUM('pending', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trend_type" AS ENUM('capcut_edit', 'sound');--> statement-breakpoint
CREATE TABLE "saved_trends" (
	"user_id" uuid NOT NULL,
	"trend_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_trends_user_id_trend_id_pk" PRIMARY KEY("user_id","trend_id")
);
--> statement-breakpoint
CREATE TABLE "trend_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "trend_type" NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"cover_url" text,
	"author" text DEFAULT '' NOT NULL,
	"sound_name" text,
	"view_count" integer,
	"use_count" integer,
	"heat_score" integer DEFAULT 0 NOT NULL,
	"status" "trend_status" DEFAULT 'pending' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"skill_id" uuid,
	"added_by" uuid,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trend_items_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "trend_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"ok" boolean DEFAULT false NOT NULL,
	"found_count" integer DEFAULT 0 NOT NULL,
	"new_count" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "trend_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trend_id" uuid NOT NULL,
	"view_count" integer,
	"use_count" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_trends" ADD CONSTRAINT "saved_trends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_trends" ADD CONSTRAINT "saved_trends_trend_id_trend_items_id_fk" FOREIGN KEY ("trend_id") REFERENCES "public"."trend_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_items" ADD CONSTRAINT "trend_items_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_items" ADD CONSTRAINT "trend_items_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trend_snapshots" ADD CONSTRAINT "trend_snapshots_trend_id_trend_items_id_fk" FOREIGN KEY ("trend_id") REFERENCES "public"."trend_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trend_items_type_status_idx" ON "trend_items" USING btree ("type","status","first_seen_at");--> statement-breakpoint
CREATE INDEX "trend_snapshots_trend_idx" ON "trend_snapshots" USING btree ("trend_id","captured_at");