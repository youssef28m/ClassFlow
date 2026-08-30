-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "billing_anchor_day" INTEGER NOT NULL DEFAULT 1;

-- Backfill existing groups with the day-of-month of their earliest active
-- enrollment (clamped to 28), preserving how their due dates were previously
-- derived. Groups with no active enrollment keep the default of 1.
UPDATE "groups" g
SET "billing_anchor_day" = LEAST(EXTRACT(DAY FROM e."enrollment_date")::int, 28)
FROM (
  SELECT DISTINCT ON ("group_id") "group_id", "enrollment_date"
  FROM "enrollments"
  WHERE "active" = true
  ORDER BY "group_id", "enrollment_date" ASC
) e
WHERE g.id = e."group_id";
