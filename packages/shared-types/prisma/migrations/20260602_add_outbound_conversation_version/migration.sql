-- Add conversationVersion to WhatsAppOutboundMessage for stale-message detection.
-- Nullable so existing rows are unaffected. New outbound messages are stamped with
-- the conversation version they were generated for. The outbound worker drops messages
-- where the conversation has advanced past this version.
ALTER TABLE "WhatsAppOutboundMessage" ADD COLUMN "conversationVersion" INTEGER;
