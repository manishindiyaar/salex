/**
 * User Service
 *
 * Handles user CRUD operations.
 */
import { User } from '@salex/shared-types';
declare class UserService {
    /**
     * Find user by phone number
     */
    findByPhone(phone: string): Promise<User | null>;
    /**
     * Find user by ID
     */
    findById(id: string): Promise<User | null>;
    /**
     * Find or create user by phone number
     * Used during OTP verification
     */
    findOrCreate(phone: string): Promise<User>;
    /**
     * Get user with their businesses
     */
    findWithBusinesses(userId: string): Promise<User & {
        businesses: any[];
    } | null>;
    /**
     * Update user role
     */
    updateRole(userId: string, role: 'OWNER' | 'STAFF'): Promise<User>;
}
export declare const userService: UserService;
export {};
//# sourceMappingURL=user.service.d.ts.map