import { PrismaService } from '../../core/prisma.service';
import { DailyAnalytics } from 'shared-types';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDailyAnalytics(businessId: string, ownerId: string, date?: string, timezone?: string): Promise<DailyAnalytics>;
    private validateBusinessOwnership;
    private getStartOfDay;
    private getEndOfDay;
    private formatDate;
}
