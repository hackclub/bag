/*
  Warnings:

  - You are about to drop the column `testing` on the `App` table. All the data in the column will be lost.

*/

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "durability" INTEGER NOT NULL DEFAULT 100;
