/*
  Warnings:

  - The primary key for the `Person` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MemoryPerson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memoryId" INTEGER NOT NULL,
    "personId" TEXT NOT NULL,
    CONSTRAINT "MemoryPerson_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemoryPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MemoryPerson" ("id", "memoryId", "personId") SELECT "id", "memoryId", "personId" FROM "MemoryPerson";
DROP TABLE "MemoryPerson";
ALTER TABLE "new_MemoryPerson" RENAME TO "MemoryPerson";
CREATE UNIQUE INDEX "MemoryPerson_memoryId_personId_key" ON "MemoryPerson"("memoryId", "personId");
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Person" ("createdAt", "id", "name", "relationship", "updatedAt") SELECT "createdAt", "id", "name", "relationship", "updatedAt" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
