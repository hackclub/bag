/*
  Warnings:

  - Changed the type of `B` on the `_recipeInputs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_recipeInputs" DROP CONSTRAINT "_recipeInputs_B_fkey";

-- AlterTable
ALTER TABLE "_recipeInputs" DROP COLUMN "B",
ADD COLUMN     "B" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "_recipeSkills" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_recipeSkills_AB_unique" ON "_recipeSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_recipeSkills_B_index" ON "_recipeSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_recipeInputs_AB_unique" ON "_recipeInputs"("A", "B");

-- CreateIndex
CREATE INDEX "_recipeInputs_B_index" ON "_recipeInputs"("B");

-- AddForeignKey
ALTER TABLE "_recipeInputs" ADD CONSTRAINT "_recipeInputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeSkills" ADD CONSTRAINT "_recipeSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeSkills" ADD CONSTRAINT "_recipeSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("name") ON DELETE CASCADE ON UPDATE CASCADE;
