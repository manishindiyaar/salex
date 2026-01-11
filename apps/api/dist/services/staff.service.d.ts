/**
 * Staff Service
 *
 * Manages staff members who perform services.
 * Handles CRUD operations, resource linking, utilization tracking, and deactivation protection.
 */
import { Staff, ResourceStaffLink } from '@salex/shared-types';
import { CreateStaffInput, UpdateStaffInput, LinkResourceInput } from '@salex/shared-types';
export interface LinkedResource {
    id: string;
    name: string;
    isPrimary: boolean;
}
export interface StaffWithStats extends Staff {
    linkedResources: LinkedResource[];
    utilizationPercent: number;
    activeBookingsCount: number;
}
declare class StaffService {
    /**
     * Create a staff member
     */
    create(businessId: string, ownerId: string, data: CreateStaffInput): Promise<Staff>;
    /**
     * Get a staff member by ID
     */
    getById(id: string, businessId: string, ownerId: string): Promise<Staff>;
    /**
     * List all staff for a business with utilization stats
     */
    list(businessId: string, ownerId: string, includeInactive?: boolean): Promise<StaffWithStats[]>;
    /**
     * Update a staff member
     */
    update(id: string, businessId: string, ownerId: string, data: UpdateStaffInput): Promise<Staff>;
    /**
     * Deactivate a staff member (soft delete)
     * Prevents deactivation if staff has active bookings
     */
    deactivate(id: string, businessId: string, ownerId: string): Promise<Staff>;
    /**
     * Reactivate a staff member
     */
    reactivate(id: string, businessId: string, ownerId: string): Promise<Staff>;
    /**
     * Link a staff member to a resource
     */
    linkToResource(staffId: string, businessId: string, ownerId: string, data: LinkResourceInput): Promise<ResourceStaffLink>;
    /**
     * Unlink a staff member from a resource
     */
    unlinkFromResource(staffId: string, resourceId: string, businessId: string, ownerId: string): Promise<void>;
    /**
     * Get linked resources for a staff member
     */
    getLinkedResources(staffId: string, businessId: string, ownerId: string): Promise<LinkedResource[]>;
    /**
     * Get count of active staff for a business
     */
    getActiveCount(businessId: string): Promise<number>;
}
export declare const staffService: StaffService;
export {};
//# sourceMappingURL=staff.service.d.ts.map