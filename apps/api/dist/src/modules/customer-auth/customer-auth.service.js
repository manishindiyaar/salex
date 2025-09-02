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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_JWT_STRATEGY = exports.CustomerAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../core/prisma.service");
const uuid_1 = require("uuid");
let CustomerAuthService = class CustomerAuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async authenticateCustomer(phoneNumber) {
        if (!this.isValidPhoneNumber(phoneNumber)) {
            throw new common_1.ForbiddenException('Invalid phone number format');
        }
        const customer = await this.findOrCreateCustomer(phoneNumber);
        const token = await this.generateCustomerJWT(customer.id);
        return { token, customer };
    }
    async findOrCreateCustomer(phoneNumber) {
        const existingCustomer = await this.prisma.customer.findUnique({
            where: { phoneNumber }
        });
        if (existingCustomer) {
            return existingCustomer;
        }
        const customer = await this.prisma.customer.create({
            data: {
                phoneNumber,
                name: `Customer ${phoneNumber.slice(-4)}`
            }
        });
        return customer;
    }
    async generateCustomerJWT(customerId) {
        const payload = {
            sub: customerId,
            type: 'customer',
            sessionId: (0, uuid_1.v4)(),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60)
        };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('CUSTOMER_JWT_SECRET'),
            algorithm: 'HS256'
        });
    }
    async validateCustomerToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('CUSTOMER_JWT_SECRET')
            });
            if (payload.type !== 'customer') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const customer = await this.prisma.customer.findUnique({
                where: { id: payload.sub }
            });
            return customer;
        }
        catch (error) {
            return null;
        }
    }
    async createCustomerSession(customerPhone, businessId) {
        const session = await this.prisma.customerSession.upsert({
            where: {
                customerPhone: customerPhone
            },
            update: {
                businessId,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            },
            create: {
                customerPhone,
                businessId,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            }
        });
        return session;
    }
    async refreshCustomerSession(customerPhone) {
        const session = await this.prisma.customerSession.findFirst({
            where: {
                customerPhone,
                expiresAt: { gt: new Date() }
            }
        });
        if (!session) {
            throw new common_1.UnauthorizedException('Invalid or expired session');
        }
        await this.prisma.customerSession.update({
            where: { id: session.id },
            data: {
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
            }
        });
        return customerPhone;
    }
    async cleanupExpiredSessions() {
        const result = await this.prisma.customerSession.deleteMany({
            where: {
                expiresAt: { lt: new Date() }
            }
        });
        return result.count;
    }
    isValidPhoneNumber(phoneNumber) {
        const e164Regex = /^\+?[1-9]\d{1,14}$/;
        return e164Regex.test(phoneNumber);
    }
    async canAuthenticate(phoneNumber, ipAddress) {
        const recentAttempts = await this.prisma.customerSession.count({
            where: {
                customerPhone: phoneNumber,
                createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000)
                }
            }
        });
        return recentAttempts < 10;
    }
};
exports.CustomerAuthService = CustomerAuthService;
exports.CustomerAuthService = CustomerAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], CustomerAuthService);
exports.CUSTOMER_JWT_STRATEGY = 'customer-jwt-strategy';
//# sourceMappingURL=customer-auth.service.js.map