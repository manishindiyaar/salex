"use strict";
/**
 * Routing Code Service
 *
 * Generates unique 4-digit routing codes for businesses.
 * Used by WhatsApp customers to identify which salon to book with.
 *
 * Example: Customer texts "8821" → Bot looks up business with that code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.routingService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const MAX_RETRIES = 10;
const CODE_LENGTH = 4;
class RoutingService {
    /**
     * Generate a random 4-digit code (0000-9999)
     */
    generateRandomCode() {
        const code = Math.floor(Math.random() * 10000);
        return code.toString().padStart(CODE_LENGTH, '0');
    }
    /**
     * Check if a routing code is already taken
     */
    async isCodeTaken(code) {
        const existing = await shared_types_1.prisma.business.findUnique({
            where: { routingCode: code },
            select: { id: true },
        });
        return existing !== null;
    }
    /**
     * Generate a unique routing code with collision resolution
     * Retries up to MAX_RETRIES times if code is taken
     */
    async generateUniqueCode() {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const code = this.generateRandomCode();
            const isTaken = await this.isCodeTaken(code);
            if (!isTaken) {
                logger_1.logger.info({ code, attempt }, 'Generated unique routing code');
                return code;
            }
            logger_1.logger.debug({ code, attempt }, 'Routing code collision, retrying...');
        }
        // Extremely unlikely with 10,000 possible codes and few businesses
        logger_1.logger.error({ maxRetries: MAX_RETRIES }, 'Failed to generate unique routing code');
        throw new errors_1.BusinessRuleError('Unable to generate unique routing code. Please try again.');
    }
    /**
     * Validate a routing code format (4 digits)
     */
    isValidFormat(code) {
        return /^\d{4}$/.test(code);
    }
}
exports.routingService = new RoutingService();
//# sourceMappingURL=routing.service.js.map