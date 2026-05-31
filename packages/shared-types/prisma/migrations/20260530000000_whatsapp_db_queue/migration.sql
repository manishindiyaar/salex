-- AlterTable
ALTER TABLE "WhatsAppConversation"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedAt" TIMESTAMP(3),
ADD COLUMN "lockedBy" TEXT;

-- CreateTable
CREATE TABLE "WhatsAppInboundEvent" (
    "id" TEXT NOT NULL,
    "waMessageId" TEXT NOT NULL,
    "phoneNumberId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "businessId" TEXT,
    "messageType" TEXT NOT NULL,
    "messageText" TEXT,
    "interactiveId" TEXT,
    "interactiveText" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppInboundEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppOutboundMessage" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "phoneNumberId" TEXT,
    "messageType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "WhatsAppOutboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingIntent" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "serviceIds" JSONB NOT NULL,
    "requestedTime" TIMESTAMP(3) NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bookingId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppProcessingLock" (
    "lockKey" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppProcessingLock_pkey" PRIMARY KEY ("lockKey")
);

-- CreateIndex
CREATE INDEX "WhatsAppConversation_customerPhone_idx" ON "WhatsAppConversation"("customerPhone");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_businessId_idx" ON "WhatsAppConversation"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppInboundEvent_waMessageId_key" ON "WhatsAppInboundEvent"("waMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppInboundEvent_status_nextAttemptAt_idx" ON "WhatsAppInboundEvent"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "WhatsAppInboundEvent_customerPhone_idx" ON "WhatsAppInboundEvent"("customerPhone");

-- CreateIndex
CREATE INDEX "WhatsAppInboundEvent_businessId_idx" ON "WhatsAppInboundEvent"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppOutboundMessage_idempotencyKey_key" ON "WhatsAppOutboundMessage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WhatsAppOutboundMessage_status_nextAttemptAt_idx" ON "WhatsAppOutboundMessage"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "WhatsAppOutboundMessage_conversationId_idx" ON "WhatsAppOutboundMessage"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingIntent_idempotencyKey_key" ON "BookingIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingIntent_conversationId_idx" ON "BookingIntent"("conversationId");

-- CreateIndex
CREATE INDEX "BookingIntent_businessId_idx" ON "BookingIntent"("businessId");

-- CreateIndex
CREATE INDEX "BookingIntent_status_expiresAt_idx" ON "BookingIntent"("status", "expiresAt");
