# Requirements Document

## Introduction

This feature enables businesses on the Salex platform to connect their own dedicated WhatsApp number using their Meta App credentials, replacing the shared platform number (which requires a routing code). An admin configures the dedicated channel through the admin dashboard, including credential storage, connection testing, and lifecycle management. The system securely stores per-business access tokens and app secrets, uses them at runtime for outbound messaging and inbound webhook signature verification, and provides graceful fallback to the shared channel when a dedicated channel is disconnected.

## Glossary

- **Admin_Dashboard**: The React-based admin interface at `apps/admin-dashboard` used by platform administrators to manage businesses
- **Admin_API**: The Express backend at `apps/api` providing authenticated endpoints for admin operations
- **WhatsApp_Channel**: The Prisma model and runtime entity representing a business's WhatsApp channel configuration (shared or dedicated)
- **Dedicated_Channel**: A WhatsApp channel where the business uses their own Meta App credentials and phone number
- **Shared_Channel**: The default platform WhatsApp number that all businesses share, using a routing code for identification
- **Access_Token**: A Meta Graph API token specific to a business's Meta App, used to send outbound WhatsApp messages
- **App_Secret**: A Meta App secret used to verify the HMAC-SHA256 signature of inbound webhook payloads
- **Phone_Number_ID**: The Meta-assigned identifier for a WhatsApp Business phone number
- **WABA_ID**: The WhatsApp Business Account identifier associated with a phone number
- **Connection_Test**: A verification call to the Meta Graph API to confirm that a Phone_Number_ID and Access_Token pair are valid
- **Encryption_Service**: The module responsible for encrypting and decrypting sensitive credentials at rest
- **Webhook_Controller**: The Express controller that receives inbound WhatsApp webhook payloads and routes them to the appropriate business

## Requirements

### Requirement 1: Secure Credential Storage

**User Story:** As a platform administrator, I want per-business Meta App credentials stored securely, so that dedicated channel secrets are protected at rest and never exposed in full.

#### Acceptance Criteria

1. WHEN an admin submits Access_Token and App_Secret values for a WhatsApp_Channel, THE Admin_API SHALL encrypt both values using the Encryption_Service before persisting them to the database
2. WHEN the Admin_API returns WhatsApp_Channel data containing an Access_Token, THE Admin_API SHALL mask the Access_Token showing only the last 4 characters
3. WHEN the Admin_API returns WhatsApp_Channel data containing an App_Secret, THE Admin_API SHALL mask the App_Secret showing only the last 4 characters
4. THE Encryption_Service SHALL use AES-256-GCM encryption with a server-side encryption key for all credential encryption operations
5. IF the Encryption_Service fails to decrypt a stored credential, THEN THE Admin_API SHALL return an error indicating credential corruption without exposing the raw stored value

### Requirement 2: Admin Channel Configuration API

**User Story:** As a platform administrator, I want API endpoints to create, read, update, and disconnect dedicated WhatsApp channels, so that I can manage business channel configurations programmatically.

#### Acceptance Criteria

1. WHEN an admin sends a GET request to `/v1/admin/businesses/:businessId/whatsapp-channel`, THE Admin_API SHALL return the current WhatsApp_Channel configuration for that business including mode, status, display phone number, Phone_Number_ID, WABA_ID, masked Access_Token, and masked App_Secret
2. WHEN an admin sends a GET request for a business with no WhatsApp_Channel record, THE Admin_API SHALL return a response indicating the business uses the Shared_Channel with no dedicated configuration
3. WHEN an admin sends a PUT request to `/v1/admin/businesses/:businessId/whatsapp-channel` with valid Phone_Number_ID, display phone number, WABA_ID, Access_Token, and App_Secret, THE Admin_API SHALL create or update the WhatsApp_Channel record with mode set to DEDICATED and status set to PENDING
4. WHEN an admin sends a PUT request with a Phone_Number_ID that is already assigned to a different business, THE Admin_API SHALL reject the request with a conflict error
5. WHEN an admin sends a POST request to `/v1/admin/businesses/:businessId/whatsapp-channel/disconnect`, THE Admin_API SHALL set the WhatsApp_Channel status to DISABLED and mode to SHARED
6. WHEN a Dedicated_Channel is disconnected, THE Admin_API SHALL retain the encrypted credentials in the database for potential reconnection
7. WHEN an admin sends a POST request to `/v1/admin/businesses/:businessId/whatsapp-channel/connect`, THE Admin_API SHALL set the WhatsApp_Channel status to CONNECTED only if a successful Connection_Test has been performed

### Requirement 3: Connection Testing

**User Story:** As a platform administrator, I want to verify that a business's Meta App credentials are valid before activating the channel, so that I can catch configuration errors early.

#### Acceptance Criteria

1. WHEN an admin sends a POST request to `/v1/admin/businesses/:businessId/whatsapp-channel/test`, THE Admin_API SHALL call the Meta Graph API using the stored Phone_Number_ID and decrypted Access_Token to verify the credentials are valid
2. WHEN the Connection_Test receives a successful response from the Meta Graph API, THE Admin_API SHALL return a success result including the phone number display name from Meta
3. IF the Connection_Test receives an authentication error from the Meta Graph API, THEN THE Admin_API SHALL return a failure result indicating invalid credentials
4. IF the Connection_Test receives a network timeout or unreachable error, THEN THE Admin_API SHALL return a failure result indicating a connectivity issue
5. THE Admin_API SHALL complete the Connection_Test within 10 seconds, returning a timeout error if the Meta Graph API does not respond within that period

### Requirement 4: Runtime Outbound Message Routing

**User Story:** As the platform, I want outbound messages for dedicated-channel businesses to use the business's own Access_Token, so that messages are sent from the correct phone number with proper authorization.

#### Acceptance Criteria

1. WHEN the system sends an outbound WhatsApp message for a business with a CONNECTED Dedicated_Channel, THE WhatsApp_Service SHALL use the business's decrypted Access_Token and Phone_Number_ID instead of the platform shared credentials
2. WHEN the system sends an outbound WhatsApp message for a business without a Dedicated_Channel or with a non-CONNECTED channel, THE WhatsApp_Service SHALL use the platform shared Access_Token and Phone_Number_ID
3. IF the WhatsApp_Service fails to decrypt the business Access_Token at send time, THEN THE WhatsApp_Service SHALL log the error and fall back to the platform shared credentials
4. THE WhatsApp_Service SHALL cache decrypted Access_Tokens in memory for up to 5 minutes to avoid repeated decryption operations on every message send

### Requirement 5: Inbound Webhook Signature Verification

**User Story:** As the platform, I want inbound webhook payloads on dedicated channels to be verified using the business's own App_Secret, so that message authenticity is confirmed per-business.

#### Acceptance Criteria

1. WHEN the Webhook_Controller receives an inbound payload and resolves the business via Phone_Number_ID to a CONNECTED Dedicated_Channel, THE Webhook_Controller SHALL verify the webhook signature using the business's decrypted App_Secret
2. WHEN the Webhook_Controller receives an inbound payload for a Phone_Number_ID that maps to the platform Shared_Channel, THE Webhook_Controller SHALL verify the webhook signature using the platform-level App_Secret from environment configuration
3. IF the webhook signature verification fails for a Dedicated_Channel payload, THEN THE Webhook_Controller SHALL reject the request with HTTP 401 and log the verification failure with the business ID
4. IF the Webhook_Controller cannot find a WhatsApp_Channel record for the Phone_Number_ID in the payload, THEN THE Webhook_Controller SHALL fall back to the platform-level App_Secret for signature verification

### Requirement 6: Admin Dashboard Channel UI

**User Story:** As a platform administrator, I want a WhatsApp Channel configuration section in the Business Detail page, so that I can visually manage a business's channel setup.

#### Acceptance Criteria

1. WHEN an admin navigates to the Business Detail page, THE Admin_Dashboard SHALL display a "WhatsApp Channel" section showing the current channel mode and status
2. WHEN the business has no Dedicated_Channel configured, THE Admin_Dashboard SHALL display the status as "Shared (via routing code)" with an option to configure a dedicated channel
3. WHEN the admin clicks "Configure Dedicated Channel", THE Admin_Dashboard SHALL display a form with fields for Phone Number ID, Display Phone Number, WABA ID, Access Token, and App Secret
4. WHEN the admin submits the configuration form with all required fields populated, THE Admin_Dashboard SHALL call the Admin_API PUT endpoint and display the result
5. WHEN a Dedicated_Channel is in PENDING status, THE Admin_Dashboard SHALL display a "Test Connection" button and the webhook callback URL that the admin must register in Meta Business Manager
6. WHEN the admin clicks "Test Connection" and the test succeeds, THE Admin_Dashboard SHALL enable a "Connect" button to activate the channel
7. WHEN the admin clicks "Test Connection" and the test fails, THE Admin_Dashboard SHALL display the error message returned by the Admin_API
8. WHEN a Dedicated_Channel is in CONNECTED status, THE Admin_Dashboard SHALL display a "Disconnect" button and the channel health information (last inbound, last outbound, quality rating)
9. THE Admin_Dashboard SHALL display the webhook callback URL as a read-only copyable field in the format `{WEBHOOK_BASE_URL}/v1/webhooks/whatsapp`

### Requirement 7: Channel Status Lifecycle

**User Story:** As a platform administrator, I want clear channel status transitions, so that I can understand the current state of each business's WhatsApp channel.

#### Acceptance Criteria

1. WHEN a new Dedicated_Channel configuration is saved, THE Admin_API SHALL set the initial status to PENDING
2. WHEN an admin successfully connects a PENDING channel after a passing Connection_Test, THE Admin_API SHALL transition the status to CONNECTED
3. WHEN an admin disconnects a CONNECTED channel, THE Admin_API SHALL transition the status to DISABLED
4. IF the system detects repeated outbound message failures for a Dedicated_Channel, THEN THE Admin_API SHALL transition the status to FAILED
5. WHEN a DISABLED or FAILED channel is reconnected by an admin after a passing Connection_Test, THE Admin_API SHALL transition the status back to CONNECTED

### Requirement 8: Security and Audit

**User Story:** As a platform administrator, I want all channel configuration changes to be auditable and credentials to be protected from logging, so that security compliance is maintained.

#### Acceptance Criteria

1. THE Admin_API SHALL never log Access_Token or App_Secret values in any log output, including error logs and request logs
2. WHEN an admin creates, updates, connects, or disconnects a WhatsApp_Channel, THE Admin_API SHALL record an audit log entry with the admin ID, business ID, action performed, and timestamp
3. THE Admin_API SHALL require admin authentication for all WhatsApp_Channel management endpoints
4. WHEN an Access_Token or App_Secret field is included in an API request body, THE Admin_API SHALL sanitize the request log to replace credential values with "[REDACTED]"
