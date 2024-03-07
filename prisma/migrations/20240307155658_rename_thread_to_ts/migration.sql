/*
  Warnings:

  - You are about to drop the column `thread` on the `Crafting` table. All the data in the column will be lost.
  - You are about to drop the column `thread` on the `Trade` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Crafting" DROP COLUMN "thread",
ADD COLUMN     "ts" TEXT;

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "thread",
ADD COLUMN     "ts" TEXT;
