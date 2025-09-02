import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma.service';
import { Customer, CustomerSession } from 'shared-types';
export declare class CustomerAuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    authenticateCustomer(phoneNumber: string): Promise<{
        token: string;
        customer: Customer;
    }>;
    findOrCreateCustomer(phoneNumber: string): Promise<Customer>;
    generateCustomerJWT(customerId: string): Promise<string>;
    validateCustomerToken(token: string): Promise<Customer | null>;
    createCustomerSession(customerPhone: string, businessId: string): Promise<CustomerSession>;
    refreshCustomerSession(customerPhone: string): Promise<string>;
    cleanupExpiredSessions(): Promise<number>;
    private isValidPhoneNumber;
    canAuthenticate(phoneNumber: string, ipAddress: string): Promise<boolean>;
}
export declare const CUSTOMER_JWT_STRATEGY = "customer-jwt-strategy";
