# 12. Backend Architecture

## Service Architecture

We are using a serverless architecture, where our NestJS application is deployed as one or more serverless functions. The internal structure of the application is organized into modules, which is a core feature of NestJS.

**Function Organization (NestJS Modules)**
The backend code in `apps/api/src/modules/` will be organized by feature domain. This is the structure we discussed previously:

```plaintext
apps/api/
└── src/
    └── modules/
        ├── auth/          # Clerk JWT validation and guards
        ├── businesses/    # Logic for managing businesses and services
        ├── bookings/      # Logic for creating and managing bookings
        ├── notifications/ # Logic for FCM and SMS notifications
        └── whatsapp/      # The core WhatsApp webhook and session logic

Function Template (NestJS Controller & Service Pattern)
Each module will contain a controller (for handling HTTP requests) and a service (for business logic). This separation of concerns is fundamental to a clean architecture.

TypeScript

// apps/api/src/modules/bookings/bookings.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(ClerkAuthGuard) // Securing the entire controller
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll() {
    // Logic to get current user's businessId from request...
    return this.bookingsService.findAllForBusiness('businessId');
  }
}

// apps/api/src/modules/bookings/bookings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAllForBusiness(businessId: string) {
    return this.prisma.booking.findMany({
      where: { businessId },
      orderBy: { bookingTime: 'asc' },
    });
  }
}
Database Architecture
Our database architecture is defined by the SQL schema from the previous section. For the application layer, we will interact with it exclusively through the Prisma ORM.

Schema Design (Prisma Schema)
The SQL schema we designed will be represented in a schema.prisma file. This becomes the source of truth for our data layer. For example, the Booking table translates to this:

Code snippet

// prisma/schema.prisma (snippet)
model Booking {
  id           String   @id @default(cuid())
  bookingTime  DateTime
  status       BookingStatus @default(PENDING)
  business     Business @relation(fields: [businessId], references: [id])
  businessId   String
  customer     Customer @relation(fields: [customerId], references: [id])
  customerId   String
  service      Service  @relation(fields: [serviceId], references: [id])
  serviceId    String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([businessId])
  @@index([customerId])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED_BY_USER
  CANCELLED_BY_SALON
  COMPLETED
}
Data Access Layer (Repository Pattern)
We will implement the Repository Pattern by creating a single PrismaService that is injected into any other service that needs database access. This manages the Prisma client lifecycle and ensures a consistent, testable data access pattern.

TypeScript

// apps/api/src/core/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
Authentication Architecture
Authentication will be handled by a custom NestJS Guard that validates the JWT provided by Clerk.

Auth Flow Diagram
This diagram shows how a request from the merchant app is validated.

Code snippet

sequenceDiagram
    participant App as React Native App
    participant API as Backend API
    participant Guard as ClerkAuthGuard
    participant Clerk
    participant Controller
    
    App->>API: Request with "Authorization: Bearer <JWT>"
    API->>Guard: Executes Guard before Controller
    Guard->>Clerk: Verifies JWT signature & expiry
    Clerk-->>Guard: Token is valid (returns payload with userId)
    Guard->>API: Attaches user payload to request object
    API->>Controller: Proceeds to execute controller logic
    Controller-->>API: Returns response
    API-->>App: Sends response
Middleware/Guards (Implementation)
This NestJS Guard will protect our endpoints. It will be the cornerstone of our backend security.

TypeScript

// apps/api/src/modules/auth/clerk-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Clerk } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionToken = request.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      throw new UnauthorizedException('No session token provided');
    }

    try {
      // Clerk SDK handles the verification
      const claims = await Clerk.sessions.verifySession(sessionToken);
      request.auth = claims; // Attach user claims to the request
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid session token');
    }
  }
}        