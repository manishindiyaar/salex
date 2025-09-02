"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CustomerSessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
const shared_types_1 = require("shared-types");
let CustomerSessionService = CustomerSessionService_1 = class CustomerSessionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CustomerSessionService_1.name);
        this.SESSION_DURATION_MINUTES = 30;
    }
    async authenticateCustomer(request) {
        const { phoneNumber } = request;
        this.logger.debug(`Authenticating customer with phone: ${phoneNumber}`);
        if (!this.isValidPhoneNumber(phoneNumber)) {
            throw new common_1.BadRequestException('Invalid phone number format');
        }
        const customer = await this.findOrCreateCustomer(phoneNumber);
        const existingSession = await this.findActiveSession(phoneNumber);
        if (existingSession) {
            const updatedSession = await this.extendSession(existingSession.id);
            return {
                success: true,
                sessionId: updatedSession.id,
                expiresAt: updatedSession.expiresAt,
                customer
            };
        }
        const newSession = await this.createNewSession(phoneNumber);
        return {
            success: true,
            sessionId: newSession.id,
            expiresAt: newSession.expiresAt,
            customer
        };
    }
    async getSession(sessionId) {
        const session = await this.prisma.customerSession.findUnique({
            where: { id: sessionId },
            include: {
                customer: true,
                business: true
            }
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.expiresAt < new Date()) {
            await this.expireSession(sessionId);
            throw new common_1.NotFoundException('Session has expired');
        }
        return {
            id: session.id,
            customerPhone: session.customerPhone,
            businessId: session.businessId,
            currentState: session.currentState,
            sessionData: session.sessionData,
            lastMessageAt: session.lastMessageAt,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };
    }
    async updateSessionState(sessionId, state, sessionData) {
        this.logger.debug(`Updating session ${sessionId} to state: ${state}`);
        const updatedSession = await this.prisma.customerSession.update({
            where: { id: sessionId },
            data: {
                currentState: state,
                sessionData: sessionData || undefined,
                lastMessageAt: new Date(),
                expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000)
            }
        });
        return {
            id: updatedSession.id,
            customerPhone: updatedSession.customerPhone,
            businessId: updatedSession.businessId,
            currentState: updatedSession.currentState,
            sessionData: updatedSession.sessionData,
            lastMessageAt: updatedSession.lastMessageAt,
            expiresAt: updatedSession.expiresAt,
            createdAt: updatedSession.createdAt,
            updatedAt: updatedSession.updatedAt
        };
    }
    async setBusinessContext(sessionId, businessId) {
        this.logger.debug(`Setting business context for session ${sessionId}: ${businessId}`);
        const updatedSession = await this.prisma.customerSession.update({
            where: { id: sessionId },
            data: {
                businessId,
                currentState: shared_types_1.CustomerSessionState.BUSINESS_SELECTED,
                lastMessageAt: new Date(),
                expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000)
            }
        });
        return {
            id: updatedSession.id,
            customerPhone: updatedSession.customerPhone,
            businessId: updatedSession.businessId,
            currentState: updatedSession.currentState,
            sessionData: updatedSession.sessionData,
            lastMessageAt: updatedSession.lastMessageAt,
            expiresAt: updatedSession.expiresAt,
            createdAt: updatedSession.createdAt,
            updatedAt: updatedSession.updatedAt
        };
    }
    async cleanupExpiredSessions() {
        this.logger.debug('Cleaning up expired sessions');
        const result = await this.prisma.customerSession.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        this.logger.debug(`Cleaned up ${result.count} expired sessions`);
        return result.count;
    }
    async getSessionStats() {
        const now = new Date();
        const [activeSessions, totalSessions] = await Promise.all([
            this.prisma.customerSession.count({
                where: {
                    expiresAt: { gte: now }
                }
            }),
            this.prisma.customerSession.count()
        ]);
        const expiredSessions = totalSessions - activeSessions;
        return {
            activeSessions,
            expiredSessions,
            totalSessions
        };
    }
    async findOrCreateCustomer(phoneNumber) {
        let customer = await this.prisma.customer.findUnique({
            where: { phoneNumber }
        });
        if (!customer) {
            this.logger.debug(`Creating new customer with phone: ${phoneNumber}`);
            customer = await this.prisma.customer.create({
                data: {
                    phoneNumber,
                    name: null
                }
            });
        }
        return {
            id: customer.id,
            phoneNumber: customer.phoneNumber,
            name: customer.name,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
        };
    }
    async findActiveSession(phoneNumber) {
        return await this.prisma.customerSession.findFirst({
            where: {
                customerPhone: phoneNumber,
                expiresAt: {
                    gte: new Date()
                }
            }
        });
    }
    async createNewSession(phoneNumber) {
        this.logger.debug(`Creating new session for phone: ${phoneNumber}`);
        return await this.prisma.customerSession.create({
            data: {
                customerPhone: phoneNumber,
                currentState: shared_types_1.CustomerSessionState.INITIAL,
                expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000),
                sessionData: {}
            }
        });
    }
    async extendSession(sessionId) {
        this.logger.debug(`Extending session: ${sessionId}`);
        return await this.prisma.customerSession.update({
            where: { id: sessionId },
            data: {
                expiresAt: new Date(Date.now() + this.SESSION_DURATION_MINUTES * 60 * 1000),
                lastMessageAt: new Date()
            }
        });
    }
    async expireSession(sessionId) {
        await this.prisma.customerSession.update({
            where: { id: sessionId },
            data: {
                currentState: shared_types_1.CustomerSessionState.EXPIRED
            }
        });
    }
    async getSessionByPhone(phoneNumber) {
        this.logger.debug(`Getting session for phone: ${phoneNumber}`);
        const session = await this.prisma.customerSession.findUnique({
            where: { customerPhone: phoneNumber }
        });
        if (!session) {
            return null;
        }
        return {
            id: session.id,
            customerPhone: session.customerPhone,
            businessId: session.businessId,
            currentState: session.currentState,
            sessionData: session.sessionData,
            lastMessageAt: session.lastMessageAt,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        };
    }
    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{10,14}$/;
        return phoneRegex.test(phoneNumber);
    }
};
exports.CustomerSessionService = CustomerSessionService;
exports.CustomerSessionService = CustomerSessionService = CustomerSessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerSessionService);
//# sourceMappingURL=customer-session.service.js.map