# Shared vs Dedicated Numbers

## Two Operating Modes

| Mode | Who Uses It | How It Works |
|------|-------------|--------------|
| Shared Number | 90% of customers | One Salex WhatsApp number serves all businesses. Customer searches for their salon first. |
| Dedicated Number | Premium businesses | Business has its own WhatsApp number. Customer messaging this number is already identified with that business. |

## Shared Number Path

Phone number: The platform's configured `WHATSAPP_PHONE_NUMBER_ID` (currently test number `+1 555-645-5828`).

```
Customer → messages shared number
  │
  ├── No businessId in webhook (it's the platform number)
  │
  ├── Webhook controller: fast-path skip (no DB lookup for dedicated channel)
  │
  ├── Inbound event stored with businessId = null
  │
  ├── Engine Router: selectEngine({businessId: null}) → 'legacy'
  │
  ├── Legacy conversation service: GREETING → AWAITING_ROUTING_CODE
  │
  ├── SharedBusinessResolver: resolve query (code/name/search)
  │
  ├── Business found → associate conversation → start booking flow
  │
  └── Engine Router may hand off to Flow Engine if business is flagged
```

### Fast-Path Optimization

```typescript
const isSharedNumber = parsed.phoneNumberId === config.whatsappPhoneNumberId;

if (parsed.phoneNumberId && !isSharedNumber) {
  // Only look up WhatsAppChannel for non-shared numbers
  const channel = await prisma.whatsAppChannel.findUnique({...});
}
```

This saves ~200-400ms per message on the shared number path (no DB query for channel lookup).

## Dedicated Number Path

Businesses can connect their own WhatsApp Business number. Stored in `WhatsAppChannel` table.

```
Customer → messages dedicated number (e.g. +91 98765 43210)
  │
  ├── phoneNumberId does NOT match platform shared number
  │
  ├── Webhook controller: looks up WhatsAppChannel by phoneNumberId
  │
  ├── Finds: channel.businessId, mode=DEDICATED, status=CONNECTED
  │
  ├── May use per-business appSecret for signature verification
  │
  ├── Inbound event stored with businessId = channel.businessId
  │
  ├── Engine Router: selectEngine({businessId: 'xxx', ...})
  │   └── Returns 'flow' if business is flagged or has active custom flow
  │
  └── Flow Engine: starts directly at service selection (no salon search)
```

### Per-Business Credentials

Dedicated channels have their own access token and phone number ID, stored encrypted:

```typescript
const creds = await whatsappChannelService.getCredentials(businessId);
// { accessToken, phoneNumberId, appSecret }
```

The `tokenCacheService` provides in-memory caching to avoid repeated decryption.

## WhatsAppChannel Model

```prisma
model WhatsAppChannel {
  id              String    @id @default(cuid())
  businessId      String    @unique
  phoneNumberId   String    @unique
  mode            String    // "DEDICATED" | "SHARED"
  status          String    // "CONNECTED" | "DISCONNECTED" | "PENDING"
  encryptedCreds  String?   // AES-256-GCM encrypted credentials JSON
  lastInboundAt   DateTime?
  lastOutboundAt  DateTime?
  // ...
}
```

## Behavior Differences

| Behavior | Shared Number | Dedicated Number |
|----------|--------------|------------------|
| Salon search | Required (first step) | Skipped |
| "Change salon" | Returns to salon search | Hidden or becomes "Start over" |
| Business greeting message | "Find your salon" | Directly shows service list |
| Token used for sending | Platform token | Per-business token |
| Signature verification | Platform app secret | Per-business app secret |
| Channel DB lookup | Skipped (fast path) | Required (one query) |

## Setting Up a Dedicated Channel

See: `docs/dedicated-whatsapp-channel-setup.md`

1. Business provides their WABA access token and phone number ID
2. Admin stores via admin dashboard (encrypted with `CHANNEL_ENCRYPTION_KEY`)
3. `WhatsAppChannel` row created with `mode: DEDICATED`, `status: CONNECTED`
4. Inbound messages to that phone number are now routed to that business
5. Outbound messages use the business's own credentials
