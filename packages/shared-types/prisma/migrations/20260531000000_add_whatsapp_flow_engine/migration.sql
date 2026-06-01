-- AddColumn: Business.whatsappSettings (nullable Json for segmentation flag)
ALTER TABLE "Business" ADD COLUMN "whatsappSettings" JSONB;

-- AddColumn: WhatsAppConversation.flowId (nullable, version pinning - Req 5.2/5.3)
ALTER TABLE "WhatsAppConversation" ADD COLUMN "flowId" TEXT;

-- AddColumn: WhatsAppConversation.flowVersion (nullable, version pinning - Req 5.2/5.3)
ALTER TABLE "WhatsAppConversation" ADD COLUMN "flowVersion" INTEGER;

-- CreateTable: WhatsAppFlow (versioned flow definition - one row per version per business)
CREATE TABLE "WhatsAppFlow" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "entryNodeId" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on (businessId, version) to retain version history (Req 1.2)
CREATE UNIQUE INDEX "WhatsAppFlow_businessId_version_key" ON "WhatsAppFlow"("businessId", "version");

-- CreateIndex: fast lookup for active flow per business (Req 1.3)
CREATE INDEX "WhatsAppFlow_businessId_isActive_idx" ON "WhatsAppFlow"("businessId", "isActive");

-- AddForeignKey: WhatsAppFlow -> Business (cascade delete)
ALTER TABLE "WhatsAppFlow" ADD CONSTRAINT "WhatsAppFlow_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- HAND-WRITTEN: DB-enforced single active flow per business (Req 1.3)
-- A partial unique index ensures at most one row per businessId can have isActive = true.
-- This is the database-level enforcement of the "at most one active Flow_Definition per business" rule.
-- ============================================
CREATE UNIQUE INDEX "WhatsAppFlow_single_active_per_business"
    ON "WhatsAppFlow"("businessId")
    WHERE "isActive" = true;
