-- CreateTable
CREATE TABLE "Recipe" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_recipeInputs" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_recipeOutputs" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_recipeInputs_AB_unique" ON "_recipeInputs"("A", "B");

-- CreateIndex
CREATE INDEX "_recipeInputs_B_index" ON "_recipeInputs"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_recipeOutputs_AB_unique" ON "_recipeOutputs"("A", "B");

-- CreateIndex
CREATE INDEX "_recipeOutputs_B_index" ON "_recipeOutputs"("B");

-- AddForeignKey
ALTER TABLE "_recipeInputs" ADD CONSTRAINT "_recipeInputs_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeInputs" ADD CONSTRAINT "_recipeInputs_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeOutputs" ADD CONSTRAINT "_recipeOutputs_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeOutputs" ADD CONSTRAINT "_recipeOutputs_B_fkey" FOREIGN KEY ("B") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
