-- DropForeignKey
ALTER TABLE "_initiatorTrades" DROP CONSTRAINT "_initiatorTrades_A_fkey";

-- DropForeignKey
ALTER TABLE "_initiatorTrades" DROP CONSTRAINT "_initiatorTrades_B_fkey";

-- DropForeignKey
ALTER TABLE "_receiverTrades" DROP CONSTRAINT "_receiverTrades_A_fkey";

-- DropForeignKey
ALTER TABLE "_receiverTrades" DROP CONSTRAINT "_receiverTrades_B_fkey";

-- CreateTable
CREATE TABLE "TradeInstance" (
    "id" SERIAL NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TradeInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TradeInstance" ADD CONSTRAINT "TradeInstance_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_initiatorTrades" ADD CONSTRAINT "_initiatorTrades_A_fkey" FOREIGN KEY ("A") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_initiatorTrades" ADD CONSTRAINT "_initiatorTrades_B_fkey" FOREIGN KEY ("B") REFERENCES "TradeInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_receiverTrades" ADD CONSTRAINT "_receiverTrades_A_fkey" FOREIGN KEY ("A") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_receiverTrades" ADD CONSTRAINT "_receiverTrades_B_fkey" FOREIGN KEY ("B") REFERENCES "TradeInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
