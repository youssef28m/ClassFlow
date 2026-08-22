-- Make students.phone optional (young students may not have a phone number).
ALTER TABLE "students" ALTER COLUMN "phone" DROP NOT NULL;

-- Remove pre-existing duplicates (same center, name and phone -- NULLs treated
-- as equal), keeping the oldest row (lowest id). Enrollments of the removed
-- rows are cascade-deleted.
DELETE FROM "students" a
USING "students" b
WHERE a.id > b.id
  AND a.center_id = b.center_id
  AND a.full_name = b.full_name
  AND a.phone IS NOT DISTINCT FROM b.phone;

-- Enforce uniqueness at the database level for students that have a phone.
-- Postgres unique indexes treat NULLs as distinct, so same-name students with
-- no phone are instead rejected by the application layer.
CREATE UNIQUE INDEX "students_center_id_full_name_phone_key"
ON "students"("center_id", "full_name", "phone");
