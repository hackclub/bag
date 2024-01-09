/*
  Warnings:

  - You are about to drop the column `specific` on the `App` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "App" DROP COLUMN "specific",
ADD COLUMN     "specificItems" TEXT[],
ADD COLUMN     "specificRecipes" TEXT[],
ADD COLUMN     "specificTrades" TEXT[];
