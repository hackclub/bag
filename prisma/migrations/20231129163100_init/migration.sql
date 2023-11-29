-- CreateEnum
CREATE TYPE "PermissionLevels" AS ENUM ('ADMIN', 'READ');

-- CreateTable
CREATE TABLE "Identity" (
    "slack" TEXT NOT NULL,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("slack")
);

-- CreateTable
CREATE TABLE "Item" (
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT,
    "reaction" TEXT,
    "commodity" BOOLEAN NOT NULL DEFAULT false,
    "tradable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Instance" (
    "id" SERIAL NOT NULL,
    "itemId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "initiatorIdentityId" TEXT NOT NULL,
    "receiverIdentityId" TEXT NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" TEXT NOT NULL,
    "permissions" "PermissionLevels"[],

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_initiatorTrades" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_receiverTrades" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Identity_slack_key" ON "Identity"("slack");

-- CreateIndex
CREATE UNIQUE INDEX "Item_name_key" ON "Item"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_id_key" ON "Permissions"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_initiatorTrades_AB_unique" ON "_initiatorTrades"("A", "B");

-- CreateIndex
CREATE INDEX "_initiatorTrades_B_index" ON "_initiatorTrades"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_receiverTrades_AB_unique" ON "_receiverTrades"("A", "B");

-- CreateIndex
CREATE INDEX "_receiverTrades_B_index" ON "_receiverTrades"("B");

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_initiatorIdentityId_fkey" FOREIGN KEY ("initiatorIdentityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_receiverIdentityId_fkey" FOREIGN KEY ("receiverIdentityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_initiatorTrades" ADD CONSTRAINT "_initiatorTrades_A_fkey" FOREIGN KEY ("A") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_initiatorTrades" ADD CONSTRAINT "_initiatorTrades_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_receiverTrades" ADD CONSTRAINT "_receiverTrades_A_fkey" FOREIGN KEY ("A") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_receiverTrades" ADD CONSTRAINT "_receiverTrades_B_fkey" FOREIGN KEY ("B") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
