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
var BusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
let BusinessService = BusinessService_1 = class BusinessService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BusinessService_1.name);
    }
    async createBusiness(ownerId, createData) {
        this.logger.debug(`Creating business for owner: ${ownerId}`);
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const business = await tx.business.create({
                    data: {
                        ...createData,
                        ownerId,
                        businessType: 'SALON',
                        hoursOfOperation: createData.hoursOfOperation || {},
                    },
                });
                await tx.salon.create({
                    data: {
                        businessId: business.id,
                    },
                });
                return await tx.business.findUnique({
                    where: { id: business.id },
                    include: { salon: true },
                });
            });
            this.logger.log(`Business and Salon created successfully: ${result.id}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to create business: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBusinessById(businessId, userId) {
        this.logger.debug(`Getting business: ${businessId} for user: ${userId}`);
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            include: { salon: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        if (business.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this business');
        }
        return business;
    }
    async getBusinessByIdPublic(businessId) {
        this.logger.debug(`Getting business: ${businessId} (public access)`);
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            include: { salon: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        return business;
    }
    async updateBusiness(businessId, userId, updateData) {
        this.logger.debug(`Updating business: ${businessId} for user: ${userId}`);
        await this.getBusinessById(businessId, userId);
        try {
            const business = await this.prisma.business.update({
                where: { id: businessId },
                data: updateData,
                include: { salon: true },
            });
            this.logger.log(`Business updated successfully: ${businessId}`);
            return business;
        }
        catch (error) {
            this.logger.error(`Failed to update business: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBusinessServices(businessId, userId) {
        this.logger.debug(`Getting services for business: ${businessId}`);
        await this.getBusinessById(businessId, userId);
        const services = await this.prisma.service.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
        });
        return services.map(service => ({
            ...service,
            price: service.price.toNumber(),
        }));
    }
    async getBusinessBookings(businessId, userId) {
        this.logger.debug(`Getting bookings for business: ${businessId}`);
        await this.getBusinessById(businessId, userId);
        const bookings = await this.prisma.booking.findMany({
            where: { businessId },
            include: {
                customer: true,
                service: true,
            },
            orderBy: { scheduledAt: 'desc' },
        });
        return bookings;
    }
    async getUserPrimaryBusiness(userId) {
        this.logger.debug(`Getting primary business for user: ${userId}`);
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
            include: { salon: true },
            orderBy: { createdAt: 'asc' },
        });
        return business;
    }
    async findBusinessByPhoneNumber(phoneNumber) {
        this.logger.debug(`Finding business by phone number: ${phoneNumber}`);
        const business = await this.prisma.business.findFirst({
            where: { phoneNumber },
        });
        return business;
    }
    async findBusinessByRoutingCode(routingCode) {
        this.logger.debug(`Finding business by routing code: ${routingCode}`);
        const business = await this.prisma.business.findUnique({
            where: { routingCode },
            include: { salon: true },
        });
        return business;
    }
    async updateBusinessHours(businessId, userId, hoursOfOperation) {
        this.logger.debug(`Updating business hours for business: ${businessId} by user: ${userId}`);
        await this.getBusinessById(businessId, userId);
        this.validateBusinessHours(hoursOfOperation);
        try {
            const business = await this.prisma.business.update({
                where: { id: businessId },
                data: { hoursOfOperation: hoursOfOperation },
                include: { salon: true },
            });
            this.logger.log(`Business hours updated successfully: ${businessId}`);
            return business;
        }
        catch (error) {
            this.logger.error(`Failed to update business hours: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBusinessHours(businessId, userId) {
        this.logger.debug(`Getting business hours for business: ${businessId}`);
        const business = await this.getBusinessById(businessId, userId);
        return business.hoursOfOperation || this.getDefaultBusinessHours();
    }
    async getBusinessHoursPublic(businessId) {
        this.logger.debug(`Getting business hours for business: ${businessId} (public access)`);
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { hoursOfOperation: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        return business.hoursOfOperation || this.getDefaultBusinessHours();
    }
    validateBusinessHours(hours) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for (const day of days) {
            const daySchedule = hours[day];
            if (daySchedule) {
                this.validateDaySchedule(daySchedule, day);
            }
        }
    }
    validateDaySchedule(schedule, dayName) {
        if (schedule.closed) {
            return;
        }
        const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeFormat.test(schedule.open)) {
            throw new common_1.BadRequestException(`Invalid open time format for ${dayName}. Use HH:MM format.`);
        }
        if (!timeFormat.test(schedule.close)) {
            throw new common_1.BadRequestException(`Invalid close time format for ${dayName}. Use HH:MM format.`);
        }
        const openTime = this.parseTimeToMinutes(schedule.open);
        const closeTime = this.parseTimeToMinutes(schedule.close);
        if (openTime >= closeTime) {
            throw new common_1.BadRequestException(`Open time must be before close time for ${dayName}.`);
        }
        if (openTime < 6 * 60 || closeTime > 24 * 60) {
            throw new common_1.BadRequestException(`Business hours for ${dayName} must be between 06:00 and 24:00.`);
        }
    }
    parseTimeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    getDefaultBusinessHours() {
        const defaultHours = { open: '09:00', close: '18:00', closed: false };
        const closedDay = { open: '09:00', close: '18:00', closed: true };
        return {
            monday: defaultHours,
            tuesday: defaultHours,
            wednesday: defaultHours,
            thursday: defaultHours,
            friday: defaultHours,
            saturday: defaultHours,
            sunday: closedDay,
        };
    }
    async isBusinessOpen(businessId, dateTime) {
        this.logger.debug(`Checking if business ${businessId} is open at ${dateTime}`);
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: { hoursOfOperation: true },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        const hours = business.hoursOfOperation || this.getDefaultBusinessHours();
        const dayName = this.getDayName(dateTime.getDay());
        const daySchedule = hours[dayName];
        if (!daySchedule || daySchedule.closed) {
            return false;
        }
        const currentTime = this.formatTimeFromDate(dateTime);
        const currentMinutes = this.parseTimeToMinutes(currentTime);
        const openMinutes = this.parseTimeToMinutes(daySchedule.open);
        const closeMinutes = this.parseTimeToMinutes(daySchedule.close);
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
    getDayName(dayNumber) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayNumber];
    }
    formatTimeFromDate(date) {
        return date.toTimeString().slice(0, 5);
    }
};
exports.BusinessService = BusinessService;
exports.BusinessService = BusinessService = BusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessService);
//# sourceMappingURL=business.service.js.map