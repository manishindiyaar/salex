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
var TimeSlotsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
let TimeSlotsService = TimeSlotsService_1 = class TimeSlotsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TimeSlotsService_1.name);
    }
    async getAvailableSlots(query) {
        this.logger.debug(`Getting available slots for business: ${query.businessId}`);
        const business = await this.getBusinessWithHours(query.businessId);
        let serviceDuration = query.slotInterval || 30;
        if (query.serviceId) {
            const service = await this.getService(query.serviceId);
            serviceDuration = service.durationMinutes;
        }
        const bookings = await this.getBookingsInRange(query.businessId, query.startDate, query.endDate);
        const slots = await this.calculateAvailableSlots(business.hoursOfOperation, query.startDate, query.endDate, serviceDuration, bookings);
        return {
            businessId: query.businessId,
            serviceId: query.serviceId,
            dateRange: {
                start: query.startDate,
                end: query.endDate,
            },
            slots,
            slotInterval: serviceDuration,
            businessHours: business.hoursOfOperation,
        };
    }
    async calculateAvailableSlots(businessHours, startDate, endDate, serviceDuration, existingBookings) {
        const slots = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
            const dateStr = this.formatDateToString(currentDate);
            const dayName = this.getDayName(currentDate.getDay());
            const daySchedule = businessHours[dayName];
            if (!daySchedule || daySchedule.closed) {
                continue;
            }
            const dailySlots = this.generateDailySlots(dateStr, daySchedule, serviceDuration);
            const availableSlots = this.filterAvailableSlots(dailySlots, existingBookings, dateStr);
            slots.push(...availableSlots);
        }
        return slots.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.startTime.localeCompare(b.startTime);
        });
    }
    generateDailySlots(date, daySchedule, serviceDuration) {
        const slots = [];
        const openMinutes = this.parseTimeToMinutes(daySchedule.open);
        const closeMinutes = this.parseTimeToMinutes(daySchedule.close);
        for (let currentMinutes = openMinutes; currentMinutes + serviceDuration <= closeMinutes; currentMinutes += serviceDuration) {
            const startTime = this.formatMinutesToTime(currentMinutes);
            const endTime = this.formatMinutesToTime(currentMinutes + serviceDuration);
            slots.push({
                startTime,
                endTime,
                available: true,
                date,
                duration: serviceDuration,
            });
        }
        return slots;
    }
    filterAvailableSlots(slots, existingBookings, date) {
        return slots.map(slot => {
            const hasConflict = existingBookings.some(booking => {
                const bookingDate = this.formatDateToString(new Date(booking.scheduledAt));
                if (bookingDate !== date) {
                    return false;
                }
                const bookingTime = this.formatTimeFromDate(new Date(booking.scheduledAt));
                const bookingStartMinutes = this.parseTimeToMinutes(bookingTime);
                const bookingEndMinutes = bookingStartMinutes + (booking.service?.durationMinutes || 30);
                const slotStartMinutes = this.parseTimeToMinutes(slot.startTime);
                const slotEndMinutes = this.parseTimeToMinutes(slot.endTime);
                return !(bookingEndMinutes <= slotStartMinutes || bookingStartMinutes >= slotEndMinutes);
            });
            return {
                ...slot,
                available: !hasConflict,
            };
        });
    }
    async getBusinessWithHours(businessId) {
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                hoursOfOperation: true,
            },
        });
        if (!business) {
            throw new common_1.NotFoundException('Business not found');
        }
        return business;
    }
    async getService(serviceId) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
            select: {
                id: true,
                durationMinutes: true,
            },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        return service;
    }
    async getBookingsInRange(businessId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return await this.prisma.booking.findMany({
            where: {
                businessId,
                scheduledAt: {
                    gte: start,
                    lte: end,
                },
                status: {
                    notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_SALON'],
                },
            },
            include: {
                service: {
                    select: {
                        durationMinutes: true,
                    },
                },
            },
        });
    }
    parseTimeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }
    formatMinutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    getDayName(dayNumber) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayNumber];
    }
    formatDateToString(date) {
        return date.toISOString().split('T')[0];
    }
    formatTimeFromDate(date) {
        return date.toTimeString().slice(0, 5);
    }
};
exports.TimeSlotsService = TimeSlotsService;
exports.TimeSlotsService = TimeSlotsService = TimeSlotsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TimeSlotsService);
//# sourceMappingURL=timeslots.service.js.map