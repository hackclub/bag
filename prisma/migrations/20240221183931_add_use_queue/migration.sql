-- CreateTable
CREATE TABLE "Use" (
    "id" SERIAL NOT NULL,
    "locations" TEXT[],
    "tools" TEXT[],
    "tree" JSONB NOT NULL,
    "identitySlack" TEXT,

    CONSTRAINT "Use_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UseInstance" (
    "id" SERIAL NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "identityId" TEXT NOT NULL,
    "useId" INTEGER NOT NULL,

    CONSTRAINT "UseInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Use" ADD CONSTRAINT "Use_identitySlack_fkey" FOREIGN KEY ("identitySlack") REFERENCES "Identity"("slack") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UseInstance" ADD CONSTRAINT "UseInstance_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("slack") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UseInstance" ADD CONSTRAINT "UseInstance_useId_fkey" FOREIGN KEY ("useId") REFERENCES "Use"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
