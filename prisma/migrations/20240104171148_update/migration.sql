-- AlterTable
ALTER TABLE "App" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "closed" BOOLEAN NOT NULL DEFAULT false;
