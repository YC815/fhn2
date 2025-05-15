-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_newsId_fkey";

-- DropForeignKey
ALTER TABLE "Reference" DROP CONSTRAINT "Reference_newsId_fkey";

-- DropForeignKey
ALTER TABLE "_NewsToTag" DROP CONSTRAINT "_NewsToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_NewsToTag" DROP CONSTRAINT "_NewsToTag_B_fkey";

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT false;
