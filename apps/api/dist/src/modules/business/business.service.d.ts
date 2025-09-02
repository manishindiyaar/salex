import { PrismaService } from '../../core/prisma.service';
import { Business, Service, BusinessHours } from 'shared-types';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
export declare class BusinessService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createBusiness(ownerId: string, createData: CreateBusinessDto): Promise<Business>;
    getBusinessById(businessId: string, userId: string): Promise<Business>;
    getBusinessByIdPublic(businessId: string): Promise<Business>;
    updateBusiness(businessId: string, userId: string, updateData: UpdateBusinessDto): Promise<Business>;
    getBusinessServices(businessId: string, userId: string): Promise<Service[]>;
    getBusinessBookings(businessId: string, userId: string): Promise<({
        customer: {
            id: string;
            phoneNumber: string;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
        };
        service: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            businessId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationMinutes: number;
            description: string | null;
        };
    } & {
        status: import("@prisma/client").$Enums.BookingStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        businessId: string;
        customerId: string;
        serviceId: string;
        scheduledAt: Date;
        notes: string | null;
    })[]>;
    getUserPrimaryBusiness(userId: string): Promise<Business | null>;
    findBusinessByPhoneNumber(phoneNumber: string): Promise<Business | null>;
    findBusinessByRoutingCode(routingCode: string): Promise<Business | null>;
    updateBusinessHours(businessId: string, userId: string, hoursOfOperation: BusinessHours): Promise<Business>;
    getBusinessHours(businessId: string, userId: string): Promise<BusinessHours>;
    getBusinessHoursPublic(businessId: string): Promise<BusinessHours>;
    private validateBusinessHours;
    private validateDaySchedule;
    private parseTimeToMinutes;
    private getDefaultBusinessHours;
    isBusinessOpen(businessId: string, dateTime: Date): Promise<boolean>;
    private getDayName;
    private formatTimeFromDate;
}
