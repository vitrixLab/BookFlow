/*
  Warnings:

  - You are about to drop the column `smsRetryCount` on the `BookedAppointment` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `SmsLog` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `SmsLog` table. All the data in the column will be lost.
  - Added the required column `appointmentId` to the `SmsLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientPhone` to the `SmsLog` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_createdBy_fkey";

-- AlterTable
ALTER TABLE "BookedAppointment" DROP COLUMN "smsRetryCount",
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "createdBy",
ALTER COLUMN "durationMin" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SmsLog" DROP COLUMN "message",
DROP COLUMN "phone",
ADD COLUMN     "appointmentId" INTEGER NOT NULL,
ADD COLUMN     "lastAttempt" TIMESTAMP(3),
ADD COLUMN     "recipientPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photo" TEXT,
ALTER COLUMN "password" SET NOT NULL;
