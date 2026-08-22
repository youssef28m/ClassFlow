-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- CreateTable
CREATE TABLE "centers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- Add center_id to existing tables, backfill existing rows to a default
-- center, then tighten constraints. The column is added nullable first so
-- the migration never fails on pre-existing rows, and only made NOT NULL
-- after every row has been assigned a center.
DO $$
DECLARE
  default_center_id INTEGER;
BEGIN
  INSERT INTO "centers" ("name", "address", "phone", "active", "created_at", "updated_at")
  VALUES ('Default Center', 'N/A', '', true, NOW(), NOW())
  RETURNING "id" INTO default_center_id;

  ALTER TABLE "expenses" ADD COLUMN "center_id" INTEGER;
  ALTER TABLE "groups"   ADD COLUMN "center_id" INTEGER;
  ALTER TABLE "students" ADD COLUMN "center_id" INTEGER;
  ALTER TABLE "teachers" ADD COLUMN "center_id" INTEGER;
  ALTER TABLE "users"    ADD COLUMN "center_id" INTEGER;

  UPDATE "expenses" SET "center_id" = default_center_id WHERE "center_id" IS NULL;
  UPDATE "groups"   SET "center_id" = default_center_id WHERE "center_id" IS NULL;
  UPDATE "students" SET "center_id" = default_center_id WHERE "center_id" IS NULL;
  UPDATE "teachers" SET "center_id" = default_center_id WHERE "center_id" IS NULL;
  UPDATE "users"    SET "center_id" = default_center_id WHERE "center_id" IS NULL;

  -- users.center_id stays nullable (SUPERADMIN users have no center).
  ALTER TABLE "expenses" ALTER COLUMN "center_id" SET NOT NULL;
  ALTER TABLE "groups"   ALTER COLUMN "center_id" SET NOT NULL;
  ALTER TABLE "students" ALTER COLUMN "center_id" SET NOT NULL;
  ALTER TABLE "teachers" ALTER COLUMN "center_id" SET NOT NULL;
END $$;

-- DropIndex: username is now only unique within a center.
DROP INDEX "users_username_key";

-- CreateIndex
CREATE INDEX "expenses_center_id_idx" ON "expenses"("center_id");

-- CreateIndex
CREATE INDEX "groups_center_id_idx" ON "groups"("center_id");

-- CreateIndex
CREATE INDEX "students_center_id_idx" ON "students"("center_id");

-- CreateIndex
CREATE INDEX "teachers_center_id_idx" ON "teachers"("center_id");

-- CreateIndex
CREATE INDEX "users_center_id_idx" ON "users"("center_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_center_id_username_key" ON "users"("center_id", "username");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
