# Dedicated WhatsApp Channel Setup Guide

## Overview

By default, all businesses on Salex share a single platform WhatsApp number. Customers text a routing code (e.g. "S1234") to reach a specific business. This works well for getting started, but businesses that want a professional presence can connect their **own dedicated WhatsApp number** — customers message that number directly without any routing code.

## How It Works (Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Meta WhatsApp Cloud API                        │
│                                                                   │
│  Business A's number: +91-98765-43210 (phone_number_id: "111...")│
│  Business B's number: +91-87654-32109 (phone_number_id: "222...")│
│  Salex shared number: +91-76543-21098 (phone_number_id: "333...")│
└───────────────────────────┬─────────────────────────────────────┘
                            │ ALL webhooks go to the SAME URL
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  https://your-domain.com/v1/webhooks/whatsapp                    │
│                                                                   │
│  Webhook Controller:                                              │
│    1. Parse phone_number_id from payload                         │
│    2. Look up WhatsAppChannel table by phone_number_id           │
│    3. If DEDICATED + CONNECTED → route to that business's flow   │
│    4. If not found → shared number path (ask for routing code)   │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** One webhook URL handles ALL businesses. Meta differentiates them by `phone_number_id` in the payload.

## Prerequisites

Before setting up a dedicated channel, the business needs:

1. A **Meta Business Account** (verified)
2. A **WhatsApp Business API** phone number registered in Meta Business Manager
3. A **permanent access token** from Meta (System User token with `whatsapp_business_messaging` permission)
4. The **App Secret** from the Meta App (for webhook signature verification)

## Step-by-Step Setup

### Step 1: Gather Credentials from Meta Business Manager

Log into [Meta Business Manager](https://business.facebook.com) → WhatsApp → API Setup:

| Credential | Where to find it | Example |
|-----------|-----------------|---------|
| **Phone Number ID** | WhatsApp → API Setup → Phone number ID | `1125541367309190` |
| **Display Phone Number** | The actual phone number | `+91 98765 43210` |
| **WABA ID** | WhatsApp → API Setup → WhatsApp Business Account ID | `1048273650912345` |
| **Access Token** | System Users → Generate Token (with `whatsapp_business_messaging` permission) | `EAABs...` (long string) |
| **App Secret** | App Dashboard → Settings → Basic → App Secret | `abc123def456...` |

### Step 2: Configure in Salex Admin Dashboard

1. Go to **Businesses** → Select the business → **WhatsApp Channel** section
2. Click **"Configure Dedicated Channel"**
3. Fill in all 5 fields:
   - Phone Number ID
   - Display Phone Number
   - WABA ID
   - Access Token (stored encrypted — never visible again in full)
   - App Secret (stored encrypted — never visible again in full)
4. Click **"Save Configuration"**

The channel status is now **PENDING**.

### Step 3: Configure Webhook in Meta Business Manager

After saving, the admin dashboard shows:
- **Webhook Callback URL**: `https://your-domain.com/v1/webhooks/whatsapp`
- **Verify Token**: (get from the existing flow verify-token endpoint or your `.env` `WHATSAPP_VERIFY_TOKEN`)

In Meta Business Manager:
1. Go to **WhatsApp** → **Configuration** → **Webhooks**
2. Click **Edit**
3. Set **Callback URL** to: `https://your-domain.com/v1/webhooks/whatsapp`
4. Set **Verify Token** to: your platform's `WHATSAPP_VERIFY_TOKEN` value
5. Click **Verify and Save**
6. Subscribe to: `messages`, `messaging_postbacks`

> **Important:** The verify token is the SAME for all businesses. It's a platform-level secret, not per-business. The per-business secret (App Secret) is used for payload signature verification, not the webhook handshake.

### Step 4: Test Connection

Back in the Salex admin dashboard:
1. Click **"Test Connection"**
2. This calls Meta's Graph API with the stored access token to verify it works
3. If successful, you'll see the verified phone number name
4. If failed, check the access token and phone number ID

### Step 5: Connect (Activate)

After a successful test:
1. Click **"Connect"**
2. The channel status changes to **CONNECTED**
3. The business is now live on their dedicated number

## What Happens at Runtime

### Inbound (Customer → Business):

```
Customer messages +91-98765-43210
    → Meta sends webhook to your server
    → Payload: { phone_number_id: "1125541367309190", message: "hi" }
    → Webhook controller looks up WhatsAppChannel by phone_number_id
    → Finds: businessId = "xyz", mode = "DEDICATED", status = "CONNECTED"
    → Verifies signature using business's encrypted App Secret
    → Routes to business's published flow (no routing code needed)
    → Flow Engine processes the message
```

### Outbound (Business → Customer):

```
Flow Engine produces a response message
    → WhatsApp Service checks: does this business have a DEDICATED + CONNECTED channel?
    → Yes → Decrypts the business's Access Token from DB (cached for 5 min)
    → Sends via Meta API using the business's own phone_number_id + access_token
    → Message appears from the business's own number
```

## Channel Status Lifecycle

```
[No Channel] → PENDING → CONNECTED → DISABLED
                  ↑           │            │
                  │           │            │
                  └───────────┘            │
                  (reconnect)              │
                  ←────────────────────────┘
                  
FAILED (auto, on repeated send failures)
    → Can be reconnected after fixing credentials
```

| Status | Meaning | Customer experience |
|--------|---------|-------------------|
| No channel | Business uses shared number | Customer enters routing code |
| PENDING | Credentials saved, not yet verified | Still uses shared number |
| CONNECTED | Active dedicated channel | Customer messages directly, no code needed |
| DISABLED | Admin disconnected | Falls back to shared number |
| FAILED | Repeated failures detected | Falls back to shared number |

## Security

- **Access tokens** and **App Secrets** are encrypted at rest using AES-256-GCM
- They are NEVER returned in full via API (masked: `****...last4`)
- They are NEVER logged (redacted in all log output)
- Decrypted tokens are cached in memory for 5 minutes max
- All channel operations are recorded in the audit log

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Test Connection failed: Invalid credentials" | Access token expired or wrong | Generate a new permanent token in Meta Business Manager |
| "Test Connection failed: Timeout" | Network issue or Meta API down | Try again later |
| Messages not arriving | Webhook not configured in Meta | Check Step 3 — verify the callback URL is set |
| Messages arriving but 401 error | App Secret mismatch | Update the App Secret in Salex to match Meta App Dashboard |
| Phone Number ID conflict | Same number assigned to another business | Remove it from the other business first |

## API Reference

All endpoints require admin authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/businesses/:businessId/whatsapp-channel` | Get channel config |
| PUT | `/api/v1/admin/businesses/:businessId/whatsapp-channel` | Save/update credentials |
| POST | `/api/v1/admin/businesses/:businessId/whatsapp-channel/test` | Test connection |
| POST | `/api/v1/admin/businesses/:businessId/whatsapp-channel/connect` | Activate channel |
| POST | `/api/v1/admin/businesses/:businessId/whatsapp-channel/disconnect` | Deactivate channel |

## FAQ

**Q: Can multiple businesses share the same webhook URL?**
A: Yes. ALL businesses (shared and dedicated) use the same webhook URL. Meta includes `phone_number_id` in every payload, which tells your system which business it's for.

**Q: Do I need a separate Meta App for each business?**
A: Yes, if using Option A (per-business credentials). Each business has their own Meta App with their own access token and app secret.

**Q: What happens if I disconnect a channel?**
A: The business falls back to the shared platform number. Credentials are retained (encrypted) so you can reconnect later without re-entering them.

**Q: Can a business switch back to shared after using dedicated?**
A: Yes. Disconnect the channel and the business automatically uses the shared number with their routing code again.

**Q: Is the verify token per-business?**
A: No. The verify token is platform-wide (one value in your `.env`). It's only used during Meta's one-time webhook ownership verification. The per-business App Secret is used for ongoing message signature verification.
