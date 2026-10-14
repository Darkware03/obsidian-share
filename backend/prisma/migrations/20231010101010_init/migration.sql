-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_tokenHash_key" ON "Document"("tokenHash");

-- CreateIndex
CREATE INDEX "Document_tokenHash_idx" ON "Document"("tokenHash");
