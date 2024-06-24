/*
  Warnings:

  - You are about to drop the column `offerToGiveId` on the `Instance` table. All the data in the column will be lost.
  - You are about to drop the column `offerToReceiveId` on the `Instance` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Instance" DROP CONSTRAINT "Instance_offerToGiveId_fkey";

-- DropForeignKey
ALTER TABLE "Instance" DROP CONSTRAINT "Instance_offerToReceiveId_fkey";

-- AlterTable
ALTER TABLE "Instance" DROP COLUMN "offerToGiveId",
DROP COLUMN "offerToReceiveId";

-- CreateTable
CREATE TABLE "InstanceOfferToGive" (
    "instanceId" INTEGER NOT NULL,
    "offerId" INTEGER NOT NULL,

    CONSTRAINT "InstanceOfferToGive_pkey" PRIMARY KEY ("instanceId","offerId")
);

-- CreateTable
CREATE TABLE "InstanceOfferToReceive" (
    "instanceId" INTEGER NOT NULL,
    "offerId" INTEGER NOT NULL,

    CONSTRAINT "InstanceOfferToReceive_pkey" PRIMARY KEY ("instanceId","offerId")
);

-- AddForeignKey
ALTER TABLE "InstanceOfferToGive" ADD CONSTRAINT "InstanceOfferToGive_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstanceOfferToGive" ADD CONSTRAINT "InstanceOfferToGive_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstanceOfferToReceive" ADD CONSTRAINT "InstanceOfferToReceive_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstanceOfferToReceive" ADD CONSTRAINT "InstanceOfferToReceive_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
