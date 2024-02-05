-- CreateTable
CREATE TABLE "_recipeTools" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_recipeTools_AB_unique" ON "_recipeTools"("A", "B");

-- CreateIndex
CREATE INDEX "_recipeTools_B_index" ON "_recipeTools"("B");

-- AddForeignKey
ALTER TABLE "_recipeTools" ADD CONSTRAINT "_recipeTools_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeTools" ADD CONSTRAINT "_recipeTools_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
