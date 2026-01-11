"use strict";
/**
 * User Service
 *
 * Handles user CRUD operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
class UserService {
    /**
     * Find user by phone number
     */
    async findByPhone(phone) {
        return shared_types_1.prisma.user.findUnique({
            where: { phone },
        });
    }
    /**
     * Find user by ID
     */
    async findById(id) {
        return shared_types_1.prisma.user.findUnique({
            where: { id },
        });
    }
    /**
     * Find or create user by phone number
     * Used during OTP verification
     */
    async findOrCreate(phone) {
        let user = await this.findByPhone(phone);
        if (!user) {
            user = await shared_types_1.prisma.user.create({
                data: {
                    phone,
                    role: 'OWNER',
                },
            });
            logger_1.logger.info({ userId: user.id, phone }, 'New user created');
        }
        else {
            logger_1.logger.info({ userId: user.id, phone }, 'Existing user found');
        }
        return user;
    }
    /**
     * Get user with their businesses
     */
    async findWithBusinesses(userId) {
        return shared_types_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                businesses: {
                    include: {
                        services: {
                            where: { isActive: true },
                        },
                    },
                },
            },
        });
    }
    /**
     * Update user role
     */
    async updateRole(userId, role) {
        return shared_types_1.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    }
}
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map