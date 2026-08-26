/*
  Warnings:

  - Added the required column `payment_sum` to the `teacher_salaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `percentage` to the `teacher_salaries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "teacher_salaries" ADD COLUMN     "payment_sum" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "percentage" DECIMAL(5,2) NOT NULL;
