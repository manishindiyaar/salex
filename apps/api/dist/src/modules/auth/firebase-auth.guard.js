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
var FirebaseAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const firebase_admin_service_1 = require("./firebase-admin.service");
const user_service_1 = require("./user.service");
let FirebaseAuthGuard = FirebaseAuthGuard_1 = class FirebaseAuthGuard {
    constructor(firebaseAdmin, userService) {
        this.firebaseAdmin = firebaseAdmin;
        this.userService = userService;
        this.logger = new common_1.Logger(FirebaseAuthGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new common_1.UnauthorizedException('No authentication token provided.');
        }
        try {
            const decodedToken = await this.firebaseAdmin.verifyIdToken(token);
            const { uid, phone_number: phoneNumber } = decodedToken;
            if (!uid) {
                throw new common_1.UnauthorizedException('Invalid Firebase token: UID missing.');
            }
            this.logger.debug(`Token verified for Firebase UID: ${uid}`);
            const user = await this.userService.syncUserByFirebaseUid(uid, phoneNumber);
            if (!user) {
                throw new common_1.UnauthorizedException('User could not be found or created.');
            }
            request.user = user;
            request.auth = { uid, token };
            return true;
        }
        catch (error) {
            this.logger.error(`Firebase auth error: ${error.message}`);
            throw new common_1.UnauthorizedException('Firebase authentication failed.');
        }
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.FirebaseAuthGuard = FirebaseAuthGuard;
exports.FirebaseAuthGuard = FirebaseAuthGuard = FirebaseAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_admin_service_1.FirebaseAdminService,
        user_service_1.UserService])
], FirebaseAuthGuard);
//# sourceMappingURL=firebase-auth.guard.js.map