/*
  Warnings:

  - You are about to drop the column `identitySlack` on the `Use` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Use" DROP CONSTRAINT "Use_identitySlack_fkey";

-- AlterTable
ALTER TABLE "Use" DROP COLUMN "identitySlack";
