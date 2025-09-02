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
exports.UpdateServiceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateServiceDto {
}
exports.UpdateServiceDto = UpdateServiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 50, { message: 'Service name must be between 1 and 50 characters' }),
    __metadata("design:type", String)
], UpdateServiceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Price must have at most 2 decimal places' }),
    (0, class_validator_1.Min)(0.01, { message: 'Price must be at least $0.01' }),
    (0, class_validator_1.Max)(99999.99, { message: 'Price must not exceed $99,999.99' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateServiceDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Duration must be a number' }),
    (0, class_validator_1.Min)(15, { message: 'Duration must be at least 15 minutes' }),
    (0, class_validator_1.Max)(480, { message: 'Duration must not exceed 480 minutes (8 hours)' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateServiceDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500, { message: 'Description must not exceed 500 characters' }),
    __metadata("design:type", String)
], UpdateServiceDto.prototype, "description", void 0);
//# sourceMappingURL=update-service.dto.js.map