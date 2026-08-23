-- Teacher pay is no longer a fixed monthly amount; it will be computed
-- from salary records later. Drop the denormalized column.
ALTER TABLE "teachers" DROP COLUMN "salary";
