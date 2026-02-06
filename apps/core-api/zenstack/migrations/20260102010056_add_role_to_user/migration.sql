-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SYSTEM_ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role";
