/*
  Warnings:

  - Changed the type of `A` on the `_recipeInputs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_recipeInputs" DROP CONSTRAINT "_recipeInputs_A_fkey";

-- DropForeignKey
ALTER TABLE "_recipeInputs" DROP CONSTRAINT "_recipeInputs_B_fkey";

-- AlterTable
ALTER TABLE "_recipeInputs" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
ALTER COLUMN "B" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "Skill" (
    "name" TEXT NOT NULL,
    "maxLevel" INTEGER,
    "description" TEXT,
    "reaction" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "SkillInstance" (
    "id" SERIAL NOT NULL,
    "skillId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "SkillInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_recipeInputs_AB_unique" ON "_recipeInputs"("A", "B");

-- AddForeignKey
ALTER TABLE "SkillInstance" ADD CONSTRAINT "SkillInstance_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillInstance" ADD CONSTRAINT "SkillInstance_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeInputs" ADD CONSTRAINT "_recipeInputs_A_fkey" FOREIGN KEY ("A") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_recipeInputs" ADD CONSTRAINT "_recipeInputs_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("name") ON DELETE CASCADE ON UPDATE CASCADE;
