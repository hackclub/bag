/*
  Warnings:

  - The `specificRecipes` column on the `App` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `specificRecipes` column on the `Identity` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "App" DROP COLUMN "specificRecipes",
ADD COLUMN     "specificRecipes" INTEGER[];

-- AlterTable
ALTER TABLE "Identity" DROP COLUMN "specificRecipes",
ADD COLUMN     "specificRecipes" INTEGER[];
