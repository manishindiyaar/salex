import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma.service';
import { FirebaseAuthGuard } from '../src/modules/auth/firebase-auth.guard';

describe('Authentication Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    firebaseUid: 'clerk-user-1',
    phoneNumber: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    businesses: [],
  };

  const mockBusiness = {
    id: 'business-1',
    ownerId: 'user-1',
    name: 'Test Salon',
    businessType: 'SALON',
    phoneNumber: '+1234567890',
    address: '123 Test St',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          request.auth = {
            userId: 'clerk-user-1',
            sessionId: 'session-1',
            claims: { sub: 'clerk-user-1' },
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          id: mockUser.id,
          firebaseUid: mockUser.firebaseUid,
          phoneNumber: mockUser.phoneNumber,
          createdAt: mockUser.createdAt.toISOString(),
          updatedAt: mockUser.updatedAt.toISOString(),
          businesses: mockUser.businesses,
        },
        message: 'User profile retrieved successfully',
      });
    });
  });

  describe('GET /api/v1/businesses/me', () => {
    it('should return null when user has no businesses', async () => {
      jest.spyOn(prismaService.business, 'findFirst').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/api/v1/businesses/me')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'No business found for current user',
      });
    });

    it('should return user\'s primary business', async () => {
      jest.spyOn(prismaService.business, 'findFirst').mockResolvedValue(mockBusiness as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/businesses/me')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockBusiness,
        message: 'Business retrieved successfully',
      });
    });
  });

  describe('GET /api/v1/auth/health', () => {
    it('should return authentication health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'authenticated',
          userId: mockUser.id,
        },
        message: 'Authentication is working correctly',
      });
    });
  });

  describe('Protected endpoints without authentication', () => {
    let appWithoutAuth: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      appWithoutAuth = moduleFixture.createNestApplication();
      appWithoutAuth.useGlobalPipes(new ValidationPipe({ transform: true }));
      await appWithoutAuth.init();
    });

    afterAll(async () => {
      await appWithoutAuth.close();
    });

    it('should return 401 for protected endpoints without token', async () => {
      await request(appWithoutAuth.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      await request(appWithoutAuth.getHttpServer())
        .get('/api/v1/businesses/me')
        .expect(401);
    });
  });

  describe('Business endpoints with authentication', () => {
    it('should allow access to business endpoints with authentication', async () => {
      jest.spyOn(prismaService.business, 'findUnique').mockResolvedValue(mockBusiness as any);

      const response = await request(app.getHttpServer())
        .get('/api/v1/businesses/business-1')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow creation of business with authentication', async () => {
      const newBusinessData = {
        name: 'New Salon',
        businessType: 'SALON',
        phoneNumber: '+1234567891',
        address: '456 New St',
      };

      jest.spyOn(prismaService.business, 'create').mockResolvedValue({
        id: 'business-2',
        ownerId: mockUser.id,
        ...newBusinessData,
        hoursOfOperation: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app.getHttpServer())
        .post('/api/v1/businesses')
        .send(newBusinessData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newBusinessData.name);
    });
  });
});