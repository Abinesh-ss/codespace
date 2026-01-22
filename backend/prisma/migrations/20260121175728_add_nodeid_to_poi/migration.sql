/*
  Warnings:

  - Added the required column `nodeId` to the `Poi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Floor" ADD COLUMN     "level" INTEGER;

-- AlterTable
ALTER TABLE "Poi" ADD COLUMN     "nodeId" TEXT NOT NULL;
