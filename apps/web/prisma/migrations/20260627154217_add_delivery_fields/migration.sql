-- AlterTable
ALTER TABLE "orders" ADD COLUMN "autoConfirmedAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "confirmedAt" DATETIME;
ALTER TABLE "orders" ADD COLUMN "deliveryCode" TEXT;

-- CreateTable
CREATE TABLE "delivery_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "delivery_notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "acceptedAt" DATETIME,
    "pickedUpAt" DATETIME,
    "deliveredAt" DATETIME,
    "confirmedByClient" BOOLEAN NOT NULL DEFAULT false,
    "earnings" REAL NOT NULL DEFAULT 0,
    "distance" REAL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deliveries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "deliveries_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_deliveries" ("acceptedAt", "comment", "createdAt", "deliveredAt", "driverId", "id", "orderId", "pickedUpAt", "rating", "restaurantId", "status", "updatedAt") SELECT "acceptedAt", "comment", "createdAt", "deliveredAt", "driverId", "id", "orderId", "pickedUpAt", "rating", "restaurantId", "status", "updatedAt" FROM "deliveries";
DROP TABLE "deliveries";
ALTER TABLE "new_deliveries" RENAME TO "deliveries";
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "delivery_notifications_orderId_idx" ON "delivery_notifications"("orderId");
