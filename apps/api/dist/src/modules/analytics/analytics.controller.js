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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const conditional_auth_guard_1 = require("../auth/conditional-auth.guard");
const analytics_service_1 = require("./analytics.service");
const analytics_query_dto_1 = require("./dto/analytics-query.dto");
const daily_analytics_dto_1 = require("./dto/daily-analytics.dto");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDailyAnalytics(businessId, query, req) {
        try {
            const userId = req.auth?.userId || req.user?.id;
            if (!userId) {
                return {
                    success: false,
                    error: 'User authentication required',
                };
            }
            const analytics = await this.analyticsService.getDailyAnalytics(businessId, userId, query.date, query.timezone);
            return {
                success: true,
                data: new daily_analytics_dto_1.DailyAnalyticsDto(analytics),
                message: 'Daily analytics retrieved successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve daily analytics',
            };
        }
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)(':businessId/analytics/daily'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analytics_query_dto_1.AnalyticsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDailyAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('api/v1/businesses'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map