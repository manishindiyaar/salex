export interface User {
    id: string;
    firebaseUid: string;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Business {
    id: string;
    ownerId: string;
    name: string;
    businessType: BusinessType;
    phoneNumber: string;
    address: string;
    hoursOfOperation?: BusinessHours | any;
    routingCode?: string;
    createdAt: Date;
    updatedAt: Date;
    salon?: Salon;
}
export declare enum BusinessType {
    SALON = "SALON"
}
export interface BusinessHours {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
}
export interface DaySchedule {
    open: string;
    close: string;
    closed: boolean;
}
export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
    date: string;
    duration: number;
}
export interface TimeSlotsQuery {
    businessId: string;
    serviceId?: string;
    startDate: string;
    endDate: string;
    slotInterval?: number;
}
export interface TimeSlotsResponse {
    businessId: string;
    serviceId?: string;
    dateRange: {
        start: string;
        end: string;
    };
    slots: TimeSlot[];
    slotInterval: number;
    businessHours: BusinessHours;
}
export interface Salon {
    id: string;
    businessId: string;
}
export interface Service {
    id: string;
    businessId: string;
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ServiceSummary {
    totalServices: number;
    averagePrice: number;
    totalPotentialRevenue: number;
    shortestService: number;
    longestService: number;
}
export interface CreateServiceRequest {
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
}
export interface UpdateServiceRequest {
    name?: string;
    price?: number;
    durationMinutes?: number;
    description?: string;
}
export interface ServiceResponse {
    id: string;
    businessId: string;
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
    createdAt: string;
    updatedAt: string;
}
export interface BusinessServicesResponse {
    businessId: string;
    services: ServiceResponse[];
    summary: ServiceSummary;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface AuthTokenPayload {
    sub: string;
    iat: number;
    exp: number;
}
export interface Customer {
    id: string;
    phoneNumber: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED_BY_USER = "CANCELLED_BY_USER",
    CANCELLED_BY_SALON = "CANCELLED_BY_SALON",
    COMPLETED = "COMPLETED"
}
export interface Booking {
    id: string;
    businessId: string;
    customerId: string;
    serviceId: string;
    status: BookingStatus;
    scheduledAt: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DailyAnalytics {
    businessId: string;
    date: string;
    totalBookings: number;
    totalRevenue: number;
    timezone: string;
}
export interface AnalyticsQuery {
    date?: string;
    timezone?: string;
}
export interface DailyAnalyticsResponse {
    businessId: string;
    date: string;
    totalBookings: number;
    totalRevenue: number;
    timezone: string;
}
export interface SetRoutingCodeRequest {
    routingCode: string;
}
export interface CodeAvailabilityResponse {
    available: boolean;
    suggestions?: string[];
}
export interface BusinessPublicInfo {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
    routingCode: string;
    hoursOfOperation?: BusinessHours | any;
}
export interface CustomerSession {
    id: string;
    customerPhone: string;
    businessId?: string;
    currentState: CustomerSessionState;
    sessionData?: any;
    lastMessageAt: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum CustomerSessionState {
    INITIAL = "INITIAL",
    BUSINESS_SELECTED = "BUSINESS_SELECTED",
    SERVICE_SELECTION = "SERVICE_SELECTION",
    TIME_SELECTION = "TIME_SELECTION",
    BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
    BOOKING_COMPLETE = "BOOKING_COMPLETE",
    EXPIRED = "EXPIRED"
}
export interface SimulatorMessage {
    id: string;
    sessionId: string;
    messageId: string;
    fromPhone: string;
    toPhone: string;
    messageType: MessageType;
    content: MessageContent;
    timestamp: Date;
    isFromCustomer: boolean;
    delivered: boolean;
    read: boolean;
}
export declare enum MessageType {
    TEXT = "text",
    INTERACTIVE_BUTTON = "interactive_button",
    INTERACTIVE_LIST = "interactive_list",
    SYSTEM = "system"
}
export interface MessageContent {
    text?: string;
    buttons?: MessageButton[];
    list?: MessageList;
    systemMessage?: string;
}
export interface MessageButton {
    id: string;
    title: string;
    payload?: string;
}
export interface MessageList {
    header?: string;
    body: string;
    footer?: string;
    buttonText: string;
    sections: MessageListSection[];
}
export interface MessageListSection {
    title: string;
    rows: MessageListRow[];
}
export interface MessageListRow {
    id: string;
    title: string;
    description?: string;
}
export interface CustomerAuthRequest {
    phoneNumber: string;
}
export interface CustomerAuthResponse {
    success: boolean;
    sessionId: string;
    expiresAt: Date;
    customer: Customer;
}
export interface SendMessageRequest {
    sessionId: string;
    content: MessageContent;
    messageType: MessageType;
}
export interface SendMessageResponse {
    success: boolean;
    messageId: string;
    timestamp: Date;
}
export interface PollMessagesRequest {
    sessionId: string;
    since?: Date;
}
export interface PollMessagesResponse {
    success: boolean;
    messages: SimulatorMessage[];
    hasMore: boolean;
}
export interface BusinessRoutingMessage {
    routingCode: string;
    business: BusinessPublicInfo;
    isValid: boolean;
}
export interface ParseRoutingCodeRequest {
    message: string;
}
export interface ParseRoutingCodeResponse {
    success: boolean;
    routingCode?: string;
    business?: BusinessPublicInfo;
    suggestedMessage?: string;
}
export interface WhatsAppWebhookPayload {
    object: "whatsapp_business_account";
    entry: WhatsAppWebhookEntry[];
}
export interface WhatsAppWebhookEntry {
    id: string;
    changes: WhatsAppWebhookChange[];
}
export interface WhatsAppWebhookChange {
    value: WhatsAppWebhookValue;
    field: "messages";
}
export interface WhatsAppWebhookValue {
    messaging_product: "whatsapp";
    metadata: WhatsAppMetadata;
    messages?: WhatsAppIncomingMessage[];
    statuses?: WhatsAppMessageStatus[];
}
export interface WhatsAppMetadata {
    display_phone_number: string;
    phone_number_id: string;
}
export interface WhatsAppIncomingMessage {
    from: string;
    id: string;
    timestamp: string;
    type: "text" | "interactive" | "button" | "list" | "image" | "document";
    text?: WhatsAppTextMessage;
    interactive?: WhatsAppInteractiveResponse;
    button?: WhatsAppButtonResponse;
    context?: WhatsAppMessageContext;
}
export interface WhatsAppTextMessage {
    body: string;
}
export interface WhatsAppInteractiveResponse {
    type: "button_reply" | "list_reply" | "quick_reply";
    button_reply?: {
        id: string;
        title: string;
    };
    list_reply?: {
        id: string;
        title: string;
        description?: string;
    };
    quick_reply?: {
        id: string;
        title: string;
    };
}
export interface WhatsAppButtonResponse {
    text: string;
    payload: string;
}
export interface WhatsAppMessageContext {
    from: string;
    id: string;
}
export interface WhatsAppMessageStatus {
    id: string;
    status: "sent" | "delivered" | "read" | "failed";
    timestamp: string;
    recipient_id: string;
}
export interface WhatsAppOutgoingMessage {
    messaging_product: "whatsapp";
    recipient_type: "individual";
    to: string;
    type: "text" | "interactive" | "template";
    text?: WhatsAppTextMessage;
    interactive?: WhatsAppInteractiveMessage;
    template?: WhatsAppTemplateMessage;
}
export interface WhatsAppInteractiveMessage {
    type: "button" | "list";
    header?: WhatsAppMessageHeader;
    body: WhatsAppMessageBody;
    footer?: WhatsAppMessageFooter;
    action: WhatsAppInteractiveAction;
}
export interface WhatsAppMessageHeader {
    type: "text" | "image" | "document";
    text?: string;
}
export interface WhatsAppMessageBody {
    text: string;
}
export interface WhatsAppMessageFooter {
    text: string;
}
export interface WhatsAppInteractiveAction {
    buttons?: WhatsAppActionButton[];
    button?: string;
    sections?: WhatsAppActionSection[];
}
export interface WhatsAppActionButton {
    type: "reply";
    reply: {
        id: string;
        title: string;
    };
}
export interface WhatsAppActionSection {
    title: string;
    rows: WhatsAppActionRow[];
}
export interface WhatsAppActionRow {
    id: string;
    title: string;
    description?: string;
}
export interface WhatsAppTemplateMessage {
    name: string;
    language: {
        code: string;
    };
    components?: WhatsAppTemplateComponent[];
}
export interface WhatsAppTemplateComponent {
    type: "header" | "body" | "footer" | "button";
    parameters?: WhatsAppTemplateParameter[];
}
export interface WhatsAppTemplateParameter {
    type: "text" | "currency" | "date_time" | "image" | "document";
    text?: string;
}
export interface WhatsAppConversation {
    id: string;
    customerPhone: string;
    businessId: string;
    state: WhatsAppConversationState;
    context?: WhatsAppBookingContext;
    lastMessageAt: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum WhatsAppConversationState {
    INITIAL = "INITIAL",
    ROUTING_CODE_REQUEST = "ROUTING_CODE_REQUEST",
    BUSINESS_CONNECTED = "BUSINESS_CONNECTED",
    MAIN_MENU = "MAIN_MENU",
    SERVICE_SELECTION = "SERVICE_SELECTION",
    TIME_SELECTION = "TIME_SELECTION",
    BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
    BOOKING_COMPLETE = "BOOKING_COMPLETE",
    BOOKING_MANAGEMENT = "BOOKING_MANAGEMENT",
    VIEW_BOOKINGS = "VIEW_BOOKINGS",
    CANCEL_BOOKING = "CANCEL_BOOKING",
    CANCEL_CONFIRMATION = "CANCEL_CONFIRMATION",
    EXPIRED = "EXPIRED"
}
export interface WhatsAppBookingContext {
    businessId?: string;
    businessName?: string;
    selectedServiceId?: string;
    selectedServiceName?: string;
    selectedServicePrice?: number;
    selectedServiceDuration?: number;
    selectedDate?: string;
    selectedTime?: string;
    selectedTimeSlot?: string;
    customerName?: string;
    bookingNotes?: string;
    pendingBookingId?: string;
    navigationHistory?: string[];
    lastInteractionId?: string;
    existingBookings?: BookingResponseDto[];
    bookingToCancel?: string;
}
export interface WhatsAppMessage {
    id: string;
    conversationId: string;
    whatsappMessageId?: string;
    direction: 'INCOMING' | 'OUTGOING';
    messageType: string;
    content: any;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    isSimulator: boolean;
    createdAt: Date;
}
export interface MockResponseQuery {
    customerPhone: string;
    since?: number;
    limit?: number;
}
export interface MockResponseData {
    id: string;
    conversationId: string;
    messageType: string;
    content: WhatsAppOutgoingMessage;
    timestamp: Date;
    delivered: boolean;
}
export interface MockResponsesResponse {
    success: boolean;
    data: MockResponseData[];
    hasMore: boolean;
}
export interface BookingResponseDto {
    id: string;
    businessId: string;
    customerId: string;
    serviceId: string;
    status: BookingStatus;
    scheduledAt: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    customer?: {
        id: string;
        phoneNumber: string;
        name?: string;
    };
    service?: {
        id: string;
        name: string;
        price: number;
        durationMinutes: number;
        description?: string;
    };
    business?: {
        id: string;
        name: string;
        phoneNumber: string;
        address: string;
    };
}
export declare enum WhatsAppNavigationAction {
    HOME = "nav_home",
    BACK = "nav_back",
    MAIN_MENU = "nav_main_menu"
}
export declare enum WhatsAppBookingAction {
    BOOK_SERVICE = "book_service",
    VIEW_BOOKINGS = "view_bookings",
    CANCEL_BOOKING = "cancel_booking",
    SELECT_SERVICE = "select_service",
    SELECT_TIME = "select_time",
    CONFIRM_BOOKING = "confirm_booking",
    CONFIRM_CANCEL = "confirm_cancel",
    ADD_NOTES = "add_notes",
    VIEW_BUSINESS_INFO = "view_business_info"
}
export interface WhatsAppButtonConfig {
    id: string;
    title: string;
    action?: WhatsAppBookingAction | WhatsAppNavigationAction;
}
export interface WhatsAppListConfig {
    header?: string;
    body: string;
    footer?: string;
    buttonText: string;
    sections: {
        title: string;
        rows: {
            id: string;
            title: string;
            description?: string;
            action?: WhatsAppBookingAction | WhatsAppNavigationAction;
        }[];
    }[];
}
