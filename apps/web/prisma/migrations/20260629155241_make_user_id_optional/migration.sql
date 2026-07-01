-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" REAL NOT NULL,
    "deliveryFee" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "notes" TEXT,
    "userEmail" TEXT,
    "userName" TEXT,
    "userPhone" TEXT,
    "confirmedAt" DATETIME,
    "autoConfirmedAt" DATETIME,
    "deliveryCode" TEXT,
    "userId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("autoConfirmedAt", "city", "confirmedAt", "createdAt", "deliveryAddress", "deliveryCode", "deliveryFee", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "restaurantId", "status", "total", "updatedAt", "userEmail", "userId", "userName", "userPhone") SELECT "autoConfirmedAt", "city", "confirmedAt", "createdAt", "deliveryAddress", "deliveryCode", "deliveryFee", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "restaurantId", "status", "total", "updatedAt", "userEmail", "userId", "userName", "userPhone" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
