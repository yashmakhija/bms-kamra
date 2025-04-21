/*
  Warnings:

  - You are about to drop the column `razorpayOrderId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `razorpaySignature` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "razorpayOrderId",
DROP COLUMN "razorpaySignature";
