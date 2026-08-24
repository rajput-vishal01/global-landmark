ALTER TABLE "crm_activities" ADD COLUMN "follow_up_at" timestamp;--> statement-breakpoint
CREATE INDEX "crm_activities_followup_idx" ON "crm_activities" USING btree ("follow_up_at");