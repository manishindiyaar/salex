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
exports.WhatsAppVerificationDto = exports.WhatsAppWebhookPayloadDto = exports.WhatsAppEntryDto = exports.WhatsAppChangeDto = exports.WhatsAppValueDto = exports.WhatsAppMetadataDto = exports.WhatsAppMessageDto = exports.WhatsAppStatusDto = exports.WhatsAppInteractiveDto = exports.WhatsAppListReplyDto = exports.WhatsAppButtonReplyDto = exports.WhatsAppTextDto = exports.WhatsAppContactDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class WhatsAppContactDto {
}
exports.WhatsAppContactDto = WhatsAppContactDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppContactDto.prototype, "profile", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppContactDto.prototype, "wa_id", void 0);
class WhatsAppTextDto {
}
exports.WhatsAppTextDto = WhatsAppTextDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppTextDto.prototype, "body", void 0);
class WhatsAppButtonReplyDto {
}
exports.WhatsAppButtonReplyDto = WhatsAppButtonReplyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppButtonReplyDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppButtonReplyDto.prototype, "title", void 0);
class WhatsAppListReplyDto {
}
exports.WhatsAppListReplyDto = WhatsAppListReplyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppListReplyDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppListReplyDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppListReplyDto.prototype, "description", void 0);
class WhatsAppInteractiveDto {
}
exports.WhatsAppInteractiveDto = WhatsAppInteractiveDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppInteractiveDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WhatsAppButtonReplyDto),
    __metadata("design:type", WhatsAppButtonReplyDto)
], WhatsAppInteractiveDto.prototype, "button_reply", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WhatsAppListReplyDto),
    __metadata("design:type", WhatsAppListReplyDto)
], WhatsAppInteractiveDto.prototype, "list_reply", void 0);
class WhatsAppStatusDto {
}
exports.WhatsAppStatusDto = WhatsAppStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppStatusDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppStatusDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppStatusDto.prototype, "recipient_id", void 0);
class WhatsAppMessageDto {
}
exports.WhatsAppMessageDto = WhatsAppMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppMessageDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppMessageDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppMessageDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WhatsAppTextDto),
    __metadata("design:type", WhatsAppTextDto)
], WhatsAppMessageDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WhatsAppInteractiveDto),
    __metadata("design:type", WhatsAppInteractiveDto)
], WhatsAppMessageDto.prototype, "interactive", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppMessageDto.prototype, "type", void 0);
class WhatsAppMetadataDto {
}
exports.WhatsAppMetadataDto = WhatsAppMetadataDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppMetadataDto.prototype, "display_phone_number", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppMetadataDto.prototype, "phone_number_id", void 0);
class WhatsAppValueDto {
}
exports.WhatsAppValueDto = WhatsAppValueDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppValueDto.prototype, "messaging_product", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WhatsAppMetadataDto),
    __metadata("design:type", WhatsAppMetadataDto)
], WhatsAppValueDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WhatsAppContactDto),
    __metadata("design:type", Array)
], WhatsAppValueDto.prototype, "contacts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WhatsAppMessageDto),
    __metadata("design:type", Array)
], WhatsAppValueDto.prototype, "messages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WhatsAppStatusDto),
    __metadata("design:type", Array)
], WhatsAppValueDto.prototype, "statuses", void 0);
class WhatsAppChangeDto {
}
exports.WhatsAppChangeDto = WhatsAppChangeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppChangeDto.prototype, "field", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WhatsAppValueDto),
    __metadata("design:type", WhatsAppValueDto)
], WhatsAppChangeDto.prototype, "value", void 0);
class WhatsAppEntryDto {
}
exports.WhatsAppEntryDto = WhatsAppEntryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppEntryDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WhatsAppChangeDto),
    __metadata("design:type", Array)
], WhatsAppEntryDto.prototype, "changes", void 0);
class WhatsAppWebhookPayloadDto {
}
exports.WhatsAppWebhookPayloadDto = WhatsAppWebhookPayloadDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppWebhookPayloadDto.prototype, "object", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WhatsAppEntryDto),
    __metadata("design:type", Array)
], WhatsAppWebhookPayloadDto.prototype, "entry", void 0);
class WhatsAppVerificationDto {
}
exports.WhatsAppVerificationDto = WhatsAppVerificationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppVerificationDto.prototype, "hub.mode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppVerificationDto.prototype, "hub.challenge", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WhatsAppVerificationDto.prototype, "hub.verify_token", void 0);
//# sourceMappingURL=whatsapp-webhook.dto.js.map