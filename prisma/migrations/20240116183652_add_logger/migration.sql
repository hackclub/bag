-- CreateEnum
CREATE TYPE "LoggerLevels" AS ENUM ('ERROR', 'GENERAL');

-- CreateTable
CREATE TABLE "Logger" (
    "id" SERIAL NOT NULL,
    "level" "LoggerLevels" NOT NULL DEFAULT 'GENERAL',
    "contents" TEXT NOT NULL,

    CONSTRAINT "Logger_pkey" PRIMARY KEY ("id")
);
