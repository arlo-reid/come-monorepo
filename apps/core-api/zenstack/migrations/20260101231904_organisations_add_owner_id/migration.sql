/*
  Warnings:

  - Added the required column `ownerId` to the `organisations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organisations" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
