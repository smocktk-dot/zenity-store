DO $$ BEGIN
    CREATE TYPE "public"."app_download_type" AS ENUM('download', 'tutorial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."app_downloads" (
    "id" serial PRIMARY KEY,
    "appId" integer NOT NULL,
    "type" "public"."app_download_type" NOT NULL,
    "title" varchar(128) NOT NULL,
    "url" text NOT NULL,
    "videoUrl" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public"."app_downloads" ADD CONSTRAINT "app_downloads_appId_apps_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;
