-- CreateTable
CREATE TABLE "Compare" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "nameA" TEXT NOT NULL,
    "nameB" TEXT NOT NULL,
    "annualA" REAL NOT NULL,
    "annualB" REAL NOT NULL,
    "perSecA" REAL NOT NULL,
    "perSecB" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accumulatedOffsetSeconds" REAL NOT NULL DEFAULT 0,
    "isPaused" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Compare_slug_key" ON "Compare"("slug");
