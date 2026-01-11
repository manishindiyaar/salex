/**
 * Business Service
 *
 * Handles business CRUD operations for salon/shop management.
 *
 * Key flows:
 * 1. Merchant creates business → auto-generates routing code
 * 2. Merchant views their business → includes services
 * 3. WhatsApp bot looks up business by routing code → public access
 */
import { Business, Service } from '@salex/shared-types';
import type { CreateBusinessInput, UpdateBusinessInput } from '@salex/shared-types';
type BusinessWithServices = Business & {
    services: Service[];
};
declare class BusinessService {
    /**
     * Create a new business for a merchant
     * Auto-generates routing code if not provided
     */
    create(ownerId: string, data: CreateBusinessInput): Promise<BusinessWithServices>;
    /**
     * Get business by owner ID (for merchant dashboard)
     * Includes services for display
     */
    getByOwnerId(ownerId: string): Promise<BusinessWithServices>;
    /**
     * Get business by ID
     */
    getById(id: string): Promise<BusinessWithServices>;
    /**
     * Get business by routing code (for WhatsApp bot)
     * Public access - no auth required
     */
    getByRoutingCode(code: string): Promise<{
        id: string;
        name: string;
        phoneNumber: string;
        routingCode: string | null;
        isAcceptingOrders: boolean;
        hoursOfOperation: unknown;
        services: Array<{
            id: string;
            name: string;
            description: string | null;
            price: unknown;
            durationMinutes: number;
        }>;
    }>;
    /**
     * Update business details
     * Only owner can update their business
     */
    update(id: string, ownerId: string, data: UpdateBusinessInput): Promise<BusinessWithServices>;
}
export declare const businessService: BusinessService;
export {};
//# sourceMappingURL=business.service.d.ts.map