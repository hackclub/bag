/*
  Warnings:

  - Made the column `permissions` on table `Identity` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "App" ALTER COLUMN "permissions" SET DEFAULT 'READ';

-- AlterTable
ALTER TABLE "Identity" ALTER COLUMN "permissions" SET NOT NULL,
ALTER COLUMN "permissions" SET DEFAULT 'READ';
