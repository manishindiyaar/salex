# Booking Flow UX (Customer Perspective)

## Shared Number Flow

The customer messages the shared Salex WhatsApp number.

### Step 1: Find Salon

```
Customer: "Hi"
Bot: "👋 Find your salon
     Search by salon name, area, address, or enter your salon code."

Customer: "Faman" (or "1557" for routing code)
Bot: (resolves business, shows service list)
```

If multiple matches:
```
Bot: [List] "Choose your salon"
  • Faman Salon
  • Faman Beauty Studio
  • ...
```

### Step 2: Select Service

```
Bot: [List] "📋 Faman Salon"
     "Select a service to book:"
     
     [View Services]
       • Beard Trim — ₹100 • 15 min
       • Hair Color — ₹1500 • 90 min
       • Deep Conditioning — ₹400 • 30 min
       • ...

Customer: (taps "Beard Trim")
```

### Step 3: Select Time

```
Bot: [List] "⏰ Select Time"
     "Choose your preferred time slot:"
     
     [View Times]
       • 9:00 am — Today, 2 Jun
       • 10:00 am — Today, 2 Jun
       • 11:00 am — Today, 2 Jun
       • ...

Customer: (taps "10:00 am")
```

### Step 4: Confirm Booking

```
Bot: [Buttons] "✅ Confirm Booking"
     "📍 Faman Salon
      🧴 Beard Trim
      ⏰ 2 Jun 2026, 10:00 am
      💰 ₹100
      
      Confirm your booking?"
     
     [✅ Confirm]  [❌ Cancel]

Customer: (taps "✅ Confirm")
```

### Step 5: Booking Confirmed

```
Bot: [Button] "✅ Booking Done"
     "Your appointment is confirmed.
      Want to book another appointment?"
     
     [📅 Book Again]
```

## Dedicated Number Flow

The customer messages a business's dedicated WhatsApp number.
Business selection is skipped entirely — starts at Step 2.

## Navigation at Any Point

The customer can always:
- Type "back" → go to previous step
- Type "start over" → restart from service selection
- Type "change salon" → go back to salon search (shared number only)
- Type "edit service" or "edit time" → jump to that step
- Type "hi" → see contextual menu (not a reset)

## WhatsApp Message Types Used

| Screen | Message Type | Why |
|--------|-------------|-----|
| Greeting/Search | Text | Simple prompt, no buttons needed |
| Salon list | List (interactive) | Multiple options with descriptions |
| Service selection | List (interactive) | Services with price/duration |
| Staff selection | Buttons (≤3) or List (>3) | Quick tap for small teams |
| Time selection | List (interactive) | Many time slots |
| Confirmation | Buttons | Only 2 options: confirm/cancel |
| Booking done | Button | Single "Book Again" action |

## WhatsApp Constraints

- Reply buttons: max 3 per message
- List rows: max 10 per section
- Button title: max 20 characters
- List row title: max 24 characters
- List row description: max 72 characters
- Message body: max 1024 characters
- Header text: max 60 characters
