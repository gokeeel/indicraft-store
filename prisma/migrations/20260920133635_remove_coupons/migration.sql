/*
  Warnings:

  - You are about to drop the column `couponCode` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Coupon` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "couponCode",
DROP COLUMN "discount";

-- DropTable
DROP TABLE "Coupon";
