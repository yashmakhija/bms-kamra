/*
  Warnings:

  - The primary key for the `_BookingToTicket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_BookingToTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_BookingToTicket" DROP CONSTRAINT "_BookingToTicket_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_BookingToTicket_AB_unique" ON "_BookingToTicket"("A", "B");

-- CreateIndex
CREATE INDEX "tickets_sectionId_idx" ON "tickets"("sectionId");
