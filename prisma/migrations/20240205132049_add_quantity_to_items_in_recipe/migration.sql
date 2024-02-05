/*
  Warnings:

  - Changed the type of `A` on the `_recipeOutputs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `A` on the `_recipeTools` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_recipeOutputs" DROP CONSTRAINT "_recipeOutputs_A_fkey";

-- DropForeignKey
ALTER TABLE "_recipeOutputs" DROP CONSTRAINT "_recipeOutputs_B_fkey";

-- DropForeignKey
ALTER TABLE "_recipeTools" DROP CONSTRAINT "_recipeTools_A_fkey";

-- DropForeignKey
ALTER TABLE "_recipeTools" DROP CONSTRAINT "_recipeTools_B_fkey";

-- AlterTable
ALTER TABLE "_recipeOutputs" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "_recipeTools" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "RecipeItems" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RecipeItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_recipeItem" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_recipeItem_AB_unique" ON "_recipeItem"("A", "B");

-- CreateIndex
CREATE INDEX "_recipeItem_B_index" ON "_recipeItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_recipeOutputs_AB_unique" ON "_recipeOutputs"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_recipeTools_AB_unique" ON "_recipeTools"("A", "B");

-- AddForeignKey
ALTER TABLE "_recipeItem" ADD CONSTRAINT "_recipeItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeItem" ADD CONSTRAINT "_recipeItem_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeOutputs" ADD CONSTRAINT "_recipeOutputs_A_fkey" FOREIGN KEY ("A") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeOutputs" ADD CONSTRAINT "_recipeOutputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeTools" ADD CONSTRAINT "_recipeTools_A_fkey" FOREIGN KEY ("A") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeTools" ADD CONSTRAINT "_recipeTools_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
