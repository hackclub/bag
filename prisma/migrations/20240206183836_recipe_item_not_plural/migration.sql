/*
  Warnings:

  - You are about to drop the `RecipeItems` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RecipeItems" DROP CONSTRAINT "RecipeItems_recipeItemId_fkey";

-- DropForeignKey
ALTER TABLE "_craftingInputs" DROP CONSTRAINT "_craftingInputs_B_fkey";

-- DropForeignKey
ALTER TABLE "_craftingTools" DROP CONSTRAINT "_craftingTools_B_fkey";

-- DropForeignKey
ALTER TABLE "_recipeInputs" DROP CONSTRAINT "_recipeInputs_B_fkey";

-- DropForeignKey
ALTER TABLE "_recipeOutputs" DROP CONSTRAINT "_recipeOutputs_B_fkey";

-- DropForeignKey
ALTER TABLE "_recipeTools" DROP CONSTRAINT "_recipeTools_B_fkey";

-- DropTable
ALTER TABLE "RecipeItems" RENAME TO "RecipeItem";