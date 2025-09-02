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
exports.CreateOnboardingBusinessDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const shared_types_1 = require("shared-types");
class Address {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(10, 200, { message: 'Address must be between 10 and 200 characters' }),
    __metadata("design:type", String)
], Address.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 50, { message: 'City must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], Address.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 50, { message: 'State must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], Address.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 10, { message: 'ZIP code must be between 5 and 10 characters' }),
    (0, class_validator_1.Matches)(/^\d{5,10}$/, { message: 'ZIP code must be numeric' }),
    __metadata("design:type", String)
], Address.prototype, "zip", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 50, { message: 'Country must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], Address.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], Address.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], Address.prototype, "longitude", void 0);
class ServiceDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(3, 50, { message: 'Service name must be between 3 and 50 characters' }),
    __metadata("design:type", String)
], ServiceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(9999.99),
    __metadata("design:type", Number)
], ServiceDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], ServiceDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200, { message: 'Description must be under 200 characters' }),
    __metadata("design:type", String)
], ServiceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 30, { message: 'Category must be between 3 and 30 characters' }),
    __metadata("design:type", String)
], ServiceDto.prototype, "category", void 0);
class ContactInfo {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[+]([1-9]\\d{1,3})\\s?\\d{6,14}$/, {
        message: 'Primary phone must be in international format'
    }),
    __metadata("design:type", String)
], ContactInfo.prototype, "primaryPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[+]([1-9]\\d{1,3})\\s?\\d{6,14}$/, {
        message: 'WhatsApp number must be in international format'
    }),
    __metadata("design:type", String)
], ContactInfo.prototype, "whatsApp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ContactInfo.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200, { message: 'Notes must be under 200 characters' }),
    __metadata("design:type", String)
], ContactInfo.prototype, "notes", void 0);
class SocialLinks {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'] }, { message: 'Website must be a valid URL' }),
    __metadata("design:type", String)
], SocialLinks.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'] }, { message: 'Facebook must be a valid URL' }),
    __metadata("design:type", String)
], SocialLinks.prototype, "facebook", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'] }, { message: 'Instagram must be a valid URL' }),
    __metadata("design:type", String)
], SocialLinks.prototype, "instagram", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'] }, { message: 'LinkedIn must be a valid URL' }),
    __metadata("design:type", String)
], SocialLinks.prototype, "linkedIn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'] }, { message: 'Twitter must be a valid URL' }),
    __metadata("design:type", String)
], SocialLinks.prototype, "twitter", void 0);
class OnboardingStepData {
}
__decorate([
    (0, class_validator_1.IsEnum)(['step1_business_identity', 'step2_contact_location', 'step3_services', 'step4_hours', 'step5_review']),
    __metadata("design:type", String)
], OnboardingStepData.prototype, "currentStep", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OnboardingStepData.prototype, "step1_business_identity", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OnboardingStepData.prototype, "step2_contact_location", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OnboardingStepData.prototype, "step3_services", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OnboardingStepData.prototype, "step4_hours", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OnboardingStepData.prototype, "step5_review", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardingStepData.prototype, "completedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardingStepData.prototype, "startedAt", void 0);
class CreateOnboardingBusinessDto {
}
exports.CreateOnboardingBusinessDto = CreateOnboardingBusinessDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 100, { message: 'Business name must be between 2 and 100 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(0, 200, { message: 'Tagline must be under 200 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "tagline", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(shared_types_1.BusinessType, { message: 'Invalid business type' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "businessType", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => Address),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Address)
], CreateOnboardingBusinessDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ContactInfo),
    __metadata("design:type", ContactInfo)
], CreateOnboardingBusinessDto.prototype, "contactInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SocialLinks),
    __metadata("design:type", SocialLinks)
], CreateOnboardingBusinessDto.prototype, "socialLinks", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(0, 1000, { message: 'Description must be under 1000 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ServiceDto),
    __metadata("design:type", Array)
], CreateOnboardingBusinessDto.prototype, "services", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateOnboardingBusinessDto.prototype, "hoursOfOperation", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 50, { message: 'Business category must be between 2 and 50 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 30, { message: 'Subcategory must be between 2 and 30 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "subcategory", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OnboardingStepData),
    __metadata("design:type", OnboardingStepData)
], CreateOnboardingBusinessDto.prototype, "onboardingProgress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(3, 50, { message: 'Logo URL must be accessible' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(3, 50, { message: 'Cover image URL must be accessible' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "coverImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.Length)(1, 3, { each: true, message: 'Keywords must be 1-3 characters' }),
    __metadata("design:type", Array)
], CreateOnboardingBusinessDto.prototype, "businessKeywords", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 20, { message: 'Currency must be 2-3 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(2, 50, { message: 'Language preference must be 2-50 characters' }),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOnboardingBusinessDto.prototype, "isAutoGenerated", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOnboardingBusinessDto.prototype, "isPublished", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOnboardingBusinessDto.prototype, "isVerified", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOnboardingBusinessDto.prototype, "notes", void 0);
//# sourceMappingURL=onboarding-business.dto.js.map