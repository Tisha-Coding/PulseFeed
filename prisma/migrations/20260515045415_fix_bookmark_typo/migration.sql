/*
  Warnings:

  - You are about to drop the column `isBookedmarked` on the `Engagement` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_content_description_gin";

-- DropIndex
DROP INDEX "idx_content_title_gin";

-- AlterTable
ALTER TABLE "Engagement" DROP COLUMN "isBookedmarked",
ADD COLUMN     "isBookmarked" BOOLEAN NOT NULL DEFAULT false;
