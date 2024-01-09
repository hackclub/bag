-- AlterTable
ALTER TABLE "Identity" ADD COLUMN     "specificApps" INTEGER[],
ADD COLUMN     "specificItems" TEXT[],
ADD COLUMN     "specificRecipes" TEXT[],
ADD COLUMN     "specificTrades" TEXT[];
