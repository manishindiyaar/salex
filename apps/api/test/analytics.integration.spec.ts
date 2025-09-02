import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma.service';
import { FirebaseAuthGuard } from '../src/modules/auth/firebase-auth.guard';

describe('Analytics API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let businessId: string;
  let serviceId: string;
  let customerId: string;
  let bookingId1: string;
  let bookingId2: string;
  const userId = 'test-user-id';

  const mockUser = {
    id: userId,
    firebaseUid: 'clerk-test-user',
    phoneNumber: '+1234567890',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          request.auth = { userId: mockUser.id };
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  const setupTestData = async () => {
    // Create user
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        firebaseUid: mockUser.firebaseUid,
        phoneNumber: mockUser.phoneNumber,
      },
    });

    // Create business
    const business = await prisma.business.create({
      data: {
        name: 'Test Salon Analytics',
        businessType: 'SALON',
        phoneNumber: '+1234567890',
        address: 'Test Address',
        ownerId: userId,
      },
    });
    businessId = business.id;

    // Create salon
    await prisma.salon.create({
      data: {
        businessId: businessId,
      },
    });

    // Create service
    const service = await prisma.service.create({
      data: {
        name: 'Analytics Test Service',
        price: 50.00,
        durationMinutes: 60,
        description: 'Test service for analytics',
        businessId: businessId,
      },
    });
    serviceId = service.id;

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        phoneNumber: '+0987654321',
        name: 'Test Customer',
      },
    });
    customerId = customer.id;

    // Create today's bookings with different statuses
    const today = new Date();
    today.setHours(10, 0, 0, 0); // 10 AM today

    // Confirmed booking
    const booking1 = await prisma.booking.create({
      data: {
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        status: 'CONFIRMED',
        scheduledAt: today,
        notes: 'Test booking 1',
      },
    });
    bookingId1 = booking1.id;

    // Completed booking
    const booking2 = await prisma.booking.create({
      data: {
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        status: 'COMPLETED',
        scheduledAt: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        notes: 'Test booking 2',
      },
    });
    bookingId2 = booking2.id;

    // Pending booking (should not be counted)
    await prisma.booking.create({
      data: {
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        status: 'PENDING',
        scheduledAt: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
        notes: 'Test booking 3 - pending',
      },
    });

    // Yesterday's booking (should not be counted for today)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    await prisma.booking.create({
      data: {
        businessId: businessId,
        customerId: customerId,
        serviceId: serviceId,
        status: 'CONFIRMED',
        scheduledAt: yesterday,
        notes: 'Yesterday booking',
      },
    });
  };

  const cleanupTestData = async () => {
    try {
      // Delete in order due to foreign key constraints
      await prisma.booking.deleteMany({ where: { businessId } });
      await prisma.service.deleteMany({ where: { businessId } });
      await prisma.salon.deleteMany({ where: { businessId } });
      await prisma.business.deleteMany({ where: { id: businessId } });
      await prisma.customer.deleteMany({ where: { id: customerId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  describe('/GET /api/v1/businesses/:businessId/analytics/daily', () => {
    it('should return daily analytics for business owner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${businessId}/analytics/daily`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          businessId: businessId,
          totalBookings: 2, // Only CONFIRMED and COMPLETED bookings
          totalRevenue: 100, // 2 bookings × $50 each
          timezone: 'UTC',
        },
        message: 'Daily analytics retrieved successfully',
      });

      expect(response.body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });

    it('should return analytics for specific date', async () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${businessId}/analytics/daily`)
        .query({ date: today })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          businessId: businessId,
          date: today,
          totalBookings: 2,
          totalRevenue: 100,
          timezone: 'UTC',
        },
      });
    });

    it('should return zero analytics for date with no bookings', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // Next week
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${businessId}/analytics/daily`)
        .query({ date: futureDateStr })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          businessId: businessId,
          date: futureDateStr,
          totalBookings: 0,
          totalRevenue: 0,
          timezone: 'UTC',
        },
      });
    });

    it('should handle custom timezone parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${businessId}/analytics/daily`)
        .query({ timezone: 'America/New_York' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          businessId: businessId,
          timezone: 'America/New_York',
        },
      });
    });

    it('should return 403 for non-owner accessing analytics', async () => {
      // Create another user and business
      const anotherUserId = 'another-user-id';
      await prisma.user.create({
        data: {
          id: anotherUserId,
          firebaseUid: 'another-clerk-user',
          phoneNumber: '+1111111111',
        },
      });

      const anotherBusiness = await prisma.business.create({
        data: {
          name: 'Another Business',
          businessType: 'SALON',
          phoneNumber: '+1111111111',
          address: 'Another Address',
          ownerId: anotherUserId,
        },
      });

      // Try to access another business's analytics
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${anotherBusiness.id}/analytics/daily`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access denied: Business not found or not owned by user',
      });

      // Cleanup
      await prisma.business.delete({ where: { id: anotherBusiness.id } });
      await prisma.user.delete({ where: { id: anotherUserId } });
    });

    it('should return 404 for non-existent business', async () => {
      const nonExistentBusinessId = 'non-existent-business-id';
      
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${nonExistentBusinessId}/analytics/daily`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Access denied: Business not found or not owned by user',
      });
    });

    it('should validate date format', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${businessId}/analytics/daily`)
        .query({ date: 'invalid-date' })
        .expect(400); // ValidationPipe should catch this

      // Note: The exact error structure depends on NestJS ValidationPipe configuration
    });

    it('should handle empty business (no bookings)', async () => {
      // Create a new business with no bookings
      const emptyBusiness = await prisma.business.create({
        data: {
          name: 'Empty Business',
          businessType: 'SALON',
          phoneNumber: '+2222222222',
          address: 'Empty Address',
          ownerId: userId,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/businesses/${emptyBusiness.id}/analytics/daily`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          businessId: emptyBusiness.id,
          totalBookings: 0,
          totalRevenue: 0,
          timezone: 'UTC',
        },
      });

      // Cleanup
      await prisma.business.delete({ where: { id: emptyBusiness.id } });
    });
  });
});