# Implementation Plan: WhatsApp Channel Configuration

## Overview

This plan implements per-business WhatsApp channel configuration with dedicated Meta App credentials. The implementation proceeds bottom-up: schema changes and encryption service first, then the channel service and API layer, followed by runtime integration (outbound routing + webhook verification), and finally the admin dashboard UI.

## Tasks

- [ ] 1. Schema changes and encryption service foundation
  - [ ] 1.1 Add encrypted credential fields to WhatsAppChannel Prisma model
    - Add `accessToken String?` field (AES-256-GCM encrypted, base64 encoded)
    - Add `appSecret String?` field (AES-256-GCM encrypted, base64 encoded)
    - Add `lastTestedAt DateTime?` field
    - Run `prisma migrate dev` to generate migration
    - _Requirements: 1.1_

  - [ ] 1.2 Add `CHANNEL_ENCRYPTION_KEY` to config schema
    - Add `channelEncryptionKey` field to `configSchema` in `apps/api/src/config/index.ts` (64-char hex string, optional in dev)
    - Add entry to `apps/api/.env.example`
    - Map `process.env.CHANNEL_ENCRYPTION_KEY` in `loadConfig()`
    - _Requirements: 1.4_

  - [ ] 1.3 Implement Encryption Service
    - Create `apps/api/src/services/encryption.service.ts`
    - Implement `encrypt(plaintext: string): string` using `crypto.createCipheriv('aes-256-gcm', key, iv)` with random 12-byte IV
    - Implement `decrypt(ciphertext: string): string` using `crypto.createDecipheriv`
    - Output format: `base64(iv):base64(ciphertext):base64(authTag)`
    - Throw `EncryptionError` on decryption failure
    - Source key from `getConfig().channelEncryptionKey`
    - _Requirements: 1.4, 1.5_

  - [ ]* 1.4 Write property test for Encryption Service round-trip
    - **Property 1: Encryption Round-Trip**
    - Generate arbitrary strings with fast-check, verify `decrypt(encrypt(x)) === x`
    - **Validates: Requirements 1.1**

  - [ ]* 1.5 Write unit tests for Encryption Service
    - Test with empty string, unicode characters, very long strings
    - Test decryption failure with corrupted ciphertext
    - Test decryption failure with wrong key
    - _Requirements: 1.4, 1.5_

- [ ] 2. Token Cache and credential masking utilities
  - [ ] 2.1 Implement Token Cache service
    - Create `apps/api/src/services/token-cache.service.ts`
    - Implement `Map<string, TokenCacheEntry>` with 5-minute TTL
    - Implement `get(businessId)` with TTL expiry check
    - Implement `set(businessId, entry)` with automatic `expiresAt` calculation
    - Implement `invalidate(businessId)` and `clear()`
    - Export singleton instance
    - _Requirements: 4.4_

  - [ ] 2.2 Implement credential masking utility
    - Create `apps/api/src/utils/mask-credential.ts`
    - For strings of length >= 4: replace all but last 4 chars with asterisks
    - For strings of length < 4: replace entire string with asterisks
    - _Requirements: 1.2, 1.3_

  - [ ]* 2.3 Write property test for credential masking
    - **Property 2: Credential Masking**
    - Generate arbitrary strings, verify masking rules hold for all inputs
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.4 Write property test for Token Cache TTL
    - **Property 4: Token Cache TTL**
    - Simulate time progression with fake timers, verify single decryption within 5-min window
    - **Validates: Requirements 4.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. WhatsApp Channel Service
  - [ ] 4.1 Implement WhatsApp Channel Service
    - Create `apps/api/src/services/whatsapp-channel.service.ts`
    - Implement `getChannel(businessId)` — query DB, mask credentials in response
    - Implement `upsertChannel(businessId, input)` — encrypt credentials, upsert with mode=DEDICATED, status=PENDING, check phoneNumberId uniqueness
    - Implement `testConnection(businessId)` — decrypt token, call Meta Graph API `GET /{phoneNumberId}?fields=display_phone_number`, 10s timeout
    - Implement `connect(businessId)` — verify `lastTestedAt` exists, transition status to CONNECTED
    - Implement `disconnect(businessId)` — set status=DISABLED, mode=SHARED, invalidate token cache, retain credentials
    - Implement `getCredentials(businessId)` — decrypt and return credentials for runtime use
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 4.2 Write unit tests for WhatsApp Channel Service
    - Test CRUD operations with mocked Prisma client
    - Test state transitions (PENDING → CONNECTED → DISABLED → CONNECTED)
    - Test phoneNumberId conflict detection
    - Test connect rejection without prior successful test
    - Test connection test timeout handling
    - _Requirements: 2.3, 2.4, 2.7, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.5_

- [ ] 5. Admin Controller and Routes
  - [ ] 5.1 Implement Admin WhatsApp Channel Controller
    - Create `apps/api/src/controllers/admin-whatsapp-channel.controller.ts`
    - Implement `getChannel` handler — return channel config or shared-channel indicator
    - Implement `upsertChannel` handler — validate request body (Zod), call service, create audit log
    - Implement `testConnection` handler — call service, return result
    - Implement `connect` handler — call service, create audit log
    - Implement `disconnect` handler — call service, create audit log
    - Sanitize credential values in request logs with `[REDACTED]`
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.7, 3.1, 3.2, 3.3, 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.2 Implement Admin WhatsApp Channel Routes
    - Create `apps/api/src/routes/admin-whatsapp-channel.routes.ts`
    - Register 5 endpoints under `/v1/admin/businesses/:businessId/whatsapp-channel`
    - Apply `adminAuthMiddleware` and `requireAdminRole('ADMIN')` to all routes
    - Wire routes into the main Express app
    - _Requirements: 2.1, 8.3_

  - [ ]* 5.3 Write unit tests for Admin Controller
    - Test request validation (missing fields, invalid data)
    - Test response shaping (masked credentials)
    - Test error responses (404, 409, 400, 500)
    - Test audit log creation on mutations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Runtime outbound message routing
  - [ ] 7.1 Update WhatsApp Service for per-business credential routing
    - Modify `sendMessage` in `apps/api/src/services/whatsapp.service.ts`
    - Add `businessId` to options parameter
    - When `businessId` provided: check token cache → on miss, query channel (DEDICATED + CONNECTED) → decrypt → cache → use per-business credentials
    - On decryption failure: log error, fall back to shared credentials
    - On no channel found: use shared credentials
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write property test for outbound credential routing
    - **Property 3: Outbound Credential Routing**
    - Generate channel configurations (mode, status combinations), verify correct credential selection
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 7.3 Write unit tests for updated WhatsApp Service
    - Test per-business token used when channel is DEDICATED + CONNECTED
    - Test shared token used when no channel exists
    - Test shared token used when channel is DISABLED
    - Test fallback on decryption failure
    - Test cache hit avoids repeated decryption
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Inbound webhook signature verification
  - [ ] 8.1 Update Webhook Controller for per-business signature verification
    - Modify webhook controller in `apps/api/src/controllers/whatsapp-webhook.controller.ts`
    - After resolving businessId from phoneNumberId, look up WhatsAppChannel
    - If channel is DEDICATED + CONNECTED: decrypt appSecret, use for HMAC-SHA256 verification
    - If no channel or SHARED: use platform `whatsappAppSecret` from config
    - On signature failure for dedicated channel: reject 401, log with businessId
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.2 Write property test for webhook signature secret routing
    - **Property 5: Webhook Signature Secret Routing**
    - Generate channel states, verify correct secret selection logic
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 8.3 Write unit tests for updated Webhook Controller
    - Test per-business secret used for DEDICATED + CONNECTED channel
    - Test platform secret used when no channel found
    - Test 401 response on signature verification failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Audit logging and log sanitization
  - [ ] 10.1 Implement audit logging for channel operations
    - Add audit log entries in the controller for: create/update channel, connect, disconnect
    - Each entry includes: adminId, businessId, action name, timestamp
    - Use existing AuditLog model
    - _Requirements: 8.2_

  - [ ] 10.2 Implement request log sanitization for credentials
    - Add middleware or utility to sanitize `accessToken` and `appSecret` in request body logs
    - Replace credential values with `[REDACTED]` before logging
    - Ensure no credential values appear in error logs
    - _Requirements: 8.1, 8.4_

  - [ ]* 10.3 Write property test for credential log sanitization
    - **Property 6: Credential Log Sanitization**
    - Generate request bodies with credential fields, verify log output never contains plaintext values
    - **Validates: Requirements 8.1, 8.4**

  - [ ]* 10.4 Write property test for audit log completeness
    - **Property 7: Audit Log Completeness**
    - Generate mutation operations, verify audit entries are created with required fields
    - **Validates: Requirements 8.2**

- [ ] 11. Admin Dashboard UI
  - [ ] 11.1 Create WhatsAppChannelConfig component
    - Create `apps/admin-dashboard/src/components/business/WhatsAppChannelConfig.tsx`
    - Render different UI states based on channel status (SHARED, PENDING, CONNECTED, DISABLED, FAILED)
    - Display "Shared (via routing code)" with "Configure Dedicated Channel" button when no dedicated channel
    - Display configuration form with fields: Phone Number ID, Display Phone Number, WABA ID, Access Token, App Secret
    - Display webhook callback URL as read-only copyable field (`{WEBHOOK_BASE_URL}/v1/webhooks/whatsapp`)
    - _Requirements: 6.1, 6.2, 6.3, 6.9_

  - [ ] 11.2 Implement channel configuration form submission
    - On form submit: call PUT `/v1/admin/businesses/:businessId/whatsapp-channel`
    - Display success/error feedback
    - Validate all required fields before submission
    - _Requirements: 6.4_

  - [ ] 11.3 Implement Test Connection and Connect flows
    - Display "Test Connection" button when status is PENDING
    - On test click: call POST `.../test`, display result (success with phone name, or error message)
    - On test success: enable "Connect" button
    - On connect click: call POST `.../connect`, update UI to CONNECTED state
    - _Requirements: 6.5, 6.6, 6.7_

  - [ ] 11.4 Implement Connected state and Disconnect flow
    - Display channel health info (last inbound, last outbound, quality rating) when CONNECTED
    - Display "Disconnect" button when CONNECTED
    - On disconnect click: call POST `.../disconnect`, update UI to DISABLED state
    - _Requirements: 6.8_

  - [ ] 11.5 Integrate WhatsAppChannelConfig into BusinessDetailPage
    - Import and render `WhatsAppChannelConfig` in the WhatsApp tab of `BusinessDetailPage`
    - Pass `businessId` prop from route params
    - Fetch channel data on mount
    - _Requirements: 6.1_

  - [ ]* 11.6 Write component tests for WhatsAppChannelConfig
    - Test renders correct state for each channel status
    - Test form validation (required fields)
    - Test API call integration with mock responses
    - Test copy-to-clipboard for webhook URL
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The encryption key (`CHANNEL_ENCRYPTION_KEY`) must be generated and added to `.env` before running the service
- Existing `WhatsAppChannel` records will have `accessToken`, `appSecret`, and `lastTestedAt` as null (backward compatible)
- The token cache is in-memory only — server restarts clear it, which is acceptable at current scale

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "7.1", "8.1", "10.1", "10.2"] },
    { "id": 6, "tasks": ["7.2", "7.3", "8.2", "8.3", "10.3", "10.4"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 9, "tasks": ["11.5", "11.6"] }
  ]
}
```
