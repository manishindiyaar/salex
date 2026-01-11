/**
 * Resource Service
 *
 * Manages physical bookable resources (chairs, beds, rooms, stations).
 * Handles CRUD operations, utilization tracking, and deactivation protection.
 */
import { Resource } from '@salex/shared-types';
import { CreateResourceInput, UpdateResourceInput, BulkCreateResourceInput } from '@salex/shared-types';
export interface ResourceWithStats extends Resource {
    utilizationPercent: number;
    activeBookingsCount: number;
}
declare class ResourceService {
    /**
     * Create a single resource
     * Auto-generates name if not provided
     */
    create(businessId: string, ownerId: string, data: CreateResourceInput): Promise<Resource>;
    /**
     * Bulk create resources
     * Supports two formats:
     * 1. { count, prefix } - auto-generates names like "Chair 1", "Chair 2"
     * 2. { resources: [...] } - creates specific named resources
     */
    createBulk(businessId: string, ownerId: string, data: BulkCreateResourceInput): Promise<Resource[]>;
    /**
     * Get a resource by ID
     */
    getById(id: string, businessId: string, ownerId: string): Promise<Resource>;
    /**
     * List all resources for a business with utilization stats
     */
    list(businessId: string, ownerId: string, includeInactive?: boolean): Promise<ResourceWithStats[]>;
    /**
     * Update a resource
     */
    update(id: string, businessId: string, ownerId: string, data: UpdateResourceInput): Promise<Resource>;
    /**
     * Deactivate a resource (soft delete)
     * Prevents deactivation if resource has active bookings
     */
    deactivate(id: string, businessId: string, ownerId: string): Promise<Resource>;
    /**
     * Reactivate a resource
     */
    reactivate(id: string, businessId: string, ownerId: string): Promise<Resource>;
    /**
     * Get count of active resources for a business
     */
    getActiveCount(businessId: string): Promise<number>;
}
export declare const resourceService: ResourceService;
export {};
//# sourceMappingURL=resource.service.d.ts.map