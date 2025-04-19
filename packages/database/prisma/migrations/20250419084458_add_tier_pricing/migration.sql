/*
  Warnings:

  - The values [MANAGER,CONTENT_EDITOR] on the enum `AdminRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `categoryId` on the `seat_sections` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `seat_sections` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `seat_sections` table. All the data in the column will be lost.
  - You are about to drop the column `totalSeats` on the `seat_sections` table. All the data in the column will be lost.
  - You are about to drop the `_CategoryToShow` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `priceTierId` to the `seat_sections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AdminRole_new" AS ENUM ('SUPER_ADMIN', 'EDITOR');
ALTER TABLE "admins" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "admins" ALTER COLUMN "role" TYPE "AdminRole_new" USING ("role"::text::"AdminRole_new");
ALTER TYPE "AdminRole" RENAME TO "AdminRole_old";
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";
DROP TYPE "AdminRole_old";
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'EDITOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "_CategoryToShow" DROP CONSTRAINT "_CategoryToShow_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToShow" DROP CONSTRAINT "_CategoryToShow_B_fkey";

-- DropForeignKey
ALTER TABLE "seat_sections" DROP CONSTRAINT "seat_sections_categoryId_fkey";

-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'EDITOR';

-- AlterTable
ALTER TABLE "seat_sections" DROP COLUMN "categoryId",
DROP COLUMN "currency",
DROP COLUMN "price",
DROP COLUMN "totalSeats",
ADD COLUMN     "priceTierId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_CategoryToShow";

-- CreateTable
CREATE TABLE "price_tiers" (
    "id" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "showId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_tiers_showId_categoryId_key" ON "price_tiers"("showId", "categoryId");

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_showId_fkey" FOREIGN KEY ("showId") REFERENCES "shows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seat_sections" ADD CONSTRAINT "seat_sections_priceTierId_fkey" FOREIGN KEY ("priceTierId") REFERENCES "price_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
