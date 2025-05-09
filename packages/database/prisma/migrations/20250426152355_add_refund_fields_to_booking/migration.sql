-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "metadata" JSONB DEFAULT '{}',
ADD COLUMN     "refundDate" TIMESTAMP(3),
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedBy" TEXT;
