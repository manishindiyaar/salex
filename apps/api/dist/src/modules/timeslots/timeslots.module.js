"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlotsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const timeslots_controller_1 = require("./timeslots.controller");
const timeslots_service_1 = require("./timeslots.service");
const prisma_service_1 = require("../../core/prisma.service");
const auth_module_1 = require("../auth/auth.module");
let TimeSlotsModule = class TimeSlotsModule {
};
exports.TimeSlotsModule = TimeSlotsModule;
exports.TimeSlotsModule = TimeSlotsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, auth_module_1.AuthModule],
        controllers: [timeslots_controller_1.TimeSlotsController],
        providers: [
            timeslots_service_1.TimeSlotsService,
            prisma_service_1.PrismaService,
        ],
        exports: [timeslots_service_1.TimeSlotsService],
    })
], TimeSlotsModule);
//# sourceMappingURL=timeslots.module.js.map