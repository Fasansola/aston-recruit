-- DropIndex
DROP INDEX "Application_applicantId_jobOpeningId_key";

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "isDuplicate" BOOLEAN NOT NULL DEFAULT false;
