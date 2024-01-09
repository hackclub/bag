-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "initiatorAgreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiverAgreed" BOOLEAN NOT NULL DEFAULT false;
