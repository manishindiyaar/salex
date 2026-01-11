/**
 * Routing Code Service
 *
 * Generates unique 4-digit routing codes for businesses.
 * Used by WhatsApp customers to identify which salon to book with.
 *
 * Example: Customer texts "8821" → Bot looks up business with that code
 */
declare class RoutingService {
    /**
     * Generate a random 4-digit code (0000-9999)
     */
    private generateRandomCode;
    /**
     * Check if a routing code is already taken
     */
    isCodeTaken(code: string): Promise<boolean>;
    /**
     * Generate a unique routing code with collision resolution
     * Retries up to MAX_RETRIES times if code is taken
     */
    generateUniqueCode(): Promise<string>;
    /**
     * Validate a routing code format (4 digits)
     */
    isValidFormat(code: string): boolean;
}
export declare const routingService: RoutingService;
export {};
//# sourceMappingURL=routing.service.d.ts.map