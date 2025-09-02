"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStatus = exports.MessageType = exports.MessageDirection = exports.ConversationState = void 0;
var ConversationState;
(function (ConversationState) {
    ConversationState["GREETING"] = "GREETING";
    ConversationState["SERVICE_SELECTION"] = "SERVICE_SELECTION";
    ConversationState["TIME_SELECTION"] = "TIME_SELECTION";
    ConversationState["BOOKING_CONFIRMATION"] = "BOOKING_CONFIRMATION";
    ConversationState["COMPLETED"] = "COMPLETED";
})(ConversationState || (exports.ConversationState = ConversationState = {}));
var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INCOMING"] = "INCOMING";
    MessageDirection["OUTGOING"] = "OUTGOING";
})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["INTERACTIVE"] = "interactive";
    MessageType["IMAGE"] = "image";
    MessageType["AUDIO"] = "audio";
    MessageType["DOCUMENT"] = "document";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
