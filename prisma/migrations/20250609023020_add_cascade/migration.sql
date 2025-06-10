-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MemoryPerson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "memoryId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    CONSTRAINT "MemoryPerson_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MemoryPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MemoryPerson" ("id", "memoryId", "personId") SELECT "id", "memoryId", "personId" FROM "MemoryPerson";
DROP TABLE "MemoryPerson";
ALTER TABLE "new_MemoryPerson" RENAME TO "MemoryPerson";
CREATE UNIQUE INDEX "MemoryPerson_memoryId_personId_key" ON "MemoryPerson"("memoryId", "personId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
