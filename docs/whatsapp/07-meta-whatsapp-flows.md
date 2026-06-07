# Meta WhatsApp Flows (Native UI)

## What Are Meta Flows?

Meta WhatsApp Flows are native in-app UI screens rendered inside WhatsApp. They are NOT chat messages — they're full-screen forms with text inputs, radio buttons, dropdowns, etc.

They require:
- A Flow JSON definition (screens + layout)
- A data endpoint (your server handles encrypted requests)
- RSA key pair for encryption
- Business verification for production (draft mode works for testing)

## Current Status in Salex

**Implemented but disabled** due to Meta's test number restrictions (`#139000 Blocked by Integrity`).

- Flow created: ID `2194420554668033` ("Salex Salon Finder")
- Flow JSON uploaded with SEARCH and RESULTS screens
- Endpoint configured at `/api/v1/whatsapp/flows/business-selection`
- RSA keys generated and public key uploaded to Meta
- Config: `WHATSAPP_FLOW_ENDPOINT_ENABLED=false` (disabled)

**Will work once:** You have a verified business phone number (not the test number).

## Architecture

```
Customer taps "Find Salon" button
        │
        ▼
┌─────────────────────────────┐
│  WhatsApp opens Flow UI     │
│  (native form screens)      │
│                             │
│  Screen: SEARCH             │
│  [Text Input: salon name]   │
│  [Search button]            │
└───────────┬─────────────────┘
            │ data_exchange request (encrypted)
            ▼
┌─────────────────────────────┐
│  Your Endpoint              │
│  /api/v1/whatsapp/flows/    │
│  business-selection         │
│                             │
│  1. Decrypt request         │
│  2. Use SharedBusinessResolver │
│  3. Return matches or SUCCESS │
│  4. Encrypt response        │
└───────────┬─────────────────┘
            │
            ▼
┌─────────────────────────────┐
│  If multiple matches:       │
│  Screen: RESULTS            │
│  [Radio buttons: salons]    │
│  [Select button]            │
│                             │
│  If exact match:            │
│  → Flow completes (SUCCESS) │
│  → nfm_reply webhook sent   │
└───────────┬─────────────────┘
            │ nfm_reply webhook
            ▼
┌─────────────────────────────┐
│  Normal webhook pipeline    │
│  • Parse nfm_reply          │
│  • Extract business_id      │
│  • Initialize session       │
│  • Start booking flow       │
└─────────────────────────────┘
```

## Encryption Protocol (v3.0)

**File:** `apps/api/src/services/whatsapp-flow-crypto.service.ts`

### Decryption (incoming request from Meta)

1. Client sends: `{ encrypted_aes_key, encrypted_flow_data, initial_vector }`
2. Decrypt AES key using your RSA private key (OAEP-SHA256)
3. Decrypt flow data using AES-128-GCM with the decrypted key + IV
4. The 128-bit auth tag is appended to the end of encrypted data

```typescript
const decryptedAesKey = crypto.privateDecrypt(
  { key: privateKey, padding: RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  Buffer.from(encrypted_aes_key, 'base64'),
);

const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, iv);
decipher.setAuthTag(authTag);  // last 16 bytes of encrypted data
const plaintext = decipher.update(body) + decipher.final();
```

### Encryption (response back to Meta)

1. Flip the IV (XOR each byte with 0xFF)
2. Encrypt response JSON using AES-128-GCM with same AES key + flipped IV
3. Append auth tag to encrypted data
4. Return as base64 plain text (not JSON!)

```typescript
const flippedIv = Buffer.alloc(iv.length);
for (let i = 0; i < iv.length; i++) flippedIv[i] = iv[i] ^ 0xff;

const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, flippedIv);
const encrypted = Buffer.concat([cipher.update(json), cipher.final(), cipher.getAuthTag()]);
return encrypted.toString('base64');
```

## Data Exchange Actions

| Action | When | Expected Response |
|--------|------|-------------------|
| `INIT` | Flow opens | Return first screen data |
| `BACK` | User taps back | Return previous screen data |
| `data_exchange` | User submits a screen | Process input, return next screen or SUCCESS |
| `ping` | Meta health check | Return `{ data: { status: "active" } }` |

## Flow Completion (SUCCESS response)

When the endpoint returns:
```json
{
  "screen": "SUCCESS",
  "data": {
    "extension_message_response": {
      "params": {
        "flow_token": "xxx",
        "business_id": "cmpsj56f50005t6b0qw05epii",
        "business_name": "Faman Salon"
      }
    }
  }
}
```

Meta sends a webhook with `nfm_reply` containing the `response_json`. Our webhook enhancer parses this and extracts `business_id` to initialize the booking session.

## Flow Token

Generated per-session by us, sent with the Flow CTA message. Contains the customer's phone (base64url encoded) so the endpoint can identify the customer during data exchange.

## Configuration

```env
WHATSAPP_BUSINESS_SELECTION_FLOW_ID=2194420554668033
WHATSAPP_BUSINESS_SELECTION_FLOW_MODE=draft      # or "published" after verification
WHATSAPP_FLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
WHATSAPP_FLOW_TOKEN_SECRET=your-secret-here
WHATSAPP_FLOW_ENDPOINT_ENABLED=false             # set true when ready
```

## When to Enable

1. Get a real business WhatsApp number (not the test number)
2. Complete Meta Business Verification
3. Set `WHATSAPP_FLOW_ENDPOINT_ENABLED=true`
4. The system automatically sends Flow CTA instead of plain text greeting
5. Fallback: if Flow fails or user types salon name/code directly, chat-based search still works
