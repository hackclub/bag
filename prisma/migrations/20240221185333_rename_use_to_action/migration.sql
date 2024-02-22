/*
  Warnings:

  - You are about to drop the `Use` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UseInstance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UseInstance" DROP CONSTRAINT "UseInstance_identityId_fkey";

-- DropForeignKey
ALTER TABLE "UseInstance" DROP CONSTRAINT "UseInstance_useId_fkey";

-- DropTable
DROP TABLE "Use";

-- DropTable
DROP TABLE "UseInstance";

-- CreateTable
CREATE TABLE "Action" (
    "id" SERIAL NOT NULL,
    "locations" TEXT[],
    "tools" TEXT[],
    "tree" JSONB NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionInstance" (
    "id" SERIAL NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "identityId" TEXT NOT NULL,
    "actionId" INTEGER NOT NULL,

    CONSTRAINT "ActionInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInstance" ADD CONSTRAINT "ActionInstance_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
