-- AlterTable
ALTER TABLE "Crafting" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "thread" TEXT;

-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "thread" TEXT;
