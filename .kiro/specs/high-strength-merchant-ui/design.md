# Design Document: High-Strength Merchant UI

## Overview

This design document outlines the architecture and implementation approach for transforming the Salex Merchant App into a "High-Strength" tool-based interface optimized for Indian salon owners. The design prioritizes simplicity, high contrast, and physical-feeling interactions that avoid technical complexity.

The key design principles are:
1. **Calculator-Style Bold Text** - Massive condensed fonts for all monetary values and critical numbers
2. **3-Click Rule** - All actions operable within 3 taps/gestures
3. **Physical Gestures** - Swipe, drag, and toggle interactions that feel tactile
4. **High Contrast** - Deep black backgrounds with bright accent colors for visibility
5. **Zero Friction** - No unnecessary confirmations or complex flows

## Architecture

### Navigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RootNavigator                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              OnboardingNavigator (if !onboarded)        ││
│  │  - WelcomeScreen                                        ││
│  │  - PhoneAuthScreen                                      ││
│  │  - BusinessSetupScreen                                  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              TabNavigator (if onboarded)                ││
│  │  ┌─────────┐  ┌─────────────┐  ┌──────────────┐        ││
│  │  │  Home   │  │  Catalogue  │  │  My Account  │        ││
│  │  │ (Tab 1) │  │   (Tab 2)   │  │   (Tab 3)    │        ││
│  │  └─────────┘  └─────────────┘  └──────────────┘        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Screen Architecture

```
Tab 1: HomeScreen (Command Center)
├── RevenueBlock (Today's Earnings - Calculator Font)
├── ChaiBreakToggle (Emergency Stop Widget)
├── AppointmentCardList (Today's Schedule)
│   └── AppointmentCard (Time | Customer/Service | Status)
├── FloatingRequestCard (WhatsApp Booking - Swipeable)
└── FloatingActionButton (+ Manual Slot)

Tab 2: CatalogueScreen (Service Menu)
├── ServiceCardList
│   └── ServiceCard (Name, Price, Duration, Active Toggle)
└── AddServiceModal (Calculator Font for Price Input)

Tab 3: MyAccountScreen (History & Data)
├── RevenueSummary (Weekly/Monthly)
├── BookingHistoryList
│   └── BookingHistoryCard (Date, Service, Amount, Payment Icon)
└── ShareReportButton
```

### Component Hierarchy

```
src/
├── components/
│   ├── high-strength/
│   │   ├── CalculatorText.tsx       # Massive bold number display
│   │   ├── ChaiBreakToggle.tsx      # Emergency stop switch
│   │   ├── RevenueBlock.tsx         # Today's earnings widget
│   │   ├── AppointmentCard.tsx      # Schedule card with status
│   │   ├── FloatingRequestCard.tsx  # Swipeable WhatsApp request
│   │   ├── ImpactZonePresets.tsx    # HAIRCUT/SHAVE/COMBO/OTHER buttons
│   │   ├── CheckoutDrawer.tsx       # Drag-to-pay checkout
│   │   ├── RevenueBurst.tsx         # Celebration animation
│   │   └── PaymentTarget.tsx        # CASH/BANK drop targets
│   └── ui/
│       ├── SwipeableCard.tsx        # Base swipe gesture component
│       ├── DraggableAmount.tsx      # Draggable price component
│       └── HapticButton.tsx         # Button with haptic feedback
├── screens/
│   └── main/
│       ├── HomeScreen.tsx           # Command Center (Tab 1)
│       ├── CatalogueScreen.tsx      # Service Menu (Tab 2)
│       └── MyAccountScreen.tsx      # History (Tab 3)
└── hooks/
    ├── useHaptics.ts                # Haptic feedback hook
    ├── useRealtimeBookings.ts       # Supabase realtime subscription
    └── useRevenueBurst.ts           # Milestone celebration logic
```

## Booking Interface Visual Design

### Today's Appointment Cards (Home Screen) - Timeline View

Since customers come from WhatsApp, we only have phone numbers. The appointment view is a visual timeline/calendar slot system where each slot's background color indicates its state:

```
┌─────────────────────────────────────────────────────────────┐
│  TODAY'S SCHEDULE                           Jan 3, 2026    │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 09:00 ─────────────────────────────────────────────────│││
│  │ ┌─────────────────────────────────────────────────────┐│││
│  │ │ ██████████████████████████████████████████████████ │││ ← GREEN = COMPLETED
│  │ │ +91 98765 43210                                    │││
│  │ │ Haircut • ₹350 • 30min                    ✓ DONE   │││
│  │ └─────────────────────────────────────────────────────┘│││
│  │                                                        │││
│  │ 09:30 ─────────────────────────────────────────────────│││
│  │ ┌─────────────────────────────────────────────────────┐│││
│  │ │ ██████████████████████████████████████████████████ │││ ← GREEN = COMPLETED
│  │ │ +91 87654 32109                                    │││
│  │ │ Beard Trim • ₹200 • 20min                 ✓ DONE   │││
│  │ └─────────────────────────────────────────────────────┘│││
│  │                                                        │││
│  │ 10:00 ─────────────────────────────────────────────────│││
│  │ ┌─────────────────────────────────────────────────────┐│││
│  │ │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │││ ← BLUE = IN PROGRESS
│  │ │ +91 76543 21098                                    │││
│  │ │ Hair Color • ₹600 • 60min              ⏱️ 25min left│││
│  │ └─────────────────────────────────────────────────────┘│││
│  │                                                        │││
│  │ 11:00 ─────────────────────────────────────────────────│││
│  │ ┌─────────────────────────────────────────────────────┐│││
│  │ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │││ ← AMBER = CONFIRMED
│  │ │ +91 65432 10987                                    │││
│  │ │ Combo • ₹500 • 45min                    📅 UPCOMING │││
│  │ └─────────────────────────────────────────────────────┘│││
│  │                                                        │││
│  │ 12:00 ─────────────────────────────────────────────────│││
│  │ ┌─────────────────────────────────────────────────────┐│││
│  │ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │││ ← YELLOW = PENDING
│  │ │ +91 54321 09876                                    │││
│  │ │ Haircut • ₹350 • 30min                  ⏳ WAITING  │││
│  │ └─────────────────────────────────────────────────────┘│││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

SLOT STATES (Background Color):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 GREEN (#00FF00 at 20% opacity)  = COMPLETED - Client served, done
🔵 BLUE (#00AAFF at 20% opacity)   = IN_PROGRESS - Currently serving
🟡 AMBER (#FFB800 at 20% opacity)  = CONFIRMED - Upcoming, ready
🟠 YELLOW (#FFD700 at 20% opacity) = PENDING - Waiting for confirmation
🔴 RED (#FF3333 at 20% opacity)    = CANCELLED - Cancelled/No-show
⬜ EMPTY (Dark surface)            = Available slot
```

### Compact Timeline View (Alternative)

For a more calendar-like feel, slots are shown as colored blocks on a timeline:

```
┌─────────────────────────────────────────────────────────────┐
│  TODAY                                                      │
│                                                             │
│  09:00  ████████████████████████████████  +91 987.. ₹350   │
│         └──────── COMPLETED ────────────┘                   │
│                                                             │
│  09:30  ████████████████  +91 876.. ₹200                   │
│         └── COMPLETED ──┘                                   │
│                                                             │
│  10:00  ████████████████████████████████████████████████   │
│         └────────────── IN PROGRESS (25min left) ─────────┘ │
│                                                             │
│  11:00  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  +91 654.. ₹500     │
│         └────────── UPCOMING ──────────┘                    │
│                                                             │
│  12:00  ▓▓▓▓▓▓░░░░░░░░░░░░░░  +91 543.. ₹350               │
│         └──── PENDING ────┘                                 │
│                                                             │
│  12:30  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  AVAILABLE                     │
│                                                             │
│  01:00  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  AVAILABLE                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Block Width = Duration (visual representation)
- 30min = Short block
- 60min = Long block
- 90min = Extra long block
```

### Tap-to-Expand Slot Detail

When merchant taps a slot, it expands to show full details:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  10:00 AM - 11:00 AM                      🔵 IN PROGRESS││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                                                     │││
│  │  │              ₹ 600                                  │││
│  │  │         (Calculator Font - 48pt)                    │││
│  │  │                                                     │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                         ││
│  │  📱 +91 76543 21098                                    ││
│  │  💇 Hair Color                                         ││
│  │  ⏱️ 60 minutes                                         ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │││
│  │  │ 35 min done                          25 min left   │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                         ││
│  │  ┌─────────────────────┐    ┌─────────────────────┐    ││
│  │  │                     │    │                     │    ││
│  │  │   ✓ COMPLETE        │    │   ✕ CANCEL          │    ││
│  │  │                     │    │                     │    ││
│  │  └─────────────────────┘    └─────────────────────┘    ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

Actions based on state:
- PENDING: [CONFIRM] [DENY]
- CONFIRMED: [START] [CANCEL]
- IN_PROGRESS: [COMPLETE] [CANCEL]
- COMPLETED: [CHECKOUT] (opens checkout drawer)
```

### Floating WhatsApp Request Card

When a new WhatsApp booking arrives, this card slides in from the top with a spring animation:

```
┌─────────────────────────────────────────────────────────────┐
│                    ↑ SWIPE UP TO ACCEPT                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  🟢 NEW BOOKING REQUEST                                 ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                                                     │││
│  │  │              ₹ 650                                  │││
│  │  │         (Calculator Font - 64pt)                    │││
│  │  │                                                     │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                         ││
│  │  📱 +91 98765 43210                                    ││
│  │                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐              ││
│  │  │ 💇 Haircut      │  │ 🧔 Beard Trim   │              ││
│  │  │ ₹350 • 30min    │  │ ₹300 • 25min    │              ││
│  │  └─────────────────┘  └─────────────────┘              ││
│  │                                                         ││
│  │  📅 Today, 2:30 PM                                     ││
│  │  ⏱️ Total: 55 minutes                                  ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                    ↓ SWIPE DOWN TO DENY                     │
└─────────────────────────────────────────────────────────────┘

Interaction:
- Card has subtle glow effect (Salex Green border)
- Swipe hints animate up/down continuously
- As user swipes, card tilts in swipe direction
- Threshold indicator shows when action will trigger
- Heavy haptic on threshold crossing
- Card flies off screen with spring physics on release
```

### Checkout Drawer (Physical Reconcile)

The checkout drawer slides up from the bottom with the total amount as the hero element:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    CHECKOUT                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                                                         ││
│  │                  ₹ 1,250                                ││
│  │            (Calculator Font - 96pt)                     ││
│  │                                                         ││
│  │              ← DRAG TO PAY →                            ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📱 +91 98765 43210 • Today 09:30 AM                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Haircut                                    ₹350         ││
│  │ Beard Trim                                 ₹300         ││
│  │ Hair Color                                 ₹600         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │                     │    │                     │        │
│  │    💵 CASH          │    │    🏦 BANK          │        │
│  │                     │    │                     │        │
│  │   (Drop Target)     │    │   (Drop Target)     │        │
│  │                     │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Interaction:
- Amount is draggable (touch and hold to pick up)
- Amount follows finger with slight lag (physics feel)
- Drop targets glow when amount hovers over them
- CASH target: Green glow
- BANK target: Blue glow
- On successful drop: Heavy haptic + success animation
- Amount "splashes" into the target icon
- Drawer auto-closes after 1 second
```

### Manual Slot Creator (Impact Zone)

When merchant taps the FAB (+), this drawer slides up:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  CREATE BOOKING                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                  ₹ 350                                  ││
│  │            (Calculator Font - 64pt)                     ││
│  │                                                         ││
│  │              30 minutes                                 ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │                     │    │                     │        │
│  │    💇 HAIRCUT       │    │    🧔 SHAVE         │        │
│  │      ₹350           │    │      ₹200           │        │
│  │                     │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │                     │    │                     │        │
│  │    ✂️ COMBO         │    │    📝 OTHER         │        │
│  │      ₹500           │    │      Custom         │        │
│  │                     │    │                     │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Customer Name (optional)                               ││
│  │  ________________________________________________       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │              ✓ BOOK NOW                                 ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘

Interaction:
- Preset buttons are MASSIVE (minimum 80pt touch target)
- Tapping a preset:
  1. Light haptic feedback
  2. Button scales down briefly (press effect)
  3. Price animates into the display area
  4. Button gets selected state (green border)
- Multiple presets can be selected (additive)
- Price updates in real-time as selections change
- "OTHER" opens a custom price input with calculator keyboard
- "BOOK NOW" button pulses when ready
```

### Revenue Burst Animation

When daily revenue crosses a milestone:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                    ₹ 5,000                                  │
│              (Calculator Font - 128pt)                      │
│                   SALEX GREEN                               │
│                                                             │
│                  🎉 MILESTONE! 🎉                           │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Animation Sequence (2 seconds):
1. Screen flashes Salex Green (0.1s)
2. Revenue number scales from 0 to full size (0.3s)
3. Number pulses 3 times with heavy haptics (0.9s)
4. Confetti particles burst from number (0.5s)
5. Fade back to normal view (0.2s)
```

### Status Color System

```
PENDING     → #FFB800 (Amber)     - Waiting for action
CONFIRMED   → #00FF00 (Green)     - Ready to serve
IN_PROGRESS → #00AAFF (Blue)      - Currently serving
COMPLETED   → #00FF00 (Green)     - Done, ready for checkout
CANCELLED   → #FF3333 (Red)       - Cancelled/Rejected
NO_SHOW     → #888888 (Gray)      - Customer didn't arrive
```

### Card Elevation & Shadows

```
Level 0 (Flat):     No shadow - Background elements
Level 1 (Raised):   2dp shadow - Cards, buttons
Level 2 (Floating): 8dp shadow - Floating request card
Level 3 (Modal):    16dp shadow - Drawers, modals

Shadow Color: rgba(0, 255, 0, 0.1) - Subtle green tint
```

## Components and Interfaces

### CalculatorText Component

```typescript
interface CalculatorTextProps {
  value: number | string;
  prefix?: string;           // e.g., "₹"
  suffix?: string;           // e.g., "min"
  size?: 'sm' | 'md' | 'lg' | 'xl';  // 32pt, 48pt, 64pt, 96pt
  color?: string;            // Default: Salex Green for money
  animated?: boolean;        // Enable count-up animation
}

// Size mapping
const CALCULATOR_SIZES = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};
```

### ChaiBreakToggle Component

```typescript
interface ChaiBreakToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
}

// Visual states:
// - Active (ON): Normal background, green indicator
// - Inactive (OFF): Muted red background, red indicator
```

### FloatingRequestCard Component

```typescript
interface FloatingRequestCardProps {
  booking: PendingBooking;
  onAccept: (bookingId: string) => Promise<void>;
  onDeny: (bookingId: string) => Promise<void>;
}

interface PendingBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  services: Array<{
    name: string;
    price: number;
    duration: number;
  }>;
  totalPrice: number;
  totalDuration: number;
  requestedTime: string;
  createdAt: string;
}

// Gesture behavior:
// - SWIPE UP (>100px): Accept booking, fly off top
// - SWIPE DOWN (>100px): Deny booking, drop off bottom
// - Haptic feedback on threshold crossing
```

### CheckoutDrawer Component

```typescript
interface CheckoutDrawerProps {
  booking: CompletedBooking;
  onCheckout: (bookingId: string, paymentMethod: 'CASH' | 'BANK') => Promise<void>;
  onClose: () => void;
}

// Drag behavior:
// - Amount displayed in Calculator Font at center
// - CASH icon on left, BANK icon on right at bottom
// - Drag amount to either target to complete
// - Heavy haptic on successful drop
```

### ImpactZonePresets Component

```typescript
interface ImpactZonePresetsProps {
  presets: ServicePreset[];
  onSelect: (preset: ServicePreset) => void;
}

interface ServicePreset {
  id: string;
  label: string;           // "HAIRCUT", "SHAVE", "COMBO", "OTHER"
  price: number;
  duration: number;
  icon?: string;
}

// Layout: 2x2 grid of massive buttons
// On tap: Show price in Calculator Font, trigger light haptic
```

## Data Models

### Theme Configuration

```typescript
// High-Strength Color Palette
const HighStrengthColors = {
  // Primary backgrounds
  BACKGROUND: '#000000',           // Deep Black
  SURFACE: '#0A0A0A',              // Slightly lighter black
  SURFACE_ELEVATED: '#141414',     // Card backgrounds
  
  // Text colors
  TEXT_PRIMARY: '#FFFFFF',         // High-Vis White
  TEXT_SECONDARY: '#888888',       // Muted gray
  TEXT_TERTIARY: '#555555',        // Very muted
  
  // Accent colors
  SALEX_GREEN: '#00FF00',          // Money/Success
  MUTED_RED: '#331111',            // Closed/Inactive background
  ALERT_RED: '#FF3333',            // Error/Deny
  
  // Status colors
  STATUS_PENDING: '#FFB800',       // Amber
  STATUS_CONFIRMED: '#00FF00',     // Green
  STATUS_IN_PROGRESS: '#00AAFF',   // Blue
  STATUS_COMPLETED: '#00FF00',     // Green
  STATUS_CANCELLED: '#FF3333',     // Red
};

// Calculator Font Configuration
const CalculatorTypography = {
  // Use system condensed bold or custom font
  fontFamily: 'System',  // Or 'RobotoCondensed-Bold'
  fontWeight: '900',
  
  sizes: {
    sm: { fontSize: 32, lineHeight: 38 },
    md: { fontSize: 48, lineHeight: 56 },
    lg: { fontSize: 64, lineHeight: 72 },
    xl: { fontSize: 96, lineHeight: 104 },
  },
};
```

### API Response Types

```typescript
// Business response from GET /api/v1/businesses/me
interface BusinessResponse {
  success: boolean;
  data: {
    business: {
      id: string;
      name: string;
      phoneNumber: string;
      routingCode: string;
      hoursOfOperation: Record<string, { open: string; close: string; closed: boolean }>;
      maxConcurrentBookings: number;
      isAcceptingOrders: boolean;
      services: Service[];
      createdAt: string;
      updatedAt: string;
    };
  };
}

// Services response from GET /api/v1/businesses/:businessId/services
interface ServicesResponse {
  success: boolean;
  data: {
    services: Array<{
      id: string;
      businessId: string;
      name: string;
      description: string | null;
      price: number;
      durationMinutes: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

// Bookings response from GET /api/v1/businesses/:businessId/bookings
interface BookingsResponse {
  success: boolean;
  data: {
    bookings: Booking[];
  };
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

### Local State Models

```typescript
// Chai-Break state (persisted locally)
interface ChaiBreakState {
  isActive: boolean;
  lastToggled: string;  // ISO timestamp
}

// Revenue tracking
interface RevenueState {
  todayTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  lastMilestoneHit: number;
  milestoneThreshold: number;  // Default: 5000 (₹5,000)
}

// Pending request queue
interface RequestQueueState {
  pendingRequests: PendingBooking[];
  currentRequest: PendingBooking | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Calculator Text Font Size Enforcement

*For any* numeric value displayed using the CalculatorText component, the font size SHALL be at least 48pt (the 'md' size), ensuring high visibility for all monetary and critical numeric displays.

**Validates: Requirements 2.5**

### Property 2: Chai-Break State UI Consistency

*For any* Chai-Break toggle state change, the UI SHALL consistently reflect the state: when isActive is false, the background SHALL be muted red and new booking requests SHALL NOT be displayed; when isActive is true, the background SHALL be normal and booking requests SHALL be displayed.

**Validates: Requirements 3.4, 3.5, 10.2, 10.3, 10.4**

### Property 3: Swipe Gesture Booking Actions

*For any* FloatingRequestCard with a pending booking, a swipe up gesture exceeding the threshold SHALL trigger the onAccept callback and call the confirm API endpoint, while a swipe down gesture exceeding the threshold SHALL trigger the onDeny callback and call the cancel API endpoint.

**Validates: Requirements 4.3, 4.4, 4.6, 4.7**

### Property 4: Service API Integration

*For any* service operation (list, create, update), the Merchant_App SHALL call the correct Backend_API endpoint: GET /businesses/{businessId}/services for listing, POST /businesses/{businessId}/services for creating, and PUT /services/{serviceId} for updating.

**Validates: Requirements 5.4, 5.5, 5.6**

### Property 5: Checkout Drag-to-Pay Actions

*For any* checkout drawer interaction, dragging the amount to the CASH target SHALL record payment as 'CASH' and dragging to the BANK target SHALL record payment as 'BANK', both calling the complete API endpoint with the correct payment method.

**Validates: Requirements 8.4, 8.5, 8.6**

### Property 6: Revenue Burst Milestone Trigger

*For any* revenue update that causes the daily total to cross the milestone threshold, the Revenue_Burst animation SHALL be triggered exactly once per threshold crossing.

**Validates: Requirements 9.1**

### Property 7: Chai-Break State Persistence

*For any* Chai-Break toggle action, the state SHALL be persisted to local storage and restored on app restart, maintaining consistency between sessions.

**Validates: Requirements 10.5**

### Property 8: API Response Handling

*For any* API response from the Backend_API, the Merchant_App SHALL correctly extract data from the response format `{success: boolean, data: {entity: T}, message: string}`, handling both success and error cases appropriately.

**Validates: Requirements 11.12**

### Property 9: Haptic Feedback Triggers

*For any* user interaction requiring haptic feedback (swipe actions, checkout completion, toggle switches, preset button taps), the appropriate haptic intensity SHALL be triggered: heavy for swipes and checkout, medium for toggles, light for button taps.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

### Property 10: Impact Zone Preset Selection

*For any* preset button tap in the slot creator drawer, the corresponding service price SHALL be immediately displayed in Calculator-style font, and tapping a different preset SHALL update the displayed price.

**Validates: Requirements 7.3**

## Error Handling

### API Error Handling

```typescript
// Centralized error handling for API responses
interface ApiError {
  code: string;
  message: string;
  status?: number;
}

// Error display strategy
const handleApiError = (error: ApiError) => {
  // Show toast with user-friendly message
  // Log detailed error for debugging
  // Specific handling for:
  // - 401: Redirect to login
  // - 404: Show "not found" state
  // - 500: Show "try again" message
  // - Network errors: Show offline indicator
};
```

### Gesture Error Handling

```typescript
// Swipe gesture validation
const validateSwipeGesture = (translationY: number, threshold: number) => {
  // Ensure gesture exceeds threshold before triggering action
  // Provide visual feedback during gesture
  // Reset position if gesture cancelled
};

// Drag-to-pay validation
const validateDragTarget = (position: Position, targets: Target[]) => {
  // Check if drop position overlaps with valid target
  // Highlight target when draggable is over it
  // Return to origin if dropped outside targets
};
```

### Real-time Connection Handling

```typescript
// Supabase Realtime connection management
const handleRealtimeConnection = {
  onConnect: () => {
    // Update connection status indicator
    // Resume normal operation
  },
  onDisconnect: () => {
    // Show offline indicator
    // Queue local actions for sync
  },
  onReconnect: () => {
    // Sync queued actions
    // Refresh pending bookings
  },
};
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific component behaviors and edge cases:

1. **CalculatorText Component**
   - Renders correct font size for each size variant
   - Formats numbers with correct prefix/suffix
   - Handles edge cases (0, negative, very large numbers)

2. **ChaiBreakToggle Component**
   - Renders correct visual state for on/off
   - Calls onToggle callback with correct value
   - Triggers haptic feedback on toggle

3. **FloatingRequestCard Component**
   - Renders booking details correctly
   - Handles swipe gestures in both directions
   - Calls correct callbacks on gesture completion

4. **CheckoutDrawer Component**
   - Displays amount in Calculator font
   - Renders both payment targets
   - Handles drag-to-target interactions

5. **API Service Functions**
   - Calls correct endpoints with correct parameters
   - Handles response format correctly
   - Handles error responses appropriately

### Property-Based Tests

Property-based tests will verify universal properties across many inputs:

1. **Calculator Text Sizing** - Verify font size >= 48pt for all size variants
2. **Chai-Break State Consistency** - Verify UI reflects state correctly for all toggle sequences
3. **Swipe Gesture Actions** - Verify correct callbacks for all swipe directions and magnitudes
4. **API Integration** - Verify correct endpoints called for all operation types
5. **Checkout Actions** - Verify correct payment method recorded for all drag targets
6. **Revenue Burst Trigger** - Verify animation triggers exactly once per threshold crossing
7. **State Persistence** - Verify state survives app restart for all state values
8. **Haptic Feedback** - Verify correct haptic intensity for all interaction types

### Integration Tests

Integration tests will verify end-to-end flows:

1. **Booking Accept Flow** - WhatsApp request → Swipe up → API call → UI update
2. **Checkout Flow** - Select booking → Open drawer → Drag to target → API call → Success
3. **Service Management Flow** - View list → Edit service → Save → API call → List refresh
4. **Chai-Break Flow** - Toggle off → Background change → Requests hidden → Toggle on → Resume

### Testing Framework

- **Unit/Property Tests**: Jest with React Native Testing Library
- **Property-Based Testing**: fast-check library
- **Gesture Testing**: React Native Gesture Handler test utilities
- **API Mocking**: MSW (Mock Service Worker) for API mocking
- **Minimum iterations**: 100 per property test

