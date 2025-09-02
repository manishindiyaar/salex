-- Database migrations for WhatsApp simulator - database/migrations/001_add_whatsapp_tables.sql

-- Customer table for phone-based authentication
CREATE TABLE customers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT phone_format CHECK (phone_number ~ '^\+?[1-9]\d{1,14}$')
);

-- Customer sessions for 2-hour JWT tokens
CREATE TABLE customer_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    session_token VARCHAR NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_session UNIQUE (customer_id, business_id)
);

-- Conversations for tracking WhatsApp dialogues
CREATE TABLE conversations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    business_id VARCHAR NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    session_token VARCHAR NOT NULL,
    state VARCHAR DEFAULT 'GREETING' CHECK (state IN ('GREETING', 'SERVICE_SELECTION', 'TIME_SELECTION', 'BOOKING_CONFIRMATION', 'COMPLETED')),
    context JSONB DEFAULT '{}',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages for WhatsApp-compatible message tracking
CREATE TABLE messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    whatsapp_message_id VARCHAR UNIQUE,
    direction VARCHAR NOT NULL CHECK (direction IN ('INCOMING', 'OUTGOING')),
    type VARCHAR NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'interactive', 'image', 'audio', 'document', 'video')),
    content JSONB NOT NULL DEFAULT '{}',
    status VARCHAR NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversation_messages (conversation_id, created_at),
    INDEX idx_whatsapp_id (whatsapp_message_id)
);

-- Optimized indexes for polling queries
CREATE INDEX idx_customer_sessions_expires ON customer_sessions(expires_at);
CREATE INDEX idx_conversations_business ON conversations(business_id, updated_at);
CREATE INDEX idx_conversations_expires ON conversations(expires_at);
CREATE INDEX idx_messages_new ON messages(created_at DESC) WHERE status = 'sent';

-- Full-text search capability for message content
CREATE INDEX idx_messages_content_search ON messages USING GIN (to_tsvector('english', content->>'body'));

-- Business routing codes (assuming this will be added in Story 1.8)
-- ALTER TABLE businesses ADD COLUMN routing_code VARCHAR(4) UNIQUE;
-- CREATE INDEX idx_business_routing_code ON businesses(routing_code);