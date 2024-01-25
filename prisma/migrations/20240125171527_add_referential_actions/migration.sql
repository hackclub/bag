-- DropForeignKey
ALTER TABLE "Instance" DROP CONSTRAINT "Instance_identityId_fkey";

-- DropForeignKey
ALTER TABLE "Instance" DROP CONSTRAINT "Instance_itemId_fkey";

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE CASCADE ON UPDATE CASCADE;
