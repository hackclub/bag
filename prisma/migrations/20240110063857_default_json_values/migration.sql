/*
  Warnings:

  - Made the column `metadata` on table `App` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `Identity` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `Instance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "App" ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "metadata" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "Identity" ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "metadata" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "Instance" ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "metadata" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "metadata" SET NOT NULL,
ALTER COLUMN "metadata" SET DEFAULT '{}';
