-- Scheduled brand dashboard insights (Claude output, refreshed by cron)
CREATE TABLE "brand_insights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brand_id" VARCHAR(36) NOT NULL,
    "insights" JSONB NOT NULL,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brand_insights_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "brand_insights"
    ADD CONSTRAINT "brand_insights_brand_id_fkey"
    FOREIGN KEY ("brand_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "idx_brand_insights_brand_id" ON "brand_insights"("brand_id");
CREATE INDEX "idx_brand_insights_expires_at" ON "brand_insights"("expires_at");
CREATE INDEX "idx_brand_insights_brand_generated" ON "brand_insights"("brand_id", "generated_at" DESC);
