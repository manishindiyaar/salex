"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const business_controller_1 = require("./business.controller");
const public_routing_controller_1 = require("./public-routing.controller");
const business_service_1 = require("./business.service");
const business_routing_service_1 = require("./business-routing.service");
const qr_code_service_1 = require("./qr-code.service");
const prisma_service_1 = require("../../core/prisma.service");
const auth_module_1 = require("../auth/auth.module");
let BusinessModule = class BusinessModule {
};
exports.BusinessModule = BusinessModule;
exports.BusinessModule = BusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, auth_module_1.AuthModule],
        controllers: [business_controller_1.BusinessController, public_routing_controller_1.PublicRoutingController],
        providers: [
            business_service_1.BusinessService,
            business_routing_service_1.BusinessRoutingService,
            qr_code_service_1.QRCodeService,
            prisma_service_1.PrismaService,
        ],
        exports: [business_service_1.BusinessService, business_routing_service_1.BusinessRoutingService, qr_code_service_1.QRCodeService],
    })
], BusinessModule);
//# sourceMappingURL=business.module.js.map