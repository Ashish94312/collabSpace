/*
  Warnings:

  - You are about to drop the column `drawingData` on the `Page` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'EDITOR', 'COMMENTER', 'VIEWER');

-- AlterTable
ALTER TABLE "DocumentShare" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EDITOR';

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "drawingData";
