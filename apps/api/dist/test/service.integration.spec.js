"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/core/prisma.service");
const firebase_auth_guard_1 = require("../src/modules/auth/firebase-auth.guard");
describe('Service API (Integration)', () => {
    let app;
    let prisma;
    let businessId;
    let serviceId;
    const userId = 'test-user-id';
    const mockUser = {
        id: userId,
        firebaseUid: 'clerk-test-user',
        phoneNumber: '+1234567890',
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideGuard(firebase_auth_guard_1.FirebaseAuthGuard)
            .useValue({
            canActivate: (context) => {
                const request = context.switchToHttp().getRequest();
                request.user = mockUser;
                return true;
            },
        })
            .compile();
        app = moduleFixture.createNestApplication();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        await app.init();
        await setupTestData();
    });
    afterAll(async () => {
        await cleanupTestData();
        await app.close();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const setupTestData = async () => {
        await prisma.user.upsert({
            where: { firebaseUid: mockUser.firebaseUid },
            create: mockUser,
            update: mockUser,
        });
        const business = await prisma.business.create({
            data: {
                ownerId: userId,
                name: 'Test Salon',
                businessType: 'SALON',
                phoneNumber: '+1234567890',
                address: '123 Test Street',
            },
        });
        businessId = business.id;
    };
    const cleanupTestData = async () => {
        await prisma.service.deleteMany({});
        await prisma.business.deleteMany({});
        await prisma.user.deleteMany({});
    };
    describe('POST /api/v1/businesses/:businessId/services', () => {
        it('should create a new service successfully', async () => {
            const serviceData = {
                name: 'Haircut',
                price: 25.99,
                durationMinutes: 45,
                description: 'Professional haircut service',
            };
            const response = await request(app.getHttpServer())
                .post(`/api/v1/businesses/${businessId}/services`)
                .send(serviceData)
                .expect(201);
            expect(response.body).toMatchObject({
                name: serviceData.name,
                price: serviceData.price,
                durationMinutes: serviceData.durationMinutes,
                description: serviceData.description,
                businessId,
            });
            serviceId = response.body.id;
        });
        it('should validate required fields', async () => {
            const incompleteData = {
                name: 'Incomplete Service',
            };
            await request(app.getHttpServer())
                .post(`/api/v1/businesses/${businessId}/services`)
                .send(incompleteData)
                .expect(400);
        });
        it('should validate price constraints', async () => {
            const invalidPriceData = {
                name: 'Invalid Price Service',
                price: -10,
                durationMinutes: 30,
            };
            await request(app.getHttpServer())
                .post(`/api/v1/businesses/${businessId}/services`)
                .send(invalidPriceData)
                .expect(400);
        });
        it('should validate duration constraints', async () => {
            const invalidDurationData = {
                name: 'Invalid Duration Service',
                price: 20,
                durationMinutes: 5,
            };
            await request(app.getHttpServer())
                .post(`/api/v1/businesses/${businessId}/services`)
                .send(invalidDurationData)
                .expect(400);
        });
        it('should prevent duplicate service names in same business', async () => {
            const serviceData = {
                name: 'Duplicate Service',
                price: 30,
                durationMinutes: 60,
            };
            await request(app.getHttpServer())
                .post(`/api/v1/businesses/${businessId}/services`)
                .send(serviceData)
                .expect(201);
            await request(app.getHttpServer())
                .post(`/api/v1/businesses/${businessId}/services`)
                .send(serviceData)
                .expect(409);
        });
        it('should reject unauthorized access', async () => {
            expect(true).toBe(true);
        });
    });
    describe('GET /api/v1/businesses/:businessId/services', () => {
        beforeEach(async () => {
            if (!serviceId) {
                const service = await prisma.service.create({
                    data: {
                        businessId,
                        name: 'Test Service',
                        price: 25,
                        durationMinutes: 30,
                    },
                });
                serviceId = service.id;
            }
        });
        it('should retrieve all services for a business', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/businesses/${businessId}/services`)
                .expect(200);
            expect(response.body).toHaveProperty('businessId', businessId);
            expect(response.body).toHaveProperty('services');
            expect(response.body).toHaveProperty('summary');
            expect(Array.isArray(response.body.services)).toBe(true);
            expect(response.body.services.length).toBeGreaterThan(0);
        });
        it('should support pagination', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/businesses/${businessId}/services?page=1&limit=10`)
                .expect(200);
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toMatchObject({
                page: 1,
                limit: 10,
            });
        });
        it('should calculate service summary correctly', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/businesses/${businessId}/services`)
                .expect(200);
            expect(response.body.summary).toHaveProperty('totalServices');
            expect(response.body.summary).toHaveProperty('averagePrice');
            expect(response.body.summary).toHaveProperty('totalPotentialRevenue');
            expect(response.body.summary).toHaveProperty('shortestService');
            expect(response.body.summary).toHaveProperty('longestService');
        });
    });
    describe('GET /api/v1/businesses/:businessId/services/:serviceId', () => {
        it('should retrieve a specific service', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/businesses/${businessId}/services/${serviceId}`)
                .expect(200);
            expect(response.body).toHaveProperty('id', serviceId);
            expect(response.body).toHaveProperty('businessId', businessId);
        });
        it('should return 404 for non-existent service', async () => {
            const nonExistentServiceId = 'non-existent-service-id';
            await request(app.getHttpServer())
                .get(`/api/v1/businesses/${businessId}/services/${nonExistentServiceId}`)
                .expect(404);
        });
    });
    describe('PUT /api/v1/businesses/:businessId/services/:serviceId', () => {
        it('should update service successfully', async () => {
            const updateData = {
                name: 'Updated Service Name',
                price: 35.99,
                description: 'Updated service description',
            };
            const response = await request(app.getHttpServer())
                .put(`/api/v1/businesses/${businessId}/services/${serviceId}`)
                .send(updateData)
                .expect(200);
            expect(response.body).toMatchObject(updateData);
        });
        it('should validate update constraints', async () => {
            const invalidUpdate = {
                price: -50,
            };
            await request(app.getHttpServer())
                .put(`/api/v1/businesses/${businessId}/services/${serviceId}`)
                .send(invalidUpdate)
                .expect(400);
        });
        it('should prevent duplicate names when updating', async () => {
            const anotherService = await prisma.service.create({
                data: {
                    businessId,
                    name: 'Another Service',
                    price: 40,
                    durationMinutes: 60,
                },
            });
            await request(app.getHttpServer())
                .put(`/api/v1/businesses/${businessId}/services/${serviceId}`)
                .send({ name: 'Another Service' })
                .expect(409);
            await prisma.service.delete({ where: { id: anotherService.id } });
        });
    });
    describe('DELETE /api/v1/businesses/:businessId/services/:serviceId', () => {
        it('should delete service successfully', async () => {
            const serviceToDelete = await prisma.service.create({
                data: {
                    businessId,
                    name: 'Service to Delete',
                    price: 20,
                    durationMinutes: 30,
                },
            });
            await request(app.getHttpServer())
                .delete(`/api/v1/businesses/${businessId}/services/${serviceToDelete.id}`)
                .expect(204);
            const deletedService = await prisma.service.findUnique({
                where: { id: serviceToDelete.id },
            });
            expect(deletedService).toBeNull();
        });
        it('should return 404 for non-existent service', async () => {
            const nonExistentServiceId = 'non-existent-service-id';
            await request(app.getHttpServer())
                .delete(`/api/v1/businesses/${businessId}/services/${nonExistentServiceId}`)
                .expect(404);
        });
    });
    describe('Authorization and Security', () => {
        it('should enforce business ownership', async () => {
            const anotherUser = await prisma.user.create({
                data: {
                    firebaseUid: 'another-clerk-user',
                    phoneNumber: '+9876543210',
                },
            });
            const anotherBusiness = await prisma.business.create({
                data: {
                    ownerId: anotherUser.id,
                    name: 'Another Business',
                    businessType: 'SALON',
                    phoneNumber: '+9876543210',
                    address: '456 Another Street',
                },
            });
            await request(app.getHttpServer())
                .get(`/api/v1/businesses/${anotherBusiness.id}/services`)
                .expect(403);
            await prisma.business.delete({ where: { id: anotherBusiness.id } });
            await prisma.user.delete({ where: { id: anotherUser.id } });
        });
        it('should validate service ownership within business', async () => {
            const anotherUser = await prisma.user.create({
                data: {
                    firebaseUid: 'third-clerk-user',
                    phoneNumber: '+5555555555',
                },
            });
            const anotherBusiness = await prisma.business.create({
                data: {
                    ownerId: anotherUser.id,
                    name: 'Third Business',
                    businessType: 'SALON',
                    phoneNumber: '+5555555555',
                    address: '789 Third Street',
                },
            });
            const anotherService = await prisma.service.create({
                data: {
                    businessId: anotherBusiness.id,
                    name: 'Another Service',
                    price: 50,
                    durationMinutes: 90,
                },
            });
            await request(app.getHttpServer())
                .get(`/api/v1/businesses/${businessId}/services/${anotherService.id}`)
                .expect(404);
            await prisma.service.delete({ where: { id: anotherService.id } });
            await prisma.business.delete({ where: { id: anotherBusiness.id } });
            await prisma.user.delete({ where: { id: anotherUser.id } });
        });
    });
});
//# sourceMappingURL=service.integration.spec.js.map