"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceResponseDto = void 0;
class ServiceResponseDto {
    static fromEntity(service) {
        return {
            id: service.id,
            businessId: service.businessId,
            name: service.name,
            price: parseFloat(service.price.toString()),
            durationMinutes: service.durationMinutes,
            description: service.description,
            createdAt: service.createdAt.toISOString(),
            updatedAt: service.updatedAt.toISOString(),
        };
    }
}
exports.ServiceResponseDto = ServiceResponseDto;
//# sourceMappingURL=service-response.dto.js.map