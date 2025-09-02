import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './core/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessModule } from './modules/business/business.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { TimeSlotsModule } from './modules/timeslots/timeslots.module';
import { ServiceModule } from './modules/service/service.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CustomerModule } from './modules/customer/customer.module';
import { WhatsAppSimulatorModule } from './modules/whatsapp-simulator/whatsapp-simulator.module';
import { BookingModule } from './modules/booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),
    AuthModule,
    BusinessModule,
    WhatsAppModule,
    TimeSlotsModule,
    ServiceModule,
    AnalyticsModule,
    CustomerModule,
    WhatsAppSimulatorModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}