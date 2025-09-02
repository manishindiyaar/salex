"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppSimulatorModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const simulator_controller_1 = require("./simulator.controller");
const whatsapp_simulator_controller_1 = require("./whatsapp-simulator.controller");
const webhook_enhancer_service_1 = require("./webhook-enhancer.service");
const mock_response_service_1 = require("./mock-response.service");
const message_type_router_service_1 = require("./services/message-type-router.service");
const business_api_router_service_1 = require("./services/business-api-router.service");
const business_response_transformer_service_1 = require("./services/business-response-transformer.service");
const simulator_message_store_service_1 = require("./services/simulator-message-store.service");
const prisma_service_1 = require("../../core/prisma.service");
const customer_module_1 = require("../customer/customer.module");
const business_module_1 = require("../business/business.module");
const booking_module_1 = require("../booking/booking.module");
const service_module_1 = require("../service/service.module");
const timeslots_module_1 = require("../timeslots/timeslots.module");
const message_routing_service_1 = require("./message-routing.service");
const booking_flow_service_1 = require("./services/booking-flow.service");
const simulator_webhook_controller_1 = require("./simulator-webhook.controller");
let WhatsAppSimulatorModule = class WhatsAppSimulatorModule {
};
exports.WhatsAppSimulatorModule = WhatsAppSimulatorModule;
exports.WhatsAppSimulatorModule = WhatsAppSimulatorModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, customer_module_1.CustomerModule, business_module_1.BusinessModule, booking_module_1.BookingModule, service_module_1.ServiceModule, timeslots_module_1.TimeSlotsModule],
        controllers: [simulator_controller_1.SimulatorController, whatsapp_simulator_controller_1.WhatsAppSimulatorController, simulator_webhook_controller_1.SimulatorWebhookController],
        providers: [
            webhook_enhancer_service_1.WebhookEnhancerService,
            mock_response_service_1.MockResponseService,
            message_routing_service_1.MessageRoutingService,
            message_type_router_service_1.MessageTypeRouterService,
            business_api_router_service_1.BusinessApiRouterService,
            business_response_transformer_service_1.BusinessResponseTransformerService,
            simulator_message_store_service_1.SimulatorMessageStoreService,
            booking_flow_service_1.BookingFlowService,
            prisma_service_1.PrismaService,
        ],
        exports: [
            webhook_enhancer_service_1.WebhookEnhancerService,
            mock_response_service_1.MockResponseService,
            message_type_router_service_1.MessageTypeRouterService,
            business_api_router_service_1.BusinessApiRouterService,
            business_response_transformer_service_1.BusinessResponseTransformerService,
        ],
    })
], WhatsAppSimulatorModule);
//# sourceMappingURL=whatsapp-simulator.module.js.map