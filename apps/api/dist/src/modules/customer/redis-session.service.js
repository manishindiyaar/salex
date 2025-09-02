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
var RedisSessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../core/redis.service");
const prisma_service_1 = require("../../core/prisma.service");
const shared_types_1 = require("shared-types");
let RedisSessionService = RedisSessionService_1 = class RedisSessionService {
    constructor(redisService, prisma) {
        this.redisService = redisService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(RedisSessionService_1.name);
    }
    async authenticateCustomer(request) {
        const { phoneNumber } = request;
        this.logger.debug(`Authenticating customer with phone: ${phoneNumber}`);
        if (!this.isValidPhoneNumber(phoneNumber)) {
            throw new common_1.BadRequestException('Invalid phone number format');
        }
        const customer = await this.findOrCreateCustomer(phoneNumber);
        const existingSession = await this.redisService.getSession(phoneNumber);
        if (existingSession) {
            await this.redisService.extendSession(phoneNumber);
            return {
                success: true,
                sessionId: phoneNumber,
                expiresAt: new Date(Date.now() + 600000),
                customer
            };
        }
        await this.redisService.setSession(phoneNumber, {
            customerPhone: phoneNumber,
            currentState: shared_types_1.CustomerSessionState.INITIAL,
            sessionData: {},
        });
        return {
            success: true,
            sessionId: phoneNumber,
            expiresAt: new Date(Date.now() + 600000),
            customer
        };
    }
    async getSession(sessionId) {
        const session = await this.redisService.getSession(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Session not found or expired');
        }
        return session;
    }
    async updateSessionState(sessionId, state, sessionData) {
        this.logger.debug(`Updating session ${sessionId} to state: ${state}`);
        await this.redisService.updateSessionState(sessionId, state, sessionData);
        const updatedSession = await this.redisService.getSession(sessionId);
        if (!updatedSession) {
            throw new common_1.NotFoundException('Session not found after update');
        }
        return updatedSession;
    }
    async setBusinessContext(sessionId, businessId) {
        this.logger.debug(`Setting business context for session ${sessionId}: ${businessId}`);
        await this.redisService.setBusinessContext(sessionId, businessId);
        const updatedSession = await this.redisService.getSession(sessionId);
        if (!updatedSession) {
            throw new common_1.NotFoundException('Session not found after business context update');
        }
        return updatedSession;
    }
    async getSessionStats() {
        const [activeSessions, redisHealth] = await Promise.all([
            this.redisService.getActiveSessionsCount(),
            this.redisService.healthCheck(),
        ]);
        return {
            activeSessions,
            redisHealth,
        };
    }
    async cleanupSession(sessionId) {
        await this.redisService.deleteSession(sessionId);
    }
    async extendSession(sessionId) {
        await this.redisService.extendSession(sessionId);
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
    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{10,14}$/;
        return phoneRegex.test(phoneNumber);
    }
    async healthCheck() {
        const [redisHealth, sessionCount] = await Promise.all([
            this.redisService.healthCheck(),
            this.redisService.getActiveSessionsCount(),
        ]);
        return {
            redis: redisHealth,
            sessions: sessionCount,
            status: redisHealth.status === 'healthy' ? 'healthy' : 'degraded',
        };
    }
};
exports.RedisSessionService = RedisSessionService;
exports.RedisSessionService = RedisSessionService = RedisSessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        prisma_service_1.PrismaService])
], RedisSessionService);
//# sourceMappingURL=redis-session.service.js.map