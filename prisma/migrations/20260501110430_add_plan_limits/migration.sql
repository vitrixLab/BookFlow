-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "maxClients" INTEGER DEFAULT 25,
ADD COLUMN     "maxEmployees" INTEGER DEFAULT 1,
ADD COLUMN     "plan" TEXT DEFAULT 'solo';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
