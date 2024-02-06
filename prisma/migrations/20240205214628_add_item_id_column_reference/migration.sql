/*
  Warnings:

  - You are about to drop the `_recipeItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `recipeItemId` to the `RecipeItems` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_recipeItem" DROP CONSTRAINT "_recipeItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_recipeItem" DROP CONSTRAINT "_recipeItem_B_fkey";

-- AlterTable
ALTER TABLE "RecipeItems" ADD COLUMN     "recipeItemId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_recipeItem";

-- AddForeignKey
ALTER TABLE "RecipeItems" ADD CONSTRAINT "RecipeItems_recipeItemId_fkey" FOREIGN KEY ("recipeItemId") REFERENCES "Item"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
