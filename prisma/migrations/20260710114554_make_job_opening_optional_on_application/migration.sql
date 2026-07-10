-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobOpeningId_fkey";

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "jobOpeningId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening"("id") ON DELETE SET NULL ON UPDATE CASCADE;
