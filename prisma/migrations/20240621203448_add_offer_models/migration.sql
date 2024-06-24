-- AlterTable
ALTER TABLE "Instance" ADD COLUMN     "offerToGiveId" INTEGER,
ADD COLUMN     "offerToReceiveId" INTEGER;

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "sourceIdentityId" TEXT NOT NULL,
    "targetIdentityId" TEXT NOT NULL,
    "callbackUrl" TEXT,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_offerToGiveId_fkey" FOREIGN KEY ("offerToGiveId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_offerToReceiveId_fkey" FOREIGN KEY ("offerToReceiveId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
