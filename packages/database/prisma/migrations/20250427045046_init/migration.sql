-- AlterTable
ALTER TABLE "_BookingToTicket" ADD CONSTRAINT "_BookingToTicket_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BookingToTicket_AB_unique";
