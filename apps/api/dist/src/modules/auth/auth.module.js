"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_controller_1 = require("./auth.controller");
const user_service_1 = require("./user.service");
const firebase_auth_guard_1 = require("./firebase-auth.guard");
const conditional_auth_guard_1 = require("./conditional-auth.guard");
const prisma_service_1 = require("../../core/prisma.service");
const firebase_admin_service_1 = require("./firebase-admin.service");
const firebase_controller_1 = require("./firebase.controller");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [auth_controller_1.AuthController, firebase_controller_1.FirebaseController],
        providers: [
            prisma_service_1.PrismaService,
            user_service_1.UserService,
            firebase_admin_service_1.FirebaseAdminService,
            firebase_auth_guard_1.FirebaseAuthGuard,
            conditional_auth_guard_1.ConditionalAuthGuard,
        ],
        exports: [
            user_service_1.UserService,
            firebase_admin_service_1.FirebaseAdminService,
            firebase_auth_guard_1.FirebaseAuthGuard,
            conditional_auth_guard_1.ConditionalAuthGuard,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map