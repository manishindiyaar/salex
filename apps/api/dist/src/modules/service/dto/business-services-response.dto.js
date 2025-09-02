"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessServicesResponseDto = void 0;
const service_response_dto_1 = require("./service-response.dto");
class BusinessServicesResponseDto {
    static create(businessId, services, summary, pagination) {
        return {
            businessId,
            services: services.map(service => service_response_dto_1.ServiceResponseDto.fromEntity(service)),
            summary,
            pagination,
        };
    }
}
exports.BusinessServicesResponseDto = BusinessServicesResponseDto;
//# sourceMappingURL=business-services-response.dto.js.map