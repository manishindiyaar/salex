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
exports.FirebaseAdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
let FirebaseAdminService = class FirebaseAdminService {
    constructor(config) {
        this.config = config;
        const projectId = this.config.get('FIREBASE_PROJECT_ID');
        const clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL');
        let privateKey = this.config.get('FIREBASE_PRIVATE_KEY');
        if (!projectId || !clientEmail || !privateKey) {
            throw new common_1.InternalServerErrorException('FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set in apps/api/.env');
        }
        privateKey = privateKey.replace(/\\n/g, '\n');
        const credential = admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        });
        try {
            this.app = admin.app();
        }
        catch {
            this.app = admin.initializeApp({ credential });
        }
    }
    async verifyIdToken(idToken) {
        try {
            const decoded = await this.app.auth().verifyIdToken(idToken, true);
            return decoded;
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(typeof err?.message === 'string' ? err.message : 'Failed to verify Firebase ID token');
        }
    }
};
exports.FirebaseAdminService = FirebaseAdminService;
exports.FirebaseAdminService = FirebaseAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseAdminService);
//# sourceMappingURL=firebase-admin.service.js.map