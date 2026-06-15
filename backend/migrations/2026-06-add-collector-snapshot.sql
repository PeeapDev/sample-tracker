-- Immutable collector snapshot on samples.
-- Production runs with TypeORM synchronize=false, so these columns must be added
-- explicitly. Idempotent — safe to run more than once. Run in the Supabase SQL
-- editor (or psql) before/with the deploy.

ALTER TABLE samples ADD COLUMN IF NOT EXISTS "collectorName"  varchar;
ALTER TABLE samples ADD COLUMN IF NOT EXISTS "collectorRole"  varchar;
ALTER TABLE samples ADD COLUMN IF NOT EXISTS "collectorPhone" varchar;

-- Backfill existing samples from the current collector account (best-effort —
-- new samples snapshot at creation and never change afterwards).
UPDATE samples s
SET
  "collectorName"  = COALESCE(s."collectorName", NULLIF(TRIM(CONCAT(u."firstName", ' ', u."lastName")), '')),
  "collectorRole"  = COALESCE(s."collectorRole", u."role"::text),
  "collectorPhone" = COALESCE(s."collectorPhone", u."phone")
FROM users u
WHERE s."collectedById" = u."id"
  AND (s."collectorName" IS NULL OR s."collectorRole" IS NULL OR s."collectorPhone" IS NULL);
