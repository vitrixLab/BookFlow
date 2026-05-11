-- CreateTable
CREATE TABLE "LoginTrace" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginTrace_userId_idx" ON "LoginTrace"("userId");

-- CreateIndex
CREATE INDEX "LoginTrace_ip_idx" ON "LoginTrace"("ip");

-- CreateIndex
CREATE INDEX "LoginTrace_createdAt_idx" ON "LoginTrace"("createdAt");
