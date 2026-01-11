# WhatsApp Business API - Constraints, Requirements & Compliance Guide

## Overview

This document outlines all the requirements, tokens, limits, constraints, and compliance guidelines for integrating WhatsApp Business API (Cloud API) into the Salex platform. Understanding these constraints is critical before production deployment.

---

## 1. Prerequisites & Account Setup

### Required Accounts

| Account | Purpose | How to Get |
|---------|---------|------------|
| Meta Business Account | Parent account for all Meta business tools | [business.facebook.com](https://business.facebook.com) |
| WhatsApp Business Account (WABA) | Container for phone numbers and messaging | Created via Meta Business Manager |
| Meta Developer App | API access and webhook configuration | [developers.facebook.com](https://developers.facebook.com) |

### Business Verification

- **Required for production**: Meta Business Verification
- **Timeline**: 2-4 weeks for approval
- **Documents needed** (India):
  - Business registration certificate (GST, Shop Act, etc.)
  - Business address proof
  - Business phone number
  - Official business website or social media presence

### Phone Number Requirements

| Requirement | Details |
|-------------|---------|
| Dedicated number | Cannot be used with WhatsApp personal or Business App |
| Format | Must include country code (e.g., +919876543210) |
| Verification | SMS or voice call verification required |
| Test number | Meta provides a test number for development (free, 5 recipients max) |

---

## 2. Tokens & Credentials

### Required Environment Variables

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789012345      # Your phone number ID
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765  # WABA ID
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxx...           # Permanent access token
WHATSAPP_APP_SECRET=abc123def456...           # For webhook signature verification
WHATSAPP_VERIFY_TOKEN=my_custom_verify_token  # For webhook URL verification

# API Endpoint
WHATSAPP_API_VERSION=v21.0
WHATSAPP_API_BASE_URL=https://graph.facebook.com
```

### Token Types

| Token Type | Expiry | Use Case |
|------------|--------|----------|
| Temporary Access Token | 24 hours | Testing only |
| System User Token | Never expires | Production (recommended) |
| User Access Token | 60 days | Not recommended for servers |

### How to Get Permanent Token

1. Go to Meta Business Settings → System Users
2. Create a System User with "Admin" role
3. Add the System User to your WhatsApp App
4. Generate token with permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Save the token securely (shown only once)

---

## 3. Messaging Limits

### Daily Message Limits (Business-Initiated)

| Tier | Daily Limit | How to Reach |
|------|-------------|--------------|
| Tier 0 (Sandbox) | 250 messages | Default for new accounts |
| Tier 1 | 1,000 messages | After business verification |
| Tier 2 | 10,000 messages | High quality rating maintained |
| Tier 3 | 100,000 messages | Consistent high quality |
| Tier 4 | Unlimited | Enterprise accounts |

### Limit Upgrade Requirements

- Maintain **High** or **Medium** quality rating
- Send at least 50% of current limit
- No policy violations
- Automatic upgrade after 7 days of good standing

### Customer-Initiated Messages

- **No limit** on responding to customer messages
- Must respond within **24-hour window**
- Free-form messages allowed within window

---

## 4. The 24-Hour Messaging Window

### How It Works

```
Customer sends message → 24-hour window opens → Business can send free-form messages
                                              ↓
                        Window expires → Must use Template Messages only
```

### Message Types by Window Status

| Window Status | Allowed Message Types |
|---------------|----------------------|
| Open (within 24h) | Free-form text, images, documents, interactive messages |
| Closed (after 24h) | Template messages only (pre-approved) |

### Important Rules

- Window resets with each customer message
- Interactive messages (buttons, lists) only work within 24-hour window
- Template messages can be sent anytime (with opt-in)

---

## 5. Interactive Message Limits

### Button Messages

| Constraint | Limit |
|------------|-------|
| Maximum buttons | 3 reply buttons |
| Button title length | 20 characters |
| Button ID length | 256 characters |
| Can only be sent | Within 24-hour window |

### List Messages

| Constraint | Limit |
|------------|-------|
| Maximum sections | 10 sections |
| Maximum rows per section | 10 rows |
| Maximum total rows | 10 rows total |
| Section title length | 24 characters |
| Row title length | 24 characters |
| Row description length | 72 characters |
| Button text length | 20 characters |
| Can only be sent | Within 24-hour window |

### Text Messages

| Constraint | Limit |
|------------|-------|
| Maximum length | 4,096 characters |
| Recommended length | Under 1,600 characters |

### Media Messages

| Type | Max Size | Formats |
|------|----------|---------|
| Image | 5 MB | JPEG, PNG |
| Document | 100 MB | PDF, DOC, DOCX, etc. |
| Audio | 16 MB | AAC, MP3, OGG, AMR |
| Video | 16 MB | MP4, 3GPP |
| Sticker | 500 KB | WEBP |

---

## 6. Template Messages

### Categories

| Category | Purpose | Pricing (India) |
|----------|---------|-----------------|
| Marketing | Promotions, offers, newsletters | ₹0.88/message |
| Utility | Order updates, appointment reminders | ₹0.12/message (free in 24h window from April 2025) |
| Authentication | OTP, verification codes | ₹0.12/message |

### Template Approval Process

1. Submit template via Meta Business Manager
2. Review time: Usually 24-48 hours
3. Status: Approved, Rejected, or Pending
4. Rejected templates can be edited and resubmitted

### Template Requirements

- **No promotional content** in Utility templates
- **Clear opt-in** required for Marketing templates
- **No misleading content**
- **Variables** must be clearly marked: `{{1}}`, `{{2}}`
- **Language** must match template language setting

### Template Rejection Reasons

- Promotional content in utility category
- Missing or unclear call-to-action
- Grammatical errors
- Misleading information
- Violates WhatsApp policies

---

## 7. Quality Rating & Account Health

### Quality Rating Levels

| Rating | Status | Impact |
|--------|--------|--------|
| 🟢 High (Green) | Healthy | Can increase messaging limits |
| 🟡 Medium (Yellow) | Warning | Monitor closely |
| 🔴 Low (Red) | Flagged | Messaging limits may decrease |

### What Affects Quality Rating

**Negative Signals:**
- Users blocking your number
- Users reporting messages as spam
- Low response rates to your messages
- High template message rejection rate

**Positive Signals:**
- High response rates
- Users saving your contact
- Positive engagement with messages
- Low block/report rates

### Account Statuses

| Status | Meaning | Action |
|--------|---------|--------|
| Connected | Normal operation | None |
| Flagged | Quality dropped to Low | Improve quality within 7 days |
| Restricted | Hit messaging limit | Wait 24 hours, improve quality |
| Banned | Severe violations | Appeal or create new account |

---

## 8. Webhook Security

### Signature Verification (REQUIRED)

All incoming webhooks must be verified using `X-Hub-Signature-256` header.

```typescript
// Verification algorithm
const crypto = require('crypto');

function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  );
}
```

### Webhook URL Verification

Meta verifies your webhook URL with a GET request:

```
GET /webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

Response: Return `hub.challenge` value with 200 status.

### Webhook Requirements

| Requirement | Details |
|-------------|---------|
| Protocol | HTTPS only |
| Response time | Must respond within 20 seconds |
| Response code | 200 OK (even for errors) |
| Certificate | Valid SSL certificate |

---

## 9. Compliance & Policies

### Opt-In Requirements

**Mandatory**: Businesses must obtain explicit opt-in before sending messages.

**Valid Opt-In Methods:**
- Website checkbox during signup
- SMS opt-in confirmation
- Click-to-WhatsApp ads
- QR code scanning with consent
- In-app permission request

**Opt-In Must Include:**
- Business name
- Types of messages to expect
- Frequency of messages
- How to opt-out

### Prohibited Content

❌ **Never send:**
- Adult content or services
- Alcohol or tobacco products
- Gambling or betting
- Weapons or ammunition
- Illegal products or services
- Counterfeit goods
- Cryptocurrency trading
- Multi-level marketing
- Political content
- Hate speech or discrimination

### Prohibited Practices

❌ **Never do:**
- Send unsolicited bulk messages
- Share customer data without consent
- Impersonate other businesses
- Send misleading information
- Spam or harass users
- Sell or rent phone number lists

### Data Privacy (GDPR/India DPDP)

| Requirement | Implementation |
|-------------|----------------|
| Consent | Explicit opt-in before messaging |
| Data access | Allow users to request their data |
| Data deletion | Honor deletion requests |
| Data storage | Encrypt sensitive data |
| Data sharing | Never share without consent |

---

## 10. Pricing (India - Effective 2025)

### Current Model (Until June 30, 2025)

Conversation-based pricing (24-hour window = 1 conversation)

| Category | Price (INR) |
|----------|-------------|
| Marketing | ₹0.8855 |
| Utility | ₹0.1265 |
| Authentication | ₹0.1265 |
| Service (customer-initiated) | FREE |

### New Model (From July 1, 2025)

Per-message pricing for template messages

| Category | Price (INR) |
|----------|-------------|
| Marketing | ₹0.88/message |
| Utility | ₹0.12/message (free in 24h window) |
| Authentication | ₹0.12/message |
| Service (free-form in 24h) | FREE |

### Free Messages

- All customer-initiated conversations (service window)
- Utility templates within 24-hour window (from April 2025)
- First 1,000 service conversations/month

---

## 11. Rate Limits

### API Rate Limits

| Endpoint | Limit |
|----------|-------|
| Messages API | 80 messages/second per phone number |
| Media upload | 100 requests/hour |
| Template management | 100 requests/hour |
| Business profile | 100 requests/hour |

### Throughput Limits

| Tier | Messages/Second |
|------|-----------------|
| Standard | 80 msg/sec |
| High throughput | 250 msg/sec (request required) |

---

## 12. Error Codes Reference

### Common Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 131047 | Re-engagement message | Use template message instead |
| 131048 | Spam rate limit | Reduce message frequency |
| 131051 | Unsupported message type | Check message format |
| 131052 | Media download failed | Re-upload media |
| 131053 | Media upload failed | Check file size/format |
| 131056 | Pair rate limit | Wait before retrying |
| 131057 | Account in maintenance | Retry later |
| 368 | Temporarily blocked | Quality issues, wait 24h |
| 130429 | Rate limit exceeded | Implement backoff |
| 133010 | Phone number not registered | Register number first |

---

## 13. Implementation Checklist

### Before Development

- [ ] Create Meta Business Account
- [ ] Create WhatsApp Business Account
- [ ] Create Meta Developer App
- [ ] Get test phone number for development
- [ ] Generate permanent access token
- [ ] Set up webhook URL (HTTPS)
- [ ] Configure webhook verification token

### Before Production

- [ ] Complete Meta Business Verification
- [ ] Register production phone number
- [ ] Create and approve message templates
- [ ] Implement webhook signature verification
- [ ] Implement opt-in collection mechanism
- [ ] Set up quality monitoring
- [ ] Configure error handling and retries
- [ ] Test all message types
- [ ] Review compliance with policies

### Ongoing Monitoring

- [ ] Monitor quality rating daily
- [ ] Track message delivery rates
- [ ] Monitor block/report rates
- [ ] Review template performance
- [ ] Update templates as needed
- [ ] Respond to customer messages promptly

---

## 14. Salex-Specific Considerations

### For Booking Confirmations (Utility)

```
Template: booking_confirmation
Category: Utility
Content:
"Hi {{1}}, your appointment at {{2}} is confirmed!
📅 Date: {{3}}
⏰ Time: {{4}}
💇 Service: {{5}}

Reply 'CANCEL' to cancel or 'RESCHEDULE' to change."
```

### For Appointment Reminders (Utility)

```
Template: appointment_reminder
Category: Utility
Content:
"Reminder: You have an appointment at {{1}} tomorrow at {{2}}.

Reply 'CONFIRM' to confirm or 'CANCEL' to cancel."
```

### For Marketing (Requires Opt-In)

```
Template: special_offer
Category: Marketing
Content:
"🎉 Special offer at {{1}}!
Get {{2}}% off on all services this week.

Book now: {{3}}

Reply STOP to unsubscribe."
```

---

## 15. Useful Links

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [WhatsApp Commerce Policy](https://www.whatsapp.com/legal/commerce-policy)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)

---

## Summary

| Aspect | Key Constraint |
|--------|----------------|
| Messaging Window | 24 hours for free-form, templates anytime |
| Interactive Messages | Only within 24-hour window |
| Buttons | Max 3 per message |
| List Items | Max 10 total |
| Daily Limit (Start) | 250 messages |
| Quality Rating | Must maintain High/Medium |
| Opt-In | Required for all business-initiated messages |
| Webhook Security | HMAC-SHA256 signature verification required |
| Token | Use System User token (never expires) |
| Pricing (India) | ~₹0.88 marketing, ~₹0.12 utility per message |
