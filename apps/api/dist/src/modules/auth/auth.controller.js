"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const conditional_auth_guard_1 = require("./conditional-auth.guard");
const user_service_1 = require("./user.service");
let AuthController = AuthController_1 = class AuthController {
    constructor(userService) {
        this.userService = userService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async getCurrentUser(req) {
        this.logger.debug(`Getting current user profile for: ${req.user.id}`);
        try {
            const userResponse = {
                id: req.user.id,
                phoneNumber: req.user.phoneNumber,
                createdAt: req.user.createdAt,
                updatedAt: req.user.updatedAt,
            };
            return {
                success: true,
                data: userResponse,
                message: 'User profile retrieved successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to get current user: ${error.message}`, error.stack);
            return {
                success: false,
                error: 'Failed to retrieve user profile',
            };
        }
    }
    async healthCheck(req) {
        return {
            success: true,
            data: {
                status: 'authenticated',
                userId: req.user.id,
            },
            message: 'Authentication is working correctly',
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('auth/me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Get)('auth/health'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "healthCheck", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('api/v1'),
    (0, common_1.UseGuards)(conditional_auth_guard_1.ConditionalAuthGuard),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map