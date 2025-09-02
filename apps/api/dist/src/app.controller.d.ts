import { AppService } from './app.service';
import { PrismaService } from './core/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
    };
    getDbHealth(): Promise<{
        status: string;
        timestamp: string;
        database: string;
    }>;
}
