-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "salary_id" INTEGER;

-- CreateIndex
CREATE INDEX "expenses_salary_id_idx" ON "expenses"("salary_id");
