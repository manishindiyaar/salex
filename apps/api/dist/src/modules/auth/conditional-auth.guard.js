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
var ConditionalAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_auth_guard_1 = require("./firebase-auth.guard");
let ConditionalAuthGuard = ConditionalAuthGuard_1 = class ConditionalAuthGuard {
    constructor(configService, firebaseAuthGuard) {
        this.configService = configService;
        this.firebaseAuthGuard = firebaseAuthGuard;
        this.logger = new common_1.Logger(ConditionalAuthGuard_1.name);
    }
    async canActivate(context) {
        const isAuthEnabled = this.configService.get('ENABLE_AUTH') === 'true';
        if (!isAuthEnabled) {
            this.logger.debug('Authentication is disabled via ENABLE_AUTH environment variable');
            const request = context.switchToHttp().getRequest();
            request.user = {
                id: 'test-user-id',
                phoneNumber: '+1234567890',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            request.auth = {
                uid: 'test-firebase-uid',
                token: 'mock-token',
            };
            return true;
        }
        this.logger.debug('Authentication is enabled, delegating to FirebaseAuthGuard');
        return this.firebaseAuthGuard.canActivate(context);
    }
};
exports.ConditionalAuthGuard = ConditionalAuthGuard;
exports.ConditionalAuthGuard = ConditionalAuthGuard = ConditionalAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        firebase_auth_guard_1.FirebaseAuthGuard])
], ConditionalAuthGuard);
//# sourceMappingURL=conditional-auth.guard.js.map