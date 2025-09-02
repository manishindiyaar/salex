"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const customer_session_service_1 = require("./customer-session.service");
const redis_session_service_1 = require("./redis-session.service");
const redis_service_1 = require("../../core/redis.service");
const prisma_service_1 = require("../../core/prisma.service");
let CustomerModule = class CustomerModule {
};
exports.CustomerModule = CustomerModule;
exports.CustomerModule = CustomerModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            customer_session_service_1.CustomerSessionService,
            redis_session_service_1.RedisSessionService,
            redis_service_1.RedisService,
            prisma_service_1.PrismaService
        ],
        exports: [
            customer_session_service_1.CustomerSessionService,
            redis_session_service_1.RedisSessionService,
            redis_service_1.RedisService
        ],
    })
], CustomerModule);
//# sourceMappingURL=customer.module.js.map