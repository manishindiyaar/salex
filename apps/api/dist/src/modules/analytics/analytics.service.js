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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailyAnalytics(businessId, ownerId, date, timezone) {
        await this.validateBusinessOwnership(businessId, ownerId);
        const targetDate = date ? new Date(date) : new Date();
        const businessTimezone = timezone || 'UTC';
        const startOfDay = this.getStartOfDay(targetDate, businessTimezone);
        const endOfDay = this.getEndOfDay(targetDate, businessTimezone);
        const bookings = await this.prisma.booking.findMany({
            where: {
                businessId,
                status: { in: ['CONFIRMED', 'COMPLETED'] },
                scheduledAt: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
            include: {
                service: {
                    select: {
                        price: true,
                    },
                },
            },
        });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, booking) => {
            return sum + (booking.service.price ? Number(booking.service.price) : 0);
        }, 0);
        return {
            businessId,
            date: this.formatDate(targetDate),
            totalBookings,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            timezone: businessTimezone,
        };
    }
    async validateBusinessOwnership(businessId, ownerId) {
        const business = await this.prisma.business.findFirst({
            where: { id: businessId, ownerId },
        });
        if (!business) {
            throw new common_1.ForbiddenException('Access denied: Business not found or not owned by user');
        }
    }
    getStartOfDay(date, timezone) {
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);
        return start;
    }
    getEndOfDay(date, timezone) {
        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);
        return end;
    }
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map