"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessMeResponseDto = exports.AuthUserResponseDto = void 0;
class AuthUserResponseDto {
    constructor(user) {
        this.id = user.id;
        this.phoneNumber = user.phoneNumber;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
        this.businesses = user.businesses;
    }
}
exports.AuthUserResponseDto = AuthUserResponseDto;
class BusinessMeResponseDto {
    constructor(user) {
        this.user = new AuthUserResponseDto(user);
        this.business = user.businesses && user.businesses.length > 0 ? user.businesses[0] : null;
    }
}
exports.BusinessMeResponseDto = BusinessMeResponseDto;
//# sourceMappingURL=auth-response.dto.js.map