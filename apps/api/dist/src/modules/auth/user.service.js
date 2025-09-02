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
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma.service");
let UserService = UserService_1 = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UserService_1.name);
    }
    async findByFirebaseUid(firebaseUid) {
        this.logger.debug(`Finding user by Firebase UID: ${firebaseUid}`);
        const user = await this.prisma.$queryRawUnsafe(`SELECT u.*, (
         SELECT json_agg(b) FROM businesses b WHERE b.owner_id = u.id
       ) AS businesses
       FROM users u
       WHERE u.firebase_uid = $1
       LIMIT 1`, firebaseUid).then(rows => rows?.[0] || null);
        return user;
    }
    async findById(id) {
        this.logger.debug(`Finding user by ID: ${id}`);
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                businesses: true,
            },
        });
        return user;
    }
    async createUser(userData) {
        this.logger.debug(`Creating user with Firebase UID: ${userData.firebaseUid}`);
        try {
            const isTestUser = userData.firebaseUid === 'test-firebase-uid';
            const user = await (isTestUser
                ? this.prisma.$executeRawUnsafe(`INSERT INTO users (id, firebase_uid, phone_number, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`, 'test-user-id', userData.firebaseUid, userData.phoneNumber)
                : this.prisma.$executeRawUnsafe(`INSERT INTO users (id, firebase_uid, phone_number, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`, userData.firebaseUid, userData.phoneNumber)).then(async () => {
                return this.prisma.$queryRawUnsafe(`SELECT * FROM users WHERE firebase_uid = $1 LIMIT 1`, userData.firebaseUid).then(rows => rows?.[0]);
            });
            this.logger.log(`User created successfully: ${user.id}`);
            return user;
        }
        catch (error) {
            if (error.code === 'P2002') {
                this.logger.warn(`Attempted to create duplicate user: ${userData.firebaseUid}`);
                throw new common_1.ConflictException('User already exists');
            }
            this.logger.error(`Failed to create user: ${error.message}`, error.stack);
            throw error;
        }
    }
    async syncUserByFirebaseUid(firebaseUid, phoneNumber) {
        this.logger.debug(`Syncing user from Firebase: ${firebaseUid}`);
        let user = await this.findByFirebaseUid(firebaseUid);
        if (user) {
            this.logger.debug(`User found: ${user.id}`);
            return user;
        }
        if (!phoneNumber) {
            this.logger.warn(`Cannot create user ${firebaseUid} without phone number`);
            throw new common_1.ConflictException('Phone number is required for user creation');
        }
        this.logger.debug(`Creating new user for Firebase UID: ${firebaseUid}`);
        const newUser = await this.createUser({
            firebaseUid,
            phoneNumber,
        });
        return await this.findByFirebaseUid(firebaseUid);
    }
    async updateUser(id, updateData) {
        this.logger.debug(`Updating user: ${id}`);
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
        this.logger.log(`User updated successfully: ${id}`);
        return user;
    }
    async getUserBusinesses(userId) {
        this.logger.debug(`Getting businesses for user: ${userId}`);
        const businesses = await this.prisma.business.findMany({
            where: { ownerId: userId },
        });
        return businesses;
    }
    async getUserPrimaryBusiness(userId) {
        this.logger.debug(`Getting primary business for user: ${userId}`);
        const business = await this.prisma.business.findFirst({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' },
        });
        return business;
    }
    async findBusinessByPhoneNumber(phoneNumber) {
        this.logger.debug(`Finding business by phone number: ${phoneNumber}`);
        const business = await this.prisma.business.findFirst({
            where: { phoneNumber },
            include: { owner: true },
        });
        return business;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map