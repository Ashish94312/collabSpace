-- CreateTable
CREATE TABLE "Canvas" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "drawingData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Canvas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Canvas_pageId_key" ON "Canvas"("pageId");

-- AddForeignKey
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
