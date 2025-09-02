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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBusinessHoursRequestDto = exports.UpdateBusinessHoursDto = exports.DayScheduleDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class DayScheduleDto {
}
exports.DayScheduleDto = DayScheduleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Open time must be in HH:MM format (24-hour)'
    }),
    __metadata("design:type", String)
], DayScheduleDto.prototype, "open", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Close time must be in HH:MM format (24-hour)'
    }),
    __metadata("design:type", String)
], DayScheduleDto.prototype, "close", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DayScheduleDto.prototype, "closed", void 0);
class UpdateBusinessHoursDto {
}
exports.UpdateBusinessHoursDto = UpdateBusinessHoursDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "monday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "tuesday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "wednesday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "thursday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "friday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "saturday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DayScheduleDto),
    __metadata("design:type", DayScheduleDto)
], UpdateBusinessHoursDto.prototype, "sunday", void 0);
class UpdateBusinessHoursRequestDto {
}
exports.UpdateBusinessHoursRequestDto = UpdateBusinessHoursRequestDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => UpdateBusinessHoursDto),
    __metadata("design:type", UpdateBusinessHoursDto)
], UpdateBusinessHoursRequestDto.prototype, "hoursOfOperation", void 0);
//# sourceMappingURL=update-business-hours.dto.js.map