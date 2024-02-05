-- CreateTable
CREATE TABLE "Crafting" (
    "id" SERIAL NOT NULL,
    "identityId" TEXT NOT NULL,
    "recipeId" INTEGER,

    CONSTRAINT "Crafting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_craftingInputs" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_craftingTools" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_craftingInputs_AB_unique" ON "_craftingInputs"("A", "B");

-- CreateIndex
CREATE INDEX "_craftingInputs_B_index" ON "_craftingInputs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_craftingTools_AB_unique" ON "_craftingTools"("A", "B");

-- CreateIndex
CREATE INDEX "_craftingTools_B_index" ON "_craftingTools"("B");

-- AddForeignKey
ALTER TABLE "Crafting" ADD CONSTRAINT "Crafting_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Crafting" ADD CONSTRAINT "Crafting_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_craftingInputs" ADD CONSTRAINT "_craftingInputs_A_fkey" FOREIGN KEY ("A") REFERENCES "Crafting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_craftingInputs" ADD CONSTRAINT "_craftingInputs_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_craftingTools" ADD CONSTRAINT "_craftingTools_A_fkey" FOREIGN KEY ("A") REFERENCES "Crafting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_craftingTools" ADD CONSTRAINT "_craftingTools_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
