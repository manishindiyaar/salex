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
var BusinessApiRouterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessApiRouterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../../core/prisma.service");
const axios_1 = require("axios");
let BusinessApiRouterService = BusinessApiRouterService_1 = class BusinessApiRouterService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(BusinessApiRouterService_1.name);
        this.serviceAccountToken = null;
        this.tokenExpiry = null;
        this.baseUrl = this.configService.get('API_BASE_URL') || 'http://localhost:3000';
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SalexSimulator/1.0',
            },
        });
        this.httpClient.interceptors.request.use(async (config) => {
            const token = await this.getServiceAccountToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        this.httpClient.interceptors.response.use((response) => response, (error) => {
            this.logger.error(`API request failed: ${error.message}`, error.response?.data);
            throw new common_1.HttpException(error.response?.data?.message || 'Business API request failed', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        });
    }
    async getServiceAccountToken() {
        try {
            if (this.serviceAccountToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
                return this.serviceAccountToken;
            }
            const serviceAccountId = this.configService.get('SIMULATOR_SERVICE_ACCOUNT_ID');
            const serviceAccountSecret = this.configService.get('SIMULATOR_SERVICE_ACCOUNT_SECRET');
            if (!serviceAccountId || !serviceAccountSecret) {
                this.logger.warn('Service account credentials not configured for simulator');
                return null;
            }
            this.serviceAccountToken = this.generateMockServiceToken(serviceAccountId);
            this.tokenExpiry = new Date(Date.now() + 3600000);
            this.logger.debug('Service account token refreshed for simulator API routing');
            return this.serviceAccountToken;
        }
        catch (error) {
            this.logger.error(`Failed to get service account token: ${error.message}`);
            return null;
        }
    }
    generateMockServiceToken(serviceAccountId) {
        const mockPayload = {
            sub: serviceAccountId,
            iss: 'simulator-service-account',
            aud: 'salex-api',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
            role: 'service-account',
            scope: 'business:read business:write'
        };
        const testToken = this.configService.get('CLERK_JWT_TOKEN');
        if (testToken) {
            return testToken;
        }
        return `mock-service-token-${Buffer.from(JSON.stringify(mockPayload)).toString('base64')}`;
    }
    async getBusinessByRoutingCode(routingCode) {
        this.logger.debug(`Looking up business by routing code: ${routingCode}`);
        try {
            const business = await this.prisma.business.findFirst({
                where: {
                    OR: [
                        { routingCode: routingCode },
                        { routingCode: `${routingCode}` },
                    ]
                },
                include: {
                    salon: true,
                }
            });
            if (business) {
                return {
                    id: business.id,
                    name: business.name,
                    routingCode: business.routingCode,
                    phoneNumber: business.phoneNumber,
                    address: business.address,
                    businessType: business.businessType,
                };
            }
            const response = await this.httpClient.get(`/api/v1/businesses/routing/${routingCode}`);
            return response.data.data;
        }
        catch (error) {
            this.logger.error(`Failed to get business by routing code ${routingCode}: ${error.message}`);
            throw error;
        }
    }
    async getBusinessById(businessId) {
        this.logger.debug(`Getting business by ID: ${businessId}`);
        try {
            const response = await this.httpClient.get(`/api/v1/businesses/${businessId}`);
            return response.data.data;
        }
        catch (error) {
            this.logger.error(`Failed to get business by ID ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async getBusinessServices(businessId, userToken) {
        this.logger.debug(`Getting services for business: ${businessId}`);
        try {
            const headers = {};
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }
            const response = await this.httpClient.get(`/api/v1/businesses/${businessId}/services`, { headers });
            return response.data.data.services || [];
        }
        catch (error) {
            this.logger.error(`Failed to get services for business ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async getBusinessHours(businessId, userToken) {
        this.logger.debug(`Getting hours for business: ${businessId}`);
        try {
            const headers = {};
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }
            const response = await this.httpClient.get(`/api/v1/businesses/${businessId}/hours`, { headers });
            return response.data.data;
        }
        catch (error) {
            this.logger.error(`Failed to get hours for business ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async getAvailableTimeSlots(businessId, userToken, options) {
        this.logger.debug(`Getting time slots for business: ${businessId}`);
        try {
            const headers = {};
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }
            const params = new URLSearchParams();
            if (options?.serviceId)
                params.append('serviceId', options.serviceId);
            if (options?.startDate)
                params.append('startDate', options.startDate);
            if (options?.endDate)
                params.append('endDate', options.endDate);
            if (options?.slotInterval)
                params.append('slotInterval', options.slotInterval.toString());
            const response = await this.httpClient.get(`/api/v1/businesses/${businessId}/timeslots?${params.toString()}`, { headers });
            return response.data.data || [];
        }
        catch (error) {
            this.logger.error(`Failed to get time slots for business ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async createBooking(businessId, userToken, bookingData) {
        this.logger.debug(`Creating booking for business: ${businessId}`);
        try {
            const headers = {};
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }
            const response = await this.httpClient.post(`/api/v1/businesses/${businessId}/bookings`, bookingData, { headers });
            return response.data.data;
        }
        catch (error) {
            this.logger.error(`Failed to create booking for business ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async getBusinessOpenStatus(businessId, userToken) {
        this.logger.debug(`Getting open status for business: ${businessId}`);
        try {
            const headers = {};
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }
            const response = await this.httpClient.get(`/api/v1/businesses/${businessId}/open-status`, { headers });
            return response.data.data;
        }
        catch (error) {
            this.logger.error(`Failed to get open status for business ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async getBusinessAnalytics(businessId, userToken, options) {
        this.logger.debug(`Getting analytics for business: ${businessId}`);
        try {
            const headers = {};
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }
            const params = new URLSearchParams();
            if (options?.date)
                params.append('date', options.date);
            if (options?.timezone)
                params.append('timezone', options.timezone);
            const response = await this.httpClient.get(`/api/v1/businesses/${businessId}/analytics/daily?${params.toString()}`, { headers });
            return response.data.data;
        }
        catch (error) {
            this.logger.error(`Failed to get analytics for business ${businessId}: ${error.message}`);
            throw error;
        }
    }
    async checkApiHealth() {
        try {
            const response = await this.httpClient.get('/health');
            return response.status === 200;
        }
        catch (error) {
            this.logger.error(`API health check failed: ${error.message}`);
            return false;
        }
    }
    getClientInfo() {
        return {
            baseUrl: this.baseUrl,
            hasServiceAccount: !!this.serviceAccountToken,
            tokenExpiry: this.tokenExpiry,
        };
    }
};
exports.BusinessApiRouterService = BusinessApiRouterService;
exports.BusinessApiRouterService = BusinessApiRouterService = BusinessApiRouterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], BusinessApiRouterService);
//# sourceMappingURL=business-api-router.service.js.map