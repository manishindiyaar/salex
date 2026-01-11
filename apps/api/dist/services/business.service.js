"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessService = void 0;
const shared_types_1 = require("@salex/shared-types");
const routing_service_1 = require("./routing.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
/**
 * Ensure dev user exists in database (for development mode only)
 */
async function ensureDevUserExists(userId, phone) {
    const config = (0, config_1.getConfig)();
    if (!(0, config_1.isDevelopment)() || config.enableAuth) {
        return; // Only in dev mode with auth disabled
    }
    const existingUser = await shared_types_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        logger_1.logger.info({ userId, phone }, '🔧 Creating dev user for testing');
        await shared_types_1.prisma.user.create({
            data: {
                id: userId,
                phone,
                role: 'OWNER',
            },
        });
    }
}
class BusinessService {
    /**
     * Create a new business for a merchant
     * Auto-generates routing code if not provided
     */
    async create(ownerId, data) {
        // In dev mode, ensure the mock user exists
        await ensureDevUserExists(ownerId, '+919876543210');
        // Check if user already has a business
        const existingBusiness = await shared_types_1.prisma.business.findFirst({
            where: { ownerId },
        });
        if (existingBusiness) {
            throw new errors_1.ConflictError('User already has a business registered');
        }
        // Generate routing code if not provided
        const routingCode = data.routingCode || await routing_service_1.routingService.generateUniqueCode();
        // Check if provided routing code is already taken
        if (data.routingCode) {
            const isTaken = await routing_service_1.routingService.isCodeTaken(data.routingCode);
            if (isTaken) {
                throw new errors_1.ConflictError(`Routing code ${data.routingCode} is already in use`);
            }
        }
        const business = await shared_types_1.prisma.business.create({
            data: {
                ownerId,
                name: data.name,
                phoneNumber: data.phoneNumber,
                routingCode,
                hoursOfOperation: data.hoursOfOperation ?? undefined,
                maxConcurrentBookings: data.maxConcurrentBookings ?? 1,
                isAcceptingOrders: data.isAcceptingOrders ?? true,
            },
            include: {
                services: true,
            },
        });
        logger_1.logger.info({ businessId: business.id, ownerId, routingCode }, 'Business created');
        return business;
    }
    /**
     * Get business by owner ID (for merchant dashboard)
     * Includes services for display
     */
    async getByOwnerId(ownerId) {
        const business = await shared_types_1.prisma.business.findFirst({
            where: { ownerId },
            include: {
                services: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                },
            },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found for this user');
        }
        return business;
    }
    /**
     * Get business by ID
     */
    async getById(id) {
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id },
            include: {
                services: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                },
            },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        return business;
    }
    /**
     * Get business by routing code (for WhatsApp bot)
     * Public access - no auth required
     */
    async getByRoutingCode(code) {
        if (!routing_service_1.routingService.isValidFormat(code)) {
            throw new errors_1.BusinessRuleError('Invalid routing code format. Must be 4 digits.');
        }
        const business = await shared_types_1.prisma.business.findUnique({
            where: { routingCode: code },
            select: {
                id: true,
                name: true,
                phoneNumber: true,
                routingCode: true,
                isAcceptingOrders: true,
                hoursOfOperation: true,
                services: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        durationMinutes: true,
                    },
                    orderBy: { name: 'asc' },
                },
            },
        });
        if (!business) {
            throw new errors_1.NotFoundError(`No business found with routing code: ${code}`);
        }
        return business;
    }
    /**
     * Update business details
     * Only owner can update their business
     */
    async update(id, ownerId, data) {
        // Verify ownership
        const business = await shared_types_1.prisma.business.findUnique({
            where: { id },
        });
        if (!business) {
            throw new errors_1.NotFoundError('Business not found');
        }
        if (business.ownerId !== ownerId) {
            throw new errors_1.BusinessRuleError('You can only update your own business');
        }
        // Check routing code uniqueness if being changed
        if (data.routingCode && data.routingCode !== business.routingCode) {
            const isTaken = await routing_service_1.routingService.isCodeTaken(data.routingCode);
            if (isTaken) {
                throw new errors_1.ConflictError(`Routing code ${data.routingCode} is already in use`);
            }
        }
        // Build update data
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.phoneNumber !== undefined)
            updateData.phoneNumber = data.phoneNumber;
        if (data.routingCode !== undefined)
            updateData.routingCode = data.routingCode;
        if (data.hoursOfOperation !== undefined)
            updateData.hoursOfOperation = data.hoursOfOperation;
        if (data.maxConcurrentBookings !== undefined)
            updateData.maxConcurrentBookings = data.maxConcurrentBookings;
        if (data.isAcceptingOrders !== undefined)
            updateData.isAcceptingOrders = data.isAcceptingOrders;
        const updated = await shared_types_1.prisma.business.update({
            where: { id },
            data: updateData,
            include: {
                services: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                },
            },
        });
        logger_1.logger.info({ businessId: id, ownerId }, 'Business updated');
        return updated;
    }
}
exports.businessService = new BusinessService();
//# sourceMappingURL=business.service.js.map