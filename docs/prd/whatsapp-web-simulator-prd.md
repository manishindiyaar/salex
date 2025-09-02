# Salex WhatsApp Web Simulator Foundation - Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Analysis Source
- **Document-project output available at**: `/Users/manish/Desktop/salex/docs/architecture/` (comprehensive architecture documentation exists)
- **IDE-based fresh analysis**: Current project analysis based on existing codebase
- **User-provided information**: WhatsApp Web Simulator requirements and strategic context

### Current Project State
The Salex project is a salon booking platform currently at **Story 1.7 completion** with a robust foundation including:

**Prerequisite: 4-Digit Business Identifier System (Story 1.8)**
- This WhatsApp Web Simulator depends on the completion of the 4-Digit Business Identifier System
- See separate PRD: `/docs/prd/4-digit-business-identifier-prd.md`
- The 4-digit routing codes (1234 format) are essential for customer business discovery
- Story 1.8 must be completed before beginning WhatsApp simulator implementation

**Completed Infrastructure (Stories 1.1-1.5):**
- NestJS backend with PostgreSQL database and Prisma ORM
- Clerk JWT authentication with secure business ownership validation
- Business profile management with hours and service management
- Time slot calculation service for booking availability
- React Native merchant app with complete navigation structure

**Ready for Review (Stories 1.6-1.7):**
- Comprehensive service management CRUD operations
- Daily analytics with booking and revenue tracking
- Full API testing suite with Postman collections

**Current Tech Stack:**
- **Backend**: NestJS 10.3.x, TypeScript 5.5.x, Prisma 5.15.x, PostgreSQL 16.3
- **Frontend**: React Native 0.74.x, React Native Paper 5.12.x, Zustand 4.5.x
- **Authentication**: Clerk 5.1.x with ClerkAuthGuard
- **Testing**: Jest 29.7.x, Supertest, comprehensive curl testing scripts

### Available Documentation Analysis

#### Available Documentation
- ✅ **Tech Stack Documentation** (from document-project analysis)
- ✅ **Source Tree/Architecture** (comprehensive 20-section architecture docs)
- ✅ **Coding Standards** (detailed conventions and patterns)
- ✅ **API Documentation** (Postman collections with 47+ endpoints)
- ✅ **External API Documentation** (Clerk integration patterns)
- ✅ **Technical Debt Documentation** (existing constraints and workarounds)
- ❌ **UX/UI Guidelines** (basic React Native Paper usage only)

**Using existing project analysis from comprehensive architecture documentation in `/docs/architecture/` spanning 20 detailed sections.**

### Enhancement Scope Definition

#### Enhancement Type
- ✅ **New Feature Addition** - Adding WhatsApp Web Simulator ecosystem
- ✅ **Integration with New Systems** - WhatsApp Cloud API compatible infrastructure
- ✅ **Performance/Scalability Improvements** - Real-time notifications via WebSocket + FCM

#### Enhancement Description
**Webhook-Based WhatsApp Web Simulator**: Create a simple HTML/CSS/JS UI that sends WhatsApp Cloud API compatible webhook payloads to the existing `/webhooks/whatsapp` endpoint. This approach reuses all existing business logic, routing systems, and conversation flows while providing a realistic testing environment. The simulator will be implemented in a separate directory (`/whatsapp-simulator/`) to avoid mixing with production WhatsApp code.

#### Impact Assessment
- ✅ **Major Impact (architectural changes required)** - New customer authentication system, dual JWT architecture, real-time messaging infrastructure, and WebSocket integration

### Goals and Background Context

#### Goals
- Enable comprehensive booking flow testing in a controlled WhatsApp-like environment without external API dependencies
- Implement 4-digit business number smart routing (1234 format) for instant business identification
- Create customer phone-based authentication with 2-hour JWT sessions parallel to existing Clerk merchant authentication
- Build WhatsApp Cloud API compatible message structure for seamless future migration
- Establish real-time notification system via serverless WebSocket + FCM for instant message delivery
- Provide mock WhatsApp Web UI that accurately simulates actual WhatsApp user experience

#### Background Context
**Strategic Context**: The Salex platform has successfully established its core booking infrastructure (Stories 1.1-1.7) but requires a bridge to WhatsApp integration that doesn't depend on immediate external API approval or complex Facebook Business verification. The WhatsApp Web Simulator provides this bridge by creating an exact replica of WhatsApp's messaging interface and API structure.

**Business Need**: Salon owners need to test complete customer booking flows through a familiar WhatsApp-like interface before committing to the complexity of official WhatsApp Business API integration. This simulator enables complete end-to-end testing while maintaining future compatibility with real WhatsApp integration.

#### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-02 | 1.0 | Initial WhatsApp Web Simulator Foundation PRD creation | Claude (Product Manager) |
| 2025-08-02 | 1.1 | Updated to reference separate 4-digit identifier PRD dependency | Claude (Product Manager) |

## Requirements

### Functional Requirements

**FR1**: The system shall integrate with the completed 4-digit business identifier system (Story 1.8) to route customer messages using  1234 format codes to the correct business context.

**FR2**: The system shall provide customer phone-based authentication that generates 2-hour JWT tokens without requiring app installation or Clerk accounts.

**FR3**: The system shall create WhatsApp Cloud API compatible message structures for all customer-business interactions to ensure seamless future migration.

**FR4**: The system shall implement a mock WhatsApp Web UI that accurately replicates the actual WhatsApp interface including contact lists, message bubbles, typing indicators, and message status indicators.

**FR5**: The system shall integrate with the existing Salex booking system to enable complete appointment booking flows through WhatsApp-style messaging.

**FR6**: The system shall implement efficient message delivery using simple HTTP polling (2-3 second intervals) for the mock UI testing environment.

**FR7**: The system shall maintain a conversation state machine that handles booking workflow progression from initial contact through appointment confirmation.

**FR8**: The system shall provide automated business responses that guide customers through available services, time slots, and booking confirmation without merchant intervention.

**FR9**: The system shall support message templates that mirror WhatsApp Business API approved message formats for testing official integration scenarios.

**FR10**: The system shall implement conversation persistence that maintains full message history and booking context across customer sessions.

### Non Functional Requirements

**NFR1**: The system must maintain sub-500ms response times for message delivery to simulate actual WhatsApp performance characteristics.

**NFR2**: The system must support concurrent conversations for up to 100 customers per business without performance degradation.

**NFR3**: The mock WhatsApp Web UI must be visually indistinguishable from actual WhatsApp Web to provide authentic testing experience.

**NFR4**: The system must ensure data persistence and recovery for all conversations and booking states to prevent data loss during testing.

**NFR5**: Customer authentication JWT tokens must automatically refresh within the 2-hour window to maintain seamless conversation continuity.

**NFR6**: The system must maintain exact compatibility with WhatsApp Cloud API message schemas to enable zero-code migration to real WhatsApp integration.

**NFR7**: Message polling must maintain sub-3 second message delivery with efficient caching and minimal bandwidth usage.

**NFR8**: The system must handle phone number validation and formatting according to international standards (E.164 format).

### Compatibility Requirements

**CR1**: **Existing API Compatibility** - All existing merchant APIs (business management, services, analytics) must remain fully functional without any breaking changes to current merchant app functionality.

**CR2**: **Database Schema Compatibility** - New customer and conversation tables must integrate seamlessly with existing Business, Service, and Booking models without requiring migration of existing data.

**CR3**: **UI/UX Consistency** - Mock WhatsApp Web interface must maintain visual consistency with actual WhatsApp Web to ensure realistic testing scenarios for merchants.

**CR4**: **Authentication Integration** - Dual authentication system (Clerk JWT for merchants + Customer JWT for phone-based auth) must coexist without conflicts or security vulnerabilities.

## User Interface Enhancement Goals

### Integration with Existing UI
The WhatsApp Web Simulator will integrate with the existing React Native merchant app by adding a new "WhatsApp Simulator" section that allows merchants to:
- View and test customer conversations in a WhatsApp Web replica interface
- Monitor booking flows initiated through the simulator
- Configure automated response templates and business settings
- Access conversation analytics and customer interaction metrics

The simulator web interface will be a separate React web application that replicates WhatsApp Web's exact visual design, ensuring merchants can test customer experiences in a realistic environment.

### Modified/New Screens and Views
**New Merchant App Screens:**
- **WhatsApp Simulator Dashboard** - Overview of active conversations and simulator status
- **Conversation Management** - Real-time view of customer conversations with booking context
- **Template Configuration** - Setup automated responses and business information
- **Simulator Analytics** - Customer interaction metrics and booking conversion tracking

**New Web Simulator Interface:**
- **WhatsApp Web Replica** - Pixel-perfect recreation of WhatsApp Web interface
- **Customer Contact Management** - Automatic contact creation based on phone numbers
- **Message Threading** - Complete conversation history with booking workflow states
- **Business Directory** - 4-digit code lookup and business information display

### UI Consistency Requirements
- Mock WhatsApp Web interface must replicate actual WhatsApp Web visual design including colors, fonts, spacing, and interaction patterns
- Merchant app integration must follow existing React Native Paper design system
- Message bubbles, status indicators, and typing animations must match WhatsApp's exact behavior
- Business response templates must display in WhatsApp's standard business message format

## Technical Constraints and Integration Requirements

### Existing Technology Stack
**Languages**: TypeScript 5.5.x (backend and frontend)
**Frameworks**: 
- Backend: NestJS 10.3.x with Prisma 5.15.x ORM
- Mobile: React Native 0.74.x with React Native Paper 5.12.x
- Web Simulator: React 18.x with Material-UI (to be added)
**Database**: PostgreSQL 16.3 with existing business, service, and booking models
**Infrastructure**: Supabase hosting with real-time subscriptions capability
**External Dependencies**: Clerk 5.1.x authentication

### Integration Approach
**Database Integration Strategy**: 
- Add new Customer, Conversation, and Message tables with foreign key relationships to existing Business model
- Maintain existing booking workflow but add WhatsApp conversation context
- Use PostgreSQL JSONB for message content storage to support rich WhatsApp message types

**API Integration Strategy**:
- **Webhook Reuse Approach**: Mock UI sends WhatsApp Cloud API compatible payloads to existing `/webhooks/whatsapp` endpoint
- **Centralized Processing**: All message processing, business routing, and conversation flow handled by existing webhook logic
- **Response Storage**: Extend existing webhook handler to store responses for mock UI polling retrieval
- **Environment Flag**: `WHATSAPP_MODE=simulator` to distinguish between mock and real WhatsApp responses
- **Separate Implementation**: All simulator-specific code isolated in `/apps/api/src/modules/whatsapp-simulator/`
- No changes to existing `/apps/api/src/modules/whatsapp/` production code

**Frontend Integration Strategy**:
- **Simple HTML/CSS/JS UI**: Single-file implementation in `/WhatsappMockUI/` directory
- **Mobile-like Interface**: WhatsApp-style chat interface with verified business account "Salex"
- **Single Chat Focus**: No contacts list, no extra features - just one open chat conversation
- **Webhook Payload Generation**: UI creates and sends WhatsApp Cloud API compatible JSON to `/webhooks/whatsapp`
- **Simple Polling**: Basic JavaScript polling to retrieve responses for seamless conversation flow

**Testing Integration Strategy**:
- Extend existing Jest/Supertest patterns for new simulator endpoints
- Add Playwright E2E tests for WhatsApp Web replica interface
- Create comprehensive curl testing scripts for customer authentication and messaging flows
- Maintain existing Postman collection organization with new "WhatsApp Simulator" section

### Code Organization and Standards
**File Structure Approach**: 
```
apps/api/src/modules/
├── whatsapp/                    # Production WhatsApp integration (UNCHANGED)
└── whatsapp-simulator/          # Simulator-specific code (ISOLATED)
    ├── mock-response.service.ts # Store/retrieve responses for UI polling
    ├── webhook-enhancer.service.ts # Extend webhook with simulator support
    └── simulator.controller.ts  # Polling endpoints for mock UI

WhatsappMockUI/                  # Simple HTML/CSS/JS interface
├── index.html                   # Single chat interface
├── style.css                    # WhatsApp-like styling
├── script.js                    # Webhook payload generation + polling
└── README.md                    # Setup and usage instructions

apps/MerchantApp/src/
├── screens/WhatsAppSimulator/   # Future: Monitor simulator conversations
└── navigation/                  # Future: Add simulator nav link
```

**Naming Conventions**: 
- Follow existing PascalCase for TypeScript classes and React components
- Use kebab-case for API routes: `/api/v1/simulator/conversations/{id}/messages`
- Database tables: customer_auth, conversations, simulator_messages
- Environment variables: WHATSAPP_SIMULATOR_ENABLED, CUSTOMER_JWT_SECRET

**Coding Standards**: 
- All shared types in `packages/shared-types` including Customer, Conversation, and Message interfaces
- Database access through injected PrismaService following existing patterns
- Customer authentication using separate JWT strategy parallel to existing Clerk implementation
- WebSocket handling using Supabase real-time with fallback mechanisms

**Documentation Standards**: 
- Extend existing Postman collection with comprehensive simulator testing scenarios
- Update architecture documentation with dual authentication and WebSocket integration patterns
- Create simulator-specific setup guide for local development and testing

### Deployment and Operations
**Build Process Integration**: 
- Add WhatsApp Web Simulator build to existing `turbo.json` workspace configuration
- Extend existing Vercel deployment to include web simulator as separate app
- Maintain existing environment variable management for simulator configuration

**Deployment Strategy**: 
- Deploy web simulator as subdomain: `simulator.salex.app` or path: `/simulator`
- Use existing PostgreSQL infrastructure for message storage with efficient polling queries
- Extend existing database with new tables without requiring downtime migration

**Monitoring and Logging**: 
- Extend existing logging patterns to include customer authentication and message delivery metrics
- Add conversation analytics to existing daily analytics system
- Implement efficient polling with caching to minimize database load

**Configuration Management**: 
- Add simulator-specific environment variables to existing `.env` structure
- Create feature flag system for gradually enabling simulator functionality
- Maintain existing development/staging/production environment separation

## Production-Ready Implementation Architecture

### Centralized WhatsApp Module Design

The WhatsApp module will be designed as a **production-ready system** that can handle both simulator testing and real WhatsApp integration without code changes.

#### Core Architecture Principle
```typescript
// Single endpoint handles both simulator and real WhatsApp
@Controller('api/v1/whatsapp')
export class WhatsAppController {
  
  @Post('webhook')
  async handleIncomingMessage(@Body() payload: WhatsAppWebhookPayload) {
    // Works for both:
    // 1. Real WhatsApp webhook calls
    // 2. Simulator mock message sends
    return await this.whatsappService.processMessage(payload);
  }
  
  @Get('messages/:sessionId')
  async getMessages(@Param('sessionId') sessionId: string) {
    // Polling endpoint for simulator UI
    return await this.whatsappService.getSessionMessages(sessionId);
  }
}
```

#### Message Processing Flow
```typescript
interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;           // Customer phone number
          id: string;             // Message ID
          timestamp: string;
          type: "text" | "interactive";
          text?: { body: string };
          interactive?: {
            type: "button_reply" | "list_reply";
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }>;
      };
      field: "messages";
    }>;
  }>;
}
```

#### Production-Ready Service Implementation
```typescript
@Injectable()
export class WhatsAppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAuth: CustomerAuthService,
    private readonly businessService: BusinessService,
    private readonly bookingService: BookingService
  ) {}

  async processMessage(payload: WhatsAppWebhookPayload): Promise<WhatsAppResponse> {
    // 1. Extract customer phone and message content
    const message = this.extractMessage(payload);
    const customerPhone = message.from;
    const messageText = message.text?.body || '';
    
    // 2. Parse 1234 business routing code (requires completed Story 1.8)
    const businessCode = this.parseBusinessCode(messageText);
    
    if (businessCode) {
      // 3. Create new customer session
      const session = await this.createCustomerSession(customerPhone, businessCode);
      return await this.sendWelcomeMessage(session);
    }
    
    // 4. Continue existing conversation
    const session = await this.getActiveSession(customerPhone);
    return await this.handleConversationMessage(session, message);
  }
  
  private parseBusinessCode(text: string): string | null {
    // Matches: "BOOK_AT_1234", "BOOK_1234", "1234", "book at 1234"
    const patterns = [
      /BOOK[_\s]+AT[_\s]+(\d{3,4})/i,
      /BOOK[_\s]+(\d{3,4})/i,
      /(\d{3,4})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
  
  private async createCustomerSession(phone: string, businessCode: string): Promise<CustomerSession> {
    // 1. Validate business exists (using Story 1.8 routing system)
    const business = await this.businessService.findByRoutingCode(businessCode);
    if (!business) throw new NotFoundException(`Business S${businessCode} not found`);
    
    // 2. Create or update customer record
    const customer = await this.customerAuth.findOrCreateCustomer(phone);
    
    // 3. Generate customer JWT token (2-hour expiry)
    const sessionToken = await this.customerAuth.generateSessionToken(customer.id, business.id);
    
    // 4. Create conversation record
    const conversation = await this.prisma.conversation.create({
      data: {
        customerId: customer.id,
        businessId: business.id,
        sessionToken,
        state: 'GREETING',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      }
    });
    
    return { customer, business, conversation, sessionToken };
  }
  
  private async sendWelcomeMessage(session: CustomerSession): Promise<WhatsAppResponse> {
    const business = session.business;
    
    // Create WhatsApp-compatible welcome message
    const welcomeMessage: WhatsAppInteractiveMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: session.customer.phoneNumber,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: `Welcome to ${business.name}! 👋\n\n📍 ${business.address}\n⏰ Open: ${this.getBusinessHours(business)}\n\nHow can we help you today?`
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: { id: "view_services", title: "View Services" }
            },
            {
              type: "reply", 
              reply: { id: "book_appointment", title: "Book Now" }
            },
            {
              type: "reply",
              reply: { id: "business_info", title: "Business Info" }
            }
          ]
        }
      }
    };
    
    // Store message for polling retrieval
    await this.storeMessage(session.conversation.id, 'OUTGOING', welcomeMessage);
    
    return this.formatResponse(welcomeMessage);
  }
  
  // For simulator polling
  async getSessionMessages(sessionId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId: sessionId },
      orderBy: { createdAt: 'asc' },
      include: { conversation: true }
    });
    
    return messages.map(msg => ({
      id: msg.id,
      type: msg.type,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      direction: msg.direction
    }));
  }
}
```

#### Database Schema for Production
```sql
-- Customer authentication
CREATE TABLE customers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Business routing codes (implemented in Story 1.8)
-- This table modification completed in 4-digit business identifier system
-- routing_code field already exists from Story 1.8 implementation

-- Customer sessions
CREATE TABLE customer_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR REFERENCES customers(id),
  business_id VARCHAR REFERENCES businesses(id),
  session_token VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR REFERENCES customers(id),
  business_id VARCHAR REFERENCES businesses(id),
  session_token VARCHAR,
  state VARCHAR DEFAULT 'GREETING', -- GREETING, SERVICE_SELECTION, TIME_SELECTION, BOOKING_CONFIRMATION
  context JSONB, -- Store booking progress
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages (WhatsApp compatible)
CREATE TABLE messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR REFERENCES conversations(id),
  whatsapp_message_id VARCHAR, -- For real WhatsApp integration
  direction VARCHAR NOT NULL, -- 'INCOMING' | 'OUTGOING'
  type VARCHAR NOT NULL, -- 'text' | 'interactive' | 'image'
  content JSONB NOT NULL, -- Full WhatsApp message payload
  status VARCHAR DEFAULT 'sent', -- sent, delivered, read
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Webhook-Based Simulator Implementation (NEW APPROACH)
```typescript
// Mock WhatsApp Web UI - Webhook-Based Approach
class WhatsAppSimulator {
  private customerPhone: string = '+1234567890'; // Mock customer number
  private pollingInterval: number = 2000; // 2 seconds
  private activePolling: boolean = false;
  
  async sendMessage(messageText: string) {
    // Create WhatsApp Cloud API compatible webhook payload
    const webhookPayload = {
      object: "whatsapp_business_account",
      entry: [{
        id: "mock_entry_id",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "+19801441675", // Your business number
              phone_number_id: "mock_phone_number_id"
            },
            messages: [{
              from: this.customerPhone,
              id: `mock_msg_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: "text",
              text: { body: messageText }
            }]
          },
          field: "messages"
        }]
      }]
    };

    // Send to existing webhook endpoint (same as real WhatsApp)
    await fetch('/webhooks/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
  }
  
  async startBusinessConversation(businessCode: string) {
    // Send business routing code to connect to specific business
    await this.sendMessage(`BOOK_AT_S${businessCode}`);
    
    // Start polling for responses
    this.startPolling();
  }
  
  private async startPolling() {
    this.activePolling = true;
    
    while (this.activePolling) {
      try {
        // Poll for responses from mock endpoint
        const responses = await fetch(`/api/v1/whatsapp-simulator/mock-responses?customerPhone=${this.customerPhone}&since=${this.lastPollTime}`);
        const responseData = await responses.json();
        
        if (responseData.success && responseData.data.length > 0) {
          this.updateUI(responseData.data);
          this.lastPollTime = Date.now();
        }
        
        await this.sleep(2000); // Poll every 2 seconds
        
      } catch (error) {
        console.error('Polling error:', error);
        await this.sleep(5000); // Back off on error
      }
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private updateUI(messages: any[]): void {
    // Update chat interface with new messages
    messages.forEach(msg => this.displayMessage(msg));
  }
  
  private createWhatsAppPayload(message: any): WhatsAppWebhookPayload {
    return {
      object: "whatsapp_business_account",
      entry: [{
        id: "mock_entry",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: this.businessPhone,
              phone_number_id: "mock_phone_id"
            },
            messages: [{
              ...message,
              id: `msg_${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: message.text ? "text" : "interactive"
            }]
          },
          field: "messages"
        }]
      }]
    };
  }
}
```

#### Migration Strategy to Real WhatsApp
```typescript
// Environment-based switching
class WhatsAppService {
  private isSimulator = process.env.WHATSAPP_MODE === 'simulator';
  
  async sendMessage(message: WhatsAppMessage): Promise<void> {
    if (this.isSimulator) {
      // Store in database for polling retrieval
      await this.storeMessage(message.conversationId, 'OUTGOING', message);
    } else {
      // Send via real WhatsApp Cloud API
      await this.whatsappCloudAPI.sendMessage({
        messaging_product: "whatsapp",
        to: message.to,
        ...message.content
      });
    }
  }
  
  // Same webhook handler works for both!
  @Post('webhook')
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    // Identical processing for simulator and real WhatsApp
    return await this.processMessage(payload);
  }
}
```

### Risk Assessment and Mitigation
**Technical Risks**: 
- **Risk**: Polling frequency balance between responsiveness and performance
- **Mitigation**: Implement smart polling with longer intervals when inactive, shorter when active

- **Risk**: Customer phone number validation and spam prevention
- **Mitigation**: Implement rate limiting, phone number verification, and conversation throttling

**Integration Risks**: 
- **Risk**: Dual authentication system complexity (Clerk + Customer JWT)
- **Mitigation**: Separate authentication guards and middleware with clear separation of concerns

- **Risk**: Database schema changes affecting existing functionality
- **Mitigation**: Additive-only schema changes with comprehensive migration testing

**Deployment Risks**: 
- **Risk**: WhatsApp Web replica interface copyright concerns
- **Mitigation**: Create visually similar but legally distinct interface design for testing purposes only

- **Risk**: Customer data privacy and GDPR compliance
- **Mitigation**: Implement data retention policies and customer data deletion capabilities

**Mitigation Strategies**: 
- Comprehensive testing environment with staging simulator deployment
- Gradual rollout using feature flags to enable simulator for select businesses
- Automated monitoring and alerting for WebSocket connections and message delivery
- Regular security audits for customer authentication and data handling

## Epic and Story Structure

### Epic Approach
**Epic Structure Decision**: Single comprehensive epic for WhatsApp Web Simulator Foundation with rationale:

This enhancement represents a cohesive feature addition that creates a complete WhatsApp simulation ecosystem. While complex, it delivers maximum value when implemented as an integrated system rather than fragmented pieces. The customer authentication, messaging infrastructure, and UI simulator are interdependent components that must work together to provide the intended testing environment.

**Rationale**: Breaking this into multiple epics would create incomplete functionality that provides no business value until all pieces are complete. A single epic ensures all components are developed with consistent architecture and integration patterns.

## Epic 1.9: WhatsApp Web Simulator Foundation

**Epic Goal**: Create a complete WhatsApp Web simulation environment that enables comprehensive salon booking flow testing through phone-based customer authentication, HTTP polling messaging, and pixel-perfect WhatsApp Web replica interface.

**Prerequisites**: 
- **Story 1.8 (4-Digit Business Identifier System)** must be completed first
- Businesses must have assigned routing codes before simulator implementation
- Refer to `/docs/prd/4-digit-business-identifier-prd.md` for dependency details

**Integration Requirements**: 
- Seamless integration with existing Salex business, service, and booking systems
- Integration with completed 4-digit business routing system (Story 1.8)
- Dual authentication architecture supporting both merchant (Clerk) and customer (phone-based) access
- HTTP polling messaging infrastructure for efficient testing environment
- WhatsApp Cloud API compatible message structures for future migration readiness

### Story 1.9.1: Customer Phone Authentication Foundation

**As a** potential salon customer,
**I want** to authenticate using my phone number in the WhatsApp simulator,
**so that** I can start a conversation with a salon without needing to install an app or create an account.

#### Acceptance Criteria
1. **Phone Number Validation**: System validates and formats phone numbers according to international E.164 standards
2. **SMS Verification**: Customer receives SMS verification code for phone number confirmation (simulated in test environment)
3. **JWT Token Generation**: System generates 2-hour customer JWT tokens with automatic refresh capability
4. **Customer Record Creation**: System creates customer profile with phone number, conversation history, and booking context
5. **Rate Limiting**: System prevents spam by limiting authentication attempts per phone number and IP address
6. **Security Validation**: Customer authentication system operates independently from merchant Clerk authentication without conflicts

#### Integration Verification
- **IV1**: Existing merchant authentication (Clerk) remains fully functional without any performance impact
- **IV2**: Customer authentication endpoints respond within 200ms without affecting existing API performance
- **IV3**: Database customer tables integrate seamlessly with existing Business and Booking models

### Story 1.9.2: WhatsApp Cloud API Compatible Message Structure

**As a** system architect,
**I want** all customer-business messages to use WhatsApp Cloud API compatible schemas,
**so that** future migration to real WhatsApp integration requires zero code changes.

#### Acceptance Criteria
1. **Message Schema Compliance**: All messages follow exact WhatsApp Cloud API JSON structure for text, buttons, and media
2. **Business Message Templates**: System supports WhatsApp Business API approved message template formats
3. **Customer Message Types**: System handles all standard customer message types (text, location, contact, media)
4. **Webhook Simulation**: System simulates WhatsApp webhook payloads for message delivery and status updates
5. **Message Status Tracking**: System implements WhatsApp message status progression (sent, delivered, read)
6. **API Documentation**: Complete API documentation matches WhatsApp Cloud API patterns for easy migration

#### Integration Verification
- **IV1**: Message structures pass WhatsApp Cloud API schema validation without modification
- **IV2**: Existing booking workflow integrates seamlessly with WhatsApp message context
- **IV3**: Message storage and retrieval maintains performance with existing database operations

### Story 1.9.3: HTTP Polling Message System

**As a** salon customer using the mock WhatsApp UI,
**I want** to receive messages with minimal delay through efficient polling,
**so that** the conversation feels responsive while keeping the implementation simple.

#### Acceptance Criteria
1. **Efficient Polling System**: Mock UI polls for new messages every 2-3 seconds with smart interval adjustment
2. **Message Delivery Performance**: Messages appear in UI within 3 seconds of being sent
3. **Bandwidth Optimization**: Polling requests only fetch new messages since last poll to minimize data transfer
4. **Connection Recovery**: Polling continues reliably even with temporary network interruptions
5. **Activity-Based Polling**: Shorter intervals (1s) during active conversations, longer (5s) when idle
6. **Status Indicators**: Mock UI shows sent/delivered status without requiring real-time connections

#### Integration Verification
- **IV1**: Polling system doesn't impact existing API endpoint performance during concurrent use
- **IV2**: Message polling maintains accuracy with existing booking workflow progression
- **IV3**: Database queries for polling are optimized to prevent performance degradation

### Story 1.9.4: Simple WhatsApp Web UI with Webhook Integration (REVISED APPROACH)

**As a** salon customer,
**I want** to interact with businesses through a simple WhatsApp-like interface that sends messages through the existing webhook system,
**so that** I can test booking flows using the same backend logic as real WhatsApp integration.

#### Current Implementation Status
- ✅ **Basic WhatsApp-like interface exists** in `/WhatsappMockUI/` folder
- ✅ **Mobile chat layout** with message bubbles and input area
- ✅ **CSS styling** that mimics WhatsApp design patterns
- ❌ **Webhook payload generation** not implemented
- ❌ **Integration with existing `/webhooks/whatsapp`** endpoint
- ❌ **Response polling system** not connected

#### Acceptance Criteria (REVISED)
1. **Single Chat Interface**: Clean WhatsApp-style chat with verified business account "Salex"
2. **Webhook Integration**: UI generates WhatsApp Cloud API compatible payloads and sends to `/webhooks/whatsapp`
3. **Business Code Entry**: Users can enter routing codes (S1234) to connect with real businesses from database
4. **Message Flow**: Customer messages → Webhook → Business logic → Automated responses → UI polling
5. **Response Polling**: Simple polling mechanism to retrieve and display business responses
6. **No Extra Features**: Focus only on chat - no contacts, no media, no complex UI elements

#### Integration Verification
- **IV1**: Web simulator loads independently without affecting existing merchant app performance
- **IV2**: Message history displays accurately with existing booking context and conversation flow
- **IV3**: Business information integration shows current services and availability from existing APIs

### Story 1.9.5: Conversation State Machine for Booking Workflow

**As a** salon customer,
**I want** the system to guide me through the booking process with automated responses,
**so that** I can complete appointments without waiting for manual business replies.

#### Acceptance Criteria
1. **Workflow State Tracking**: System tracks conversation progress through greeting, service selection, time selection, and confirmation stages
2. **Automated Business Responses**: System sends contextual automated messages based on conversation state and customer inputs
3. **Service Catalog Integration**: Customers can browse and select services directly through WhatsApp-style message interactions
4. **Time Slot Integration**: Available booking times display as interactive buttons within message threads
5. **Booking Confirmation**: Complete booking process creates actual appointments in existing booking system
6. **Error Recovery**: System handles invalid inputs and guides customers back to valid workflow steps

#### Integration Verification
- **IV1**: Automated booking creates valid appointments that appear in existing merchant analytics and management screens
- **IV2**: Service and time slot data remains synchronized with existing business management APIs
- **IV3**: Booking confirmations trigger existing notification systems without conflicts

### Story 1.9.6: Merchant Simulator Dashboard Integration

**As a** salon owner,
**I want** to monitor and manage customer conversations from the WhatsApp simulator within my existing merchant app,
**so that** I can oversee the booking process and intervene when necessary.

#### Acceptance Criteria
1. **Simulator Dashboard**: New section in merchant app displays active conversations, booking status, and customer interactions
2. **Real-Time Conversation View**: Merchants can view live customer conversations with booking context and workflow progress
3. **Manual Intervention**: Merchants can send manual messages or take over automated conversations when needed
4. **Analytics Integration**: Simulator conversations contribute to existing daily analytics (bookings, revenue) with source attribution
5. **Template Management**: Merchants can configure automated response templates and business information
6. **Notification Settings**: Merchants receive notifications for new conversations and completed bookings

#### Integration Verification
- **IV1**: Simulator dashboard integrates seamlessly with existing merchant app navigation and design patterns
- **IV2**: Conversation data contributes accurately to existing business analytics without double-counting
- **IV3**: Manual merchant messages integrate with automated workflow without breaking conversation state

### Story 1.9.7: End-to-End Booking Flow Validation

**As a** salon customer,
**I want** to complete a full appointment booking through the WhatsApp simulator,
**so that** I can verify the entire process works seamlessly from initial contact to confirmed appointment.

#### Acceptance Criteria
1. **Complete Customer Journey**: Customer can discover business via 4-digit code, browse services, select time, and confirm booking
2. **Payment Simulation**: System simulates payment processing without actual charges for complete workflow testing
3. **Appointment Integration**: Completed bookings appear in merchant analytics, booking management, and time slot calculations
4. **Confirmation Messages**: Both customer and merchant receive booking confirmation with appointment details
5. **Cancellation Workflow**: Customers can cancel appointments through WhatsApp interface with proper status updates
6. **Data Consistency**: All booking data remains consistent across simulator interface, merchant app, and backend APIs

#### Integration Verification
- **IV1**: Simulator bookings integrate perfectly with existing time slot availability calculations
- **IV2**: Booking confirmations trigger all existing notification and confirmation systems correctly
- **IV3**: Completed simulator workflow maintains data integrity across all existing business management features