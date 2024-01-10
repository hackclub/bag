/*
  Warnings:

  - The `specificTrades` column on the `App` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `specificTrades` column on the `Identity` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "App" DROP COLUMN "specificTrades",
ADD COLUMN     "specificTrades" INTEGER[];

-- AlterTable
ALTER TABLE "Identity" DROP COLUMN "specificTrades",
ADD COLUMN     "specificTrades" INTEGER[];
