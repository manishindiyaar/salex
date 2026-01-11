"use strict";
/**
 * Admin Module Management Controller
 *
 * Handles admin operations for business module configuration including:
 * - Getting business module configurations
 * - Updating module enablement for businesses
 * - Logging module changes for audit
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminModuleController = void 0;
const zod_1 = require("zod");
const shared_types_1 = require("@salex/shared-types");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const audit_log_service_1 = require("../services/audit-log.service");
// Validation schemas
const UpdateModulesSchema = zod_1.z.object({
    modules: zod_1.z.array(zod_1.z.object({
        moduleCode: zod_1.z.string().min(1),
        isEnabled: zod_1.z.boolean(),
    })).min(1),
    reason: zod_1.z.string().min(1, 'Reason is required for module changes'),
});
class AdminModuleController {
    /**
     * GET /v1/admin/businesses/:id/modules
     * Get business module configurations
     */
    async getBusinessModules(req, res) {
        try {
            const { id: businessId } = req.params;
            // Verify business exists
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id: businessId },
                select: {
                    id: true,
                    name: true,
                    category: true,
                },
            });
            if (!business) {
                throw new errors_1.NotFoundError('Business not found');
            }
            // Get all available feature modules
            const allModules = await shared_types_1.prisma.featureModule.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            // Get business module configurations
            const businessModules = await shared_types_1.prisma.businessModuleConfig.findMany({
                where: { businessId },
            });
            // Create a map of module configurations
            const moduleConfigMap = businessModules.reduce((acc, config) => {
                acc[config.moduleCode] = config;
                return acc;
            }, {});
            // Combine all modules with business-specific configurations
            const modulesWithConfig = allModules.map(module => {
                const businessConfig = moduleConfigMap[module.code];
                return {
                    code: module.code,
                    name: module.name,
                    description: module.description,
                    plans: module.plans,
                    isEnabled: businessConfig ? businessConfig.isEnabled : false,
                    configuredAt: businessConfig?.createdAt || null,
                    lastUpdated: businessConfig?.updatedAt || null,
                };
            });
            res.json({
                success: true,
                data: {
                    business: {
                        id: business.id,
                        name: business.name,
                        category: business.category,
                    },
                    modules: modulesWithConfig,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * PATCH /v1/admin/businesses/:id/modules
     * Update business module configurations
     */
    async updateBusinessModules(req, res) {
        try {
            const { id: businessId } = req.params;
            const { modules, reason } = UpdateModulesSchema.parse(req.body);
            // Verify business exists
            const business = await shared_types_1.prisma.business.findUnique({
                where: { id: businessId },
                select: { id: true, name: true },
            });
            if (!business) {
                throw new errors_1.NotFoundError('Business not found');
            }
            // Verify all module codes exist
            const modulesCodes = modules.map(m => m.moduleCode);
            const existingModules = await shared_types_1.prisma.featureModule.findMany({
                where: {
                    code: { in: modulesCodes },
                    isActive: true,
                },
                select: { code: true },
            });
            const existingCodes = existingModules.map(m => m.code);
            const invalidCodes = modulesCodes.filter(code => !existingCodes.includes(code));
            if (invalidCodes.length > 0) {
                throw new errors_1.ValidationError(`Invalid module codes: ${invalidCodes.join(', ')}`);
            }
            // Get current module configurations for audit log
            const currentConfigs = await shared_types_1.prisma.businessModuleConfig.findMany({
                where: {
                    businessId,
                    moduleCode: { in: modulesCodes },
                },
            });
            const currentConfigMap = currentConfigs.reduce((acc, config) => {
                acc[config.moduleCode] = config.isEnabled;
                return acc;
            }, {});
            // Update module configurations in a transaction
            const updatedConfigs = await shared_types_1.prisma.$transaction(async (tx) => {
                const results = [];
                for (const moduleUpdate of modules) {
                    const { moduleCode, isEnabled } = moduleUpdate;
                    // Upsert module configuration
                    const config = await tx.businessModuleConfig.upsert({
                        where: {
                            businessId_moduleCode: {
                                businessId,
                                moduleCode,
                            },
                        },
                        update: {
                            isEnabled,
                        },
                        create: {
                            businessId,
                            moduleCode,
                            isEnabled,
                        },
                    });
                    results.push(config);
                }
                return results;
            });
            // Prepare changes for audit log
            const changes = modules.map(moduleUpdate => {
                const { moduleCode, isEnabled } = moduleUpdate;
                const previousValue = currentConfigMap[moduleCode] ?? false;
                return {
                    moduleCode,
                    isEnabled: {
                        from: previousValue,
                        to: isEnabled,
                    },
                };
            }).filter(change => change.isEnabled.from !== change.isEnabled.to);
            // Log the action if there were actual changes
            if (changes.length > 0) {
                await audit_log_service_1.auditLogService.logAction({
                    adminId: req.admin.adminId,
                    action: 'UPDATE_BUSINESS_MODULES',
                    entityType: 'Business',
                    entityId: businessId,
                    changes: {
                        businessName: business.name,
                        moduleChanges: changes,
                    },
                    reason,
                });
            }
            logger_1.logger.info({
                adminId: req.admin.adminId,
                businessId,
                moduleChanges: changes.length,
                reason,
            }, 'Business module configurations updated by admin');
            res.json({
                success: true,
                data: {
                    updatedConfigs,
                    changesApplied: changes.length,
                },
                message: `${changes.length} module configuration(s) updated successfully`,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new errors_1.ValidationError('Invalid module update data', error.errors);
            }
            throw error;
        }
    }
    /**
     * GET /v1/admin/modules
     * Get all available feature modules
     */
    async getAllModules(req, res) {
        try {
            const modules = await shared_types_1.prisma.featureModule.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            // Get usage statistics for each module
            const modulesWithStats = await Promise.all(modules.map(async (module) => {
                const businessCount = await shared_types_1.prisma.businessModuleConfig.count({
                    where: {
                        moduleCode: module.code,
                        isEnabled: true,
                    },
                });
                return {
                    ...module,
                    enabledBusinessCount: businessCount,
                };
            }));
            res.json({
                success: true,
                data: {
                    modules: modulesWithStats,
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * GET /v1/admin/modules/:code/businesses
     * Get businesses that have a specific module enabled
     */
    async getModuleBusinesses(req, res) {
        try {
            const { code: moduleCode } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const offset = (pageNum - 1) * limitNum;
            // Verify module exists
            const module = await shared_types_1.prisma.featureModule.findUnique({
                where: { code: moduleCode },
            });
            if (!module) {
                throw new errors_1.NotFoundError('Module not found');
            }
            // Get businesses with this module enabled
            const [businessConfigs, totalCount] = await Promise.all([
                shared_types_1.prisma.businessModuleConfig.findMany({
                    where: {
                        moduleCode,
                        isEnabled: true,
                    },
                    include: {
                        business: {
                            select: {
                                id: true,
                                name: true,
                                phoneNumber: true,
                                routingCode: true,
                                category: true,
                                isActive: true,
                                createdAt: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: offset,
                    take: limitNum,
                }),
                shared_types_1.prisma.businessModuleConfig.count({
                    where: {
                        moduleCode,
                        isEnabled: true,
                    },
                }),
            ]);
            const businesses = businessConfigs.map(config => ({
                ...config.business,
                moduleEnabledAt: config.createdAt,
                moduleLastUpdated: config.updatedAt,
            }));
            const totalPages = Math.ceil(totalCount / limitNum);
            res.json({
                success: true,
                data: {
                    module: {
                        code: module.code,
                        name: module.name,
                        description: module.description,
                    },
                    businesses,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        totalCount,
                        totalPages,
                        hasNext: pageNum < totalPages,
                        hasPrev: pageNum > 1,
                    },
                },
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.adminModuleController = new AdminModuleController();
//# sourceMappingURL=admin-module.controller.js.map