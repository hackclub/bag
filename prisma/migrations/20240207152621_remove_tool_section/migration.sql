/*
  Warnings:

  - You are about to drop the `_craftingTools` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_craftingTools" DROP CONSTRAINT "_craftingTools_A_fkey";

-- DropForeignKey
ALTER TABLE "_craftingTools" DROP CONSTRAINT "_craftingTools_B_fkey";

-- DropTable
DROP TABLE "_craftingTools";
