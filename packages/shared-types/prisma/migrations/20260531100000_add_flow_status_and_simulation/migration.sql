-- CreateEnum: FlowStatus (DRAFT, PUBLISHED, ARCHIVED)
CREATE TYPE "FlowStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AddColumn: WhatsAppFlow.status with default DRAFT
ALTER TABLE "WhatsAppFlow" ADD COLUMN "status" "FlowStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex: status-based queries for WhatsAppFlow
CREATE INDEX "WhatsAppFlow_businessId_status_idx" ON "WhatsAppFlow"("businessId", "status");

-- CreateTable: SimulationSession (isolated admin flow testing - Req 7.1, 7.5, 10.1)
CREATE TABLE "SimulationSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "flowVersion" INTEGER NOT NULL,
    "adminId" TEXT NOT NULL,
    "currentNodeId" TEXT NOT NULL,
    "contextData" JSONB NOT NULL DEFAULT '{}',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SimulationMessage (messages exchanged during simulation)
CREATE TABLE "SimulationMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "nodeId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SimulationSession indexes
CREATE INDEX "SimulationSession_businessId_adminId_lastMessageAt_idx" ON "SimulationSession"("businessId", "adminId", "lastMessageAt");
CREATE INDEX "SimulationSession_lastMessageAt_idx" ON "SimulationSession"("lastMessageAt");

-- CreateIndex: SimulationMessage indexes
CREATE INDEX "SimulationMessage_sessionId_timestamp_idx" ON "SimulationMessage"("sessionId", "timestamp");

-- AddForeignKey: SimulationMessage -> SimulationSession (cascade delete)
ALTER TABLE "SimulationMessage" ADD CONSTRAINT "SimulationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SimulationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- DATA MIGRATION: Set status based on existing isActive field (Req 3.4, 11.1)
-- ============================================
UPDATE "WhatsAppFlow" SET "status" = 'PUBLISHED' WHERE "isActive" = true;
UPDATE "WhatsAppFlow" SET "status" = 'DRAFT' WHERE "isActive" = false;
