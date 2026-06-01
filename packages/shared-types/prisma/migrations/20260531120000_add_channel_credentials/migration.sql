-- AlterTable
ALTER TABLE "WhatsAppChannel" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "WhatsAppChannel" ADD COLUMN "appSecret" TEXT;
ALTER TABLE "WhatsAppChannel" ADD COLUMN "lastTestedAt" TIMESTAMP(3);
