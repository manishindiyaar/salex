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
var TimeSlotsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlotsController = void 0;
const common_1 = require("@nestjs/common");
const timeslots_service_1 = require("./timeslots.service");
let TimeSlotsController = TimeSlotsController_1 = class TimeSlotsController {
    constructor(timeSlotsService) {
        this.timeSlotsService = timeSlotsService;
        this.logger = new common_1.Logger(TimeSlotsController_1.name);
    }
    async getAvailableSlots(businessId, serviceId, startDate, endDate, slotInterval) {
        this.logger.debug(`Getting available slots for business: ${businessId} (public access)`);
        try {
            if (!startDate || !endDate) {
                throw new common_1.BadRequestException('startDate and endDate are required parameters');
            }
            if (!this.isValidDateFormat(startDate) || !this.isValidDateFormat(endDate)) {
                throw new common_1.BadRequestException('Date format must be YYYY-MM-DD');
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) {
                throw new common_1.BadRequestException('startDate must be before or equal to endDate');
            }
            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > 30) {
                throw new common_1.BadRequestException('Date range cannot exceed 30 days');
            }
            const query = {
                businessId,
                serviceId,
                startDate,
                endDate,
                slotInterval: slotInterval ? Number(slotInterval) : undefined,
            };
            const slotsResponse = await this.timeSlotsService.getAvailableSlots(query);
            return {
                success: true,
                data: slotsResponse,
                message: 'Available time slots retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get available slots: ${error.message}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message === 'Business not found') {
                throw new common_1.HttpException('Business not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (error.message === 'Service not found') {
                throw new common_1.HttpException('Service not found', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException('Failed to get available slots', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTodayAvailableSlots(businessId, serviceId, slotInterval) {
        this.logger.debug(`Getting today's available slots for business: ${businessId} (public access)`);
        const today = new Date().toISOString().split('T')[0];
        return this.getAvailableSlots(businessId, serviceId, today, today, slotInterval);
    }
    async getWeekAvailableSlots(businessId, serviceId, slotInterval) {
        this.logger.debug(`Getting week's available slots for business: ${businessId} (public access)`);
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 6);
        const startDate = today.toISOString().split('T')[0];
        const endDate = nextWeek.toISOString().split('T')[0];
        return this.getAvailableSlots(businessId, serviceId, startDate, endDate, slotInterval);
    }
    isValidDateFormat(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
    }
};
exports.TimeSlotsController = TimeSlotsController;
__decorate([
    (0, common_1.Get)(':businessId/timeslots'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('serviceId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('slotInterval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number]),
    __metadata("design:returntype", Promise)
], TimeSlotsController.prototype, "getAvailableSlots", null);
__decorate([
    (0, common_1.Get)(':businessId/timeslots/today'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('serviceId')),
    __param(2, (0, common_1.Query)('slotInterval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], TimeSlotsController.prototype, "getTodayAvailableSlots", null);
__decorate([
    (0, common_1.Get)(':businessId/timeslots/week'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('serviceId')),
    __param(2, (0, common_1.Query)('slotInterval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], TimeSlotsController.prototype, "getWeekAvailableSlots", null);
exports.TimeSlotsController = TimeSlotsController = TimeSlotsController_1 = __decorate([
    (0, common_1.Controller)('api/v1/businesses'),
    __metadata("design:paramtypes", [timeslots_service_1.TimeSlotsService])
], TimeSlotsController);
//# sourceMappingURL=timeslots.controller.js.map