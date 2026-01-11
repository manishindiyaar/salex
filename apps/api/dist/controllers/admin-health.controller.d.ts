/**
 * Admin Health and Statistics Controller
 *
 * Handles system health checks and platform statistics for admin dashboard.
 */
import { Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminHealthController {
    private supabase;
    constructor();
    /**
     * GET /v1/admin/health
     * Check system health status
     */
    getSystemHealth(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/stats
     * Get platform statistics
     */
    getPlatformStats(req: AdminRequest, res: Response): Promise<void>;
    /**
     * Check database health
     */
    private checkDatabaseHealth;
    /**
     * Check Supabase health
     */
    private checkSupabaseHealth;
    /**
     * Check WhatsApp API health
     */
    private checkWhatsAppHealth;
    /**
     * Check API health
     */
    private checkAPIHealth;
    /**
     * Get business statistics
     */
    private getBusinessStats;
    /**
     * Get subscription statistics
     */
    private getSubscriptionStats;
    /**
     * Get booking statistics
     */
    private getBookingStats;
    /**
     * Get revenue statistics
     */
    private getRevenueStats;
    /**
     * Get customer statistics
     */
    private getCustomerStats;
    /**
     * Get recent activity
     */
    private getRecentActivity;
}
export declare const adminHealthController: AdminHealthController;
export {};
//# sourceMappingURL=admin-health.controller.d.ts.map