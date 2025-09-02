"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./core/prisma.service");
const auth_module_1 = require("./modules/auth/auth.module");
const business_module_1 = require("./modules/business/business.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const timeslots_module_1 = require("./modules/timeslots/timeslots.module");
const service_module_1 = require("./modules/service/service.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const customer_module_1 = require("./modules/customer/customer.module");
const whatsapp_simulator_module_1 = require("./modules/whatsapp-simulator/whatsapp-simulator.module");
const booking_module_1 = require("./modules/booking/booking.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 10,
                },
                {
                    name: 'medium',
                    ttl: 60000,
                    limit: 100,
                },
                {
                    name: 'long',
                    ttl: 900000,
                    limit: 1000,
                },
            ]),
            auth_module_1.AuthModule,
            business_module_1.BusinessModule,
            whatsapp_module_1.WhatsAppModule,
            timeslots_module_1.TimeSlotsModule,
            service_module_1.ServiceModule,
            analytics_module_1.AnalyticsModule,
            customer_module_1.CustomerModule,
            whatsapp_simulator_module_1.WhatsAppSimulatorModule,
            booking_module_1.BookingModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            prisma_service_1.PrismaService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map