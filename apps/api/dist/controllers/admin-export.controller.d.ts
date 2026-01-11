/**
 * Admin Data Export Controller
 *
 * Handles data export functionality for admin dashboard including:
 * - Exporting businesses to CSV
 * - Exporting payments to CSV
 * - Custom field selection and filtering
 */
import { Response } from 'express';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
declare class AdminExportController {
    /**
     * GET /v1/admin/export/businesses
     * Export businesses to CSV
     */
    exportBusinesses(req: AdminRequest, res: Response): Promise<void>;
    /**
     * GET /v1/admin/export/payments
     * Export payments to CSV
     */
    exportPayments(req: AdminRequest, res: Response): Promise<void>;
    /**
     * Generate CSV content for businesses
     */
    private generateBusinessCSV;
    /**
     * Generate CSV content for payments
     */
    private generatePaymentCSV;
    /**
     * Get business field label for CSV header
     */
    private getBusinessFieldLabel;
    /**
     * Get business field value
     */
    private getBusinessFieldValue;
    /**
     * Get payment field label for CSV header
     */
    private getPaymentFieldLabel;
    /**
     * Get payment field value
     */
    private getPaymentFieldValue;
}
export declare const adminExportController: AdminExportController;
export {};
//# sourceMappingURL=admin-export.controller.d.ts.map