/**
 * Service Catalog Service
 *
 * Handles CRUD operations for services offered by businesses.
 *
 * Key features:
 * - Create services with business ownership validation
 * - List services with active/inactive filter
 * - Soft delete (set isActive = false)
 * - Deletion protection (check for active bookings)
 */
import { Service } from '@salex/shared-types';
import type { CreateServiceInput, UpdateServiceInput } from '@salex/shared-types';
declare class ServiceService {
    /**
     * Create a new service for a business
     * Validates that the user owns the business
     */
    create(businessId: string, ownerId: string, data: CreateServiceInput): Promise<Service>;
    /**
     * Get all services for a business
     * Optionally include inactive services
     */
    listByBusinessId(businessId: string, includeInactive?: boolean): Promise<Service[]>;
    /**
     * Get a single service by ID
     */
    getById(id: string): Promise<Service>;
    /**
     * Update a service
     * Validates ownership through business
     */
    update(id: string, ownerId: string, data: UpdateServiceInput): Promise<Service>;
    /**
     * Soft delete a service (set isActive = false)
     * Checks for active bookings before deletion
     */
    softDelete(id: string, ownerId: string): Promise<Service>;
    /**
     * Hard delete a service (permanent)
     * Only allowed if no bookings reference this service
     */
    hardDelete(id: string, ownerId: string): Promise<void>;
}
export declare const serviceService: ServiceService;
export {};
//# sourceMappingURL=service.service.d.ts.map