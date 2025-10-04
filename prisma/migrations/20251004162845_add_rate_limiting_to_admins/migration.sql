-- AlterTable
ALTER TABLE "public"."admins" ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_failed_attempt" TIMESTAMP(3),
ADD COLUMN     "locked_until" TIMESTAMP(3);
