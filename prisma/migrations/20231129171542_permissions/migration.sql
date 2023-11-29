/*
  Warnings:

  - You are about to drop the `Permissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Identity" ADD COLUMN     "permissions" "PermissionLevels";

-- DropTable
DROP TABLE "Permissions";

-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "permissions" "PermissionLevels" NOT NULL,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "App_id_key" ON "App"("id");
