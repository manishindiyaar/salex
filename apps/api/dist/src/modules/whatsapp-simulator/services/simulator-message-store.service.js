"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SimulatorMessageStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorMessageStoreService = void 0;
const common_1 = require("@nestjs/common");
let SimulatorMessageStoreService = SimulatorMessageStoreService_1 = class SimulatorMessageStoreService {
    constructor() {
        this.logger = new common_1.Logger(SimulatorMessageStoreService_1.name);
        this.messages = new Map();
        this.maxMessagesPerCustomer = 100;
    }
    storeMessage(customerPhone, content, type) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const message = {
            id: messageId,
            customerPhone,
            content,
            timestamp: new Date(),
            type
        };
        let customerMessages = this.messages.get(customerPhone) || [];
        customerMessages.push(message);
        if (customerMessages.length > this.maxMessagesPerCustomer) {
            customerMessages = customerMessages.slice(-this.maxMessagesPerCustomer);
        }
        this.messages.set(customerPhone, customerMessages);
        this.logger.debug(`Stored ${type} message for ${customerPhone}: ${messageId}`);
    }
    getMessagesSince(customerPhone, since) {
        const customerMessages = this.messages.get(customerPhone) || [];
        if (!since) {
            return customerMessages.slice(-10);
        }
        return customerMessages.filter(msg => msg.timestamp > since);
    }
    getAllMessages(customerPhone) {
        return this.messages.get(customerPhone) || [];
    }
    clearMessages(customerPhone) {
        this.messages.delete(customerPhone);
        this.logger.debug(`Cleared messages for ${customerPhone}`);
    }
    getStats() {
        let totalMessages = 0;
        for (const customerMessages of this.messages.values()) {
            totalMessages += customerMessages.length;
        }
        return {
            totalCustomers: this.messages.size,
            totalMessages
        };
    }
    async storeResponse(customerPhone, responseData) {
        this.storeMessage(customerPhone, responseData, 'received');
    }
};
exports.SimulatorMessageStoreService = SimulatorMessageStoreService;
exports.SimulatorMessageStoreService = SimulatorMessageStoreService = SimulatorMessageStoreService_1 = __decorate([
    (0, common_1.Injectable)()
], SimulatorMessageStoreService);
//# sourceMappingURL=simulator-message-store.service.js.map