/*
  Warnings:

  - You are about to drop the `InstanceOfferToGive` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InstanceOfferToReceive` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InstanceOfferToGive" DROP CONSTRAINT "InstanceOfferToGive_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "InstanceOfferToGive" DROP CONSTRAINT "InstanceOfferToGive_offerId_fkey";

-- DropForeignKey
ALTER TABLE "InstanceOfferToReceive" DROP CONSTRAINT "InstanceOfferToReceive_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "InstanceOfferToReceive" DROP CONSTRAINT "InstanceOfferToReceive_offerId_fkey";

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "itemNamesToGive" TEXT[],
ADD COLUMN     "itemNamesToReceive" TEXT[],
ADD COLUMN     "itemQuantitiesToGive" INTEGER[],
ADD COLUMN     "itemQuantitiesToReceive" INTEGER[];

-- DropTable
DROP TABLE "InstanceOfferToGive";

-- DropTable
DROP TABLE "InstanceOfferToReceive";
