-- AlterTable
ALTER TABLE "RecipeItem" RENAME CONSTRAINT "RecipeItems_pkey" TO "RecipeItem_pkey";

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeItemId_fkey" FOREIGN KEY ("recipeItemId") REFERENCES "Item"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_craftingInputs" ADD CONSTRAINT "_craftingInputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_craftingTools" ADD CONSTRAINT "_craftingTools_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeInputs" ADD CONSTRAINT "_recipeInputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeOutputs" ADD CONSTRAINT "_recipeOutputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeTools" ADD CONSTRAINT "_recipeTools_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
