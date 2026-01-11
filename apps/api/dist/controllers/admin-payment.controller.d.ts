/**
 * Admin Payment Management Controller
 *
 * Handles admin operations for payment management including:
 * - Recording manual payments
 * - Listing all payments with filters
 * - Getting business payment history
 * - Revenue analytics
 */
import { Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminPaymentController {
    /**
     * POST /v1/admin/payments
     * Record manual payment for a subscription
     */
    recordPayment(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/payments
     * List all payments with pagination and filters
     */
    listPayments(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/businesses/:id/payments
     * Get payment history for a specific business
     */
    getBusinessPayments(req: AdminRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /v1/admin/payments/analytics
     * Get payment analytics and revenue metrics
     */
    getPaymentAnalytics(req: AdminRequest, res: Response): Promise<void>;
    /**
     * Get monthly revenue trend
     */
    private getMonthlyRevenueTrend;
    /**
     * Get revenue breakdown by subscription plan
     */
    private getRevenueByPlan;
}
export declare const adminPaymentController: AdminPaymentController;
export {};
//# sourceMappingURL=admin-payment.controller.d.ts.map