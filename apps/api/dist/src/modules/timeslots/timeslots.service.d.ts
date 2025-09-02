import { PrismaService } from '../../core/prisma.service';
import { TimeSlotsQuery, TimeSlotsResponse } from 'shared-types';
export declare class TimeSlotsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAvailableSlots(query: TimeSlotsQuery): Promise<TimeSlotsResponse>;
    private calculateAvailableSlots;
    private generateDailySlots;
    private filterAvailableSlots;
    private getBusinessWithHours;
    private getService;
    private getBookingsInRange;
    private parseTimeToMinutes;
    private formatMinutesToTime;
    private getDayName;
    private formatDateToString;
    private formatTimeFromDate;
}
