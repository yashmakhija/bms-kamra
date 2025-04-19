-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'RAZORPAY';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;
