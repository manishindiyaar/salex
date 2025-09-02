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
exports.UpdateBusinessDto = exports.CreateBusinessDto = void 0;
const class_validator_1 = require("class-validator");
const shared_types_1 = require("shared-types");
class CreateBusinessDto {
}
exports.CreateBusinessDto = CreateBusinessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 100, { message: 'Business name must be between 2 and 100 characters' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(shared_types_1.BusinessType, { message: 'Invalid business type' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "businessType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{1,14}$/, {
        message: 'Phone number must be in E.164 format (e.g., +1234567890)'
    }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(10, 200, { message: 'Address must be between 10 and 200 characters' }),
    __metadata("design:type", String)
], CreateBusinessDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateBusinessDto.prototype, "hoursOfOperation", void 0);
class UpdateBusinessDto {
}
exports.UpdateBusinessDto = UpdateBusinessDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100, { message: 'Business name must be between 2 and 100 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(shared_types_1.BusinessType, { message: 'Invalid business type' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "businessType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{1,14}$/, {
        message: 'Phone number must be in E.164 format (e.g., +1234567890)'
    }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 200, { message: 'Address must be between 10 and 200 characters' }),
    __metadata("design:type", String)
], UpdateBusinessDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateBusinessDto.prototype, "hoursOfOperation", void 0);
//# sourceMappingURL=business.dto.js.map