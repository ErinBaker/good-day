/*
  Warnings:

  - You are about to drop the `MemoryPerson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MemoryPerson";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_MemoryToPerson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MemoryToPerson_A_fkey" FOREIGN KEY ("A") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemoryToPerson_B_fkey" FOREIGN KEY ("B") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_MemoryToPerson_AB_unique" ON "_MemoryToPerson"("A", "B");

-- CreateIndex
CREATE INDEX "_MemoryToPerson_B_index" ON "_MemoryToPerson"("B");
