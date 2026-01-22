/*
  Warnings:

  - A unique constraint covering the columns `[nodeId]` on the table `Poi` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `floorId` to the `Poi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poi" ADD COLUMN     "floorId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Poi_nodeId_key" ON "Poi"("nodeId");

-- CreateIndex
CREATE INDEX "Poi_floorId_idx" ON "Poi"("floorId");
