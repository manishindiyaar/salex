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
exports.getServiceTemplatesByBusinessType = exports.CLINIC_TEMPLATES = exports.BARBER_SHOP_TEMPLATES = exports.SPA_TEMPLATES = exports.SALON_TEMPLATES = exports.TemplatesByBusinessType = exports.BusinessTypeTemplatesList = exports.ServiceTemplateItem = exports.UpdateBatchServicesDto = exports.BulkCreateServicesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class BulkServiceItem {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 50, { message: 'Service name must be between 3 and 50 characters' }),
    __metadata("design:type", String)
], BulkServiceItem.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(9999.99),
    __metadata("design:type", Number)
], BulkServiceItem.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], BulkServiceItem.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 200, { message: 'Description must be under 200 characters' }),
    __metadata("design:type", String)
], BulkServiceItem.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 30, { message: 'Category must be between 3 and 30 characters' }),
    __metadata("design:type", String)
], BulkServiceItem.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkServiceItem.prototype, "imageUrl", void 0);
class BulkCreateServicesDto {
}
exports.BulkCreateServicesDto = BulkCreateServicesDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkCreateServicesDto.prototype, "businessId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkServiceItem),
    __metadata("design:type", Array)
], BulkCreateServicesDto.prototype, "services", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkCreateServicesDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkCreateServicesDto.prototype, "batchId", void 0);
class UpdateBatchServicesDto {
}
exports.UpdateBatchServicesDto = UpdateBatchServicesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkServiceItem),
    __metadata("design:type", Array)
], UpdateBatchServicesDto.prototype, "services", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Boolean)
], UpdateBatchServicesDto.prototype, "removeUnspecified", void 0);
class ServiceTemplateItem {
}
exports.ServiceTemplateItem = ServiceTemplateItem;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServiceTemplateItem.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(9999.99),
    __metadata("design:type", Number)
], ServiceTemplateItem.prototype, "defaultPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(480),
    __metadata("design:type", Number)
], ServiceTemplateItem.prototype, "defaultDuration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServiceTemplateItem.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServiceTemplateItem.prototype, "category", void 0);
class BusinessTypeTemplatesList {
}
exports.BusinessTypeTemplatesList = BusinessTypeTemplatesList;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BusinessTypeTemplatesList.prototype, "businessType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BusinessTypeTemplatesList.prototype, "templates", void 0);
class TemplatesByBusinessType {
}
exports.TemplatesByBusinessType = TemplatesByBusinessType;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TemplatesByBusinessType.prototype, "businessType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], TemplatesByBusinessType.prototype, "templates", void 0);
exports.SALON_TEMPLATES = [
    {
        name: 'Haircut',
        defaultPrice: 25.0,
        defaultDuration: 45,
        description: 'Professional haircut with styling consultation',
        category: 'Hair Styling'
    },
    {
        name: 'Hair Wash & Styling',
        defaultPrice: 20.0,
        defaultDuration: 30,
        description: 'Hair washing and professional styling',
        category: 'Hair Styling'
    },
    {
        name: 'Facial',
        defaultPrice: 50.0,
        defaultDuration: 60,
        description: 'Deep cleansing facial treatment',
        category: 'Skin Care'
    },
    {
        name: 'Hair Color',
        defaultPrice: 100.0,
        defaultDuration: 120,
        description: 'Professional hair coloring service',
        category: 'Hair Coloring'
    },
    {
        name: 'Manicure',
        defaultPrice: 25.0,
        defaultDuration: 45,
        description: 'Nail cleaning, shaping, and polishing',
        category: 'Nail Care'
    },
    {
        name: 'Pedicure',
        defaultPrice: 30.0,
        defaultDuration: 45,
        description: 'Foot bath, nail care, and exfoliation',
        category: 'Nail Care'
    }
];
exports.SPA_TEMPLATES = [
    {
        name: 'Relaxation Massage',
        defaultPrice: 80.0,
        defaultDuration: 60,
        description: 'Full body relaxation massage with aromatherapy',
        category: 'Massage Therapy'
    },
    {
        name: 'Deep Tissue Massage',
        defaultPrice: 120.0,
        defaultDuration: 90,
        description: 'Targeted massage for muscle tension relief',
        category: 'Massage Therapy'
    },
    {
        name: 'Facial Treatment',
        defaultPrice: 75.0,
        defaultDuration: 75,
        description: 'Customized facial treatment for skin rejuvenation',
        category: 'Skin Care'
    },
    {
        name: 'Body Scrub',
        defaultPrice: 60.0,
        defaultDuration: 45,
        description: 'Full body exfoliation and moisturization',
        category: 'Body Treatments'
    }
];
exports.BARBER_SHOP_TEMPLATES = [
    {
        name: 'Men\'s Haircut',
        defaultPrice: 20.0,
        defaultDuration: 30,
        description: 'Men\'s professional haircut with styling',
        category: 'Hair Services'
    },
    {
        name: 'Beard Trim',
        defaultPrice: 15.0,
        defaultDuration: 15,
        description: 'Beard shaping and grooming',
        category: 'Beard Services'
    },
    {
        name: 'Hot Towel Shave',
        defaultPrice: 35.0,
        defaultDuration: 30,
        description: 'Traditional hot towel shave service',
        category: 'Shaving Services'
    }
];
exports.CLINIC_TEMPLATES = [
    {
        name: 'Consultation',
        defaultPrice: 50.0,
        defaultDuration: 30,
        description: 'Professional skin consultation and analysis',
        category: 'Consultation'
    },
    {
        name: 'Chemical Peel',
        defaultPrice: 150.0,
        defaultDuration: 90,
        description: 'Advanced chemical peel treatment',
        category: 'Skin Treatments'
    },
    {
        name: 'Microdermabrasion',
        defaultPrice: 100.0,
        defaultDuration: 60,
        description: 'Professional microdermabrasion treatment',
        category: 'Skin Treatments'
    }
];
const getServiceTemplatesByBusinessType = (businessType) => {
    switch (businessType.toUpperCase()) {
        case 'SPA':
            return exports.SPA_TEMPLATES;
        case 'BARBER_SHOP':
            return exports.BARBER_SHOP_TEMPLATES;
        case 'CLINIC':
            return exports.CLINIC_TEMPLATES;
        case 'SALON':
        default:
            return exports.SALON_TEMPLATES;
    }
};
exports.getServiceTemplatesByBusinessType = getServiceTemplatesByBusinessType;
//# sourceMappingURL=bulk-service.dto.js.map