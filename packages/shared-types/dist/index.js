"use strict";
// Core domain types for Salex platform
// This is the Single Source of Truth for all data models
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppBookingAction = exports.WhatsAppNavigationAction = exports.WhatsAppConversationState = exports.MessageType = exports.CustomerSessionState = exports.BookingStatus = exports.BusinessType = void 0;
var BusinessType;
(function (BusinessType) {
    BusinessType["SALON"] = "SALON";
})(BusinessType || (exports.BusinessType = BusinessType = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["CANCELLED_BY_USER"] = "CANCELLED_BY_USER";
    BookingStatus["CANCELLED_BY_SALON"] = "CANCELLED_BY_SALON";
    BookingStatus["COMPLETED"] = "COMPLETED";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var CustomerSessionState;
(function (CustomerSessionState) {
    CustomerSessionState["INITIAL"] = "INITIAL";
    CustomerSessionState["BUSINESS_SELECTED"] = "BUSINESS_SELECTED";
    CustomerSessionState["SERVICE_SELECTION"] = "SERVICE_SELECTION";
    CustomerSessionState["TIME_SELECTION"] = "TIME_SELECTION";
    CustomerSessionState["BOOKING_CONFIRMATION"] = "BOOKING_CONFIRMATION";
    CustomerSessionState["BOOKING_COMPLETE"] = "BOOKING_COMPLETE";
    CustomerSessionState["EXPIRED"] = "EXPIRED";
})(CustomerSessionState || (exports.CustomerSessionState = CustomerSessionState = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["INTERACTIVE_BUTTON"] = "interactive_button";
    MessageType["INTERACTIVE_LIST"] = "interactive_list";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
var WhatsAppConversationState;
(function (WhatsAppConversationState) {
    WhatsAppConversationState["INITIAL"] = "INITIAL";
    WhatsAppConversationState["ROUTING_CODE_REQUEST"] = "ROUTING_CODE_REQUEST";
    WhatsAppConversationState["BUSINESS_CONNECTED"] = "BUSINESS_CONNECTED";
    WhatsAppConversationState["MAIN_MENU"] = "MAIN_MENU";
    WhatsAppConversationState["SERVICE_SELECTION"] = "SERVICE_SELECTION";
    WhatsAppConversationState["TIME_SELECTION"] = "TIME_SELECTION";
    WhatsAppConversationState["BOOKING_CONFIRMATION"] = "BOOKING_CONFIRMATION";
    WhatsAppConversationState["BOOKING_COMPLETE"] = "BOOKING_COMPLETE";
    WhatsAppConversationState["BOOKING_MANAGEMENT"] = "BOOKING_MANAGEMENT";
    WhatsAppConversationState["VIEW_BOOKINGS"] = "VIEW_BOOKINGS";
    WhatsAppConversationState["CANCEL_BOOKING"] = "CANCEL_BOOKING";
    WhatsAppConversationState["CANCEL_CONFIRMATION"] = "CANCEL_CONFIRMATION";
    WhatsAppConversationState["EXPIRED"] = "EXPIRED";
})(WhatsAppConversationState || (exports.WhatsAppConversationState = WhatsAppConversationState = {}));
// WhatsApp Navigation Actions
var WhatsAppNavigationAction;
(function (WhatsAppNavigationAction) {
    WhatsAppNavigationAction["HOME"] = "nav_home";
    WhatsAppNavigationAction["BACK"] = "nav_back";
    WhatsAppNavigationAction["MAIN_MENU"] = "nav_main_menu";
})(WhatsAppNavigationAction || (exports.WhatsAppNavigationAction = WhatsAppNavigationAction = {}));
// WhatsApp Booking Actions
var WhatsAppBookingAction;
(function (WhatsAppBookingAction) {
    WhatsAppBookingAction["BOOK_SERVICE"] = "book_service";
    WhatsAppBookingAction["VIEW_BOOKINGS"] = "view_bookings";
    WhatsAppBookingAction["CANCEL_BOOKING"] = "cancel_booking";
    WhatsAppBookingAction["SELECT_SERVICE"] = "select_service";
    WhatsAppBookingAction["SELECT_TIME"] = "select_time";
    WhatsAppBookingAction["CONFIRM_BOOKING"] = "confirm_booking";
    WhatsAppBookingAction["CONFIRM_CANCEL"] = "confirm_cancel";
    WhatsAppBookingAction["ADD_NOTES"] = "add_notes";
    WhatsAppBookingAction["VIEW_BUSINESS_INFO"] = "view_business_info";
})(WhatsAppBookingAction || (exports.WhatsAppBookingAction = WhatsAppBookingAction = {}));
// All types are exported individually above
