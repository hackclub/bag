-- DropForeignKey
ALTER TABLE "Instance" DROP CONSTRAINT "Instance_identityId_fkey";

-- AlterTable
ALTER TABLE "Instance" ALTER COLUMN "identityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Instance" ADD CONSTRAINT "Instance_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE SET NULL ON UPDATE CASCADE;
