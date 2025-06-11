/*
  Warnings:

  - The primary key for the `Memory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MemoryPerson` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Memory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Memory" ("createdAt", "date", "description", "id", "photoUrl", "title", "updatedAt") SELECT "createdAt", "date", "description", "id", "photoUrl", "title", "updatedAt" FROM "Memory";
DROP TABLE "Memory";
ALTER TABLE "new_Memory" RENAME TO "Memory";
CREATE TABLE "new_MemoryPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memoryId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    CONSTRAINT "MemoryPerson_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemoryPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MemoryPerson" ("id", "memoryId", "personId") SELECT "id", "memoryId", "personId" FROM "MemoryPerson";
DROP TABLE "MemoryPerson";
ALTER TABLE "new_MemoryPerson" RENAME TO "MemoryPerson";
CREATE UNIQUE INDEX "MemoryPerson_memoryId_personId_key" ON "MemoryPerson"("memoryId", "personId");
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalFilename" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "baseFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memoryId" TEXT,
    CONSTRAINT "Photo_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("baseFilename", "createdAt", "folder", "height", "id", "memoryId", "mimeType", "originalFilename", "size", "width") SELECT "baseFilename", "createdAt", "folder", "height", "id", "memoryId", "mimeType", "originalFilename", "size", "width" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
