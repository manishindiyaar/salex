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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("@upstash/redis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        const redisUrl = this.configService.get('UPSTASH_REDIS_REST_URL');
        const redisToken = this.configService.get('UPSTASH_REDIS_REST_TOKEN');
        if (!redisUrl || !redisToken) {
            throw new Error('Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
        }
        this.redis = new redis_1.Redis({
            url: redisUrl,
            token: redisToken,
        });
        this.sessionTTL = this.configService.get('WHATSAPP_SESSION_TTL', 600);
        this.sessionPrefix = this.configService.get('WHATSAPP_SESSION_PREFIX', 'wa_session');
        this.logger.log('Redis service initialized with Upstash');
    }
    getSessionKey(customerPhone) {
        return `${this.sessionPrefix}:${customerPhone}`;
    }
    async setSession(customerPhone, sessionData) {
        const key = this.getSessionKey(customerPhone);
        const session = {
            customerPhone,
            currentState: 'INITIAL',
            sessionData: {},
            lastMessageAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            ...sessionData,
        };
        try {
            await this.redis.setex(key, this.sessionTTL, JSON.stringify(session));
            this.logger.debug(`Session set for ${customerPhone} with TTL ${this.sessionTTL}s`);
        }
        catch (error) {
            this.logger.error(`Failed to set session for ${customerPhone}:`, error);
            throw error;
        }
    }
    async getSession(customerPhone) {
        const key = this.getSessionKey(customerPhone);
        try {
            const sessionData = await this.redis.get(key);
            if (!sessionData) {
                this.logger.debug(`No session found for ${customerPhone}`);
                return null;
            }
            return JSON.parse(sessionData);
        }
        catch (error) {
            this.logger.error(`Failed to get session for ${customerPhone}:`, error);
            return null;
        }
    }
    async updateSessionState(customerPhone, newState, sessionData) {
        const currentSession = await this.getSession(customerPhone);
        if (!currentSession) {
            this.logger.warn(`Trying to update non-existent session for ${customerPhone}`);
            return;
        }
        const updatedSession = {
            ...currentSession,
            currentState: newState,
            sessionData: sessionData || currentSession.sessionData,
            lastMessageAt: new Date().toISOString(),
        };
        await this.setSession(customerPhone, updatedSession);
    }
    async setBusinessContext(customerPhone, businessId) {
        const currentSession = await this.getSession(customerPhone);
        const updatedSession = {
            customerPhone,
            currentState: 'BUSINESS_SELECTED',
            sessionData: currentSession?.sessionData || {},
            lastMessageAt: new Date().toISOString(),
            createdAt: currentSession?.createdAt || new Date().toISOString(),
            businessId,
        };
        await this.setSession(customerPhone, updatedSession);
        this.logger.debug(`Business context set for ${customerPhone}: ${businessId}`);
    }
    async deleteSession(customerPhone) {
        const key = this.getSessionKey(customerPhone);
        try {
            await this.redis.del(key);
            this.logger.debug(`Session deleted for ${customerPhone}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete session for ${customerPhone}:`, error);
        }
    }
    async getActiveSessionsCount() {
        try {
            const keys = await this.redis.keys(`${this.sessionPrefix}:*`);
            return Array.isArray(keys) ? keys.length : 0;
        }
        catch (error) {
            this.logger.error('Failed to get active sessions count:', error);
            return 0;
        }
    }
    async healthCheck() {
        try {
            const start = Date.now();
            await this.redis.ping();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            this.logger.error('Redis health check failed:', error);
            return { status: 'unhealthy' };
        }
    }
    async extendSession(customerPhone) {
        const key = this.getSessionKey(customerPhone);
        try {
            await this.redis.expire(key, this.sessionTTL);
            this.logger.debug(`Session TTL extended for ${customerPhone}`);
        }
        catch (error) {
            this.logger.error(`Failed to extend session for ${customerPhone}:`, error);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map