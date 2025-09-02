import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BusinessController } from './business.controller';
import { PublicRoutingController } from './public-routing.controller';
// import { OnboardingController } from './onboarding.controller';
import { BusinessService } from './business.service';
import { BusinessRoutingService } from './business-routing.service';
// import { OnboardingService } from './onboarding.service';
import { QRCodeService } from './qr-code.service';
import { PrismaService } from '../../core/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [BusinessController, PublicRoutingController],
  providers: [
    BusinessService,
    BusinessRoutingService,
    // OnboardingService,
    QRCodeService,
    PrismaService,
  ],
  exports: [BusinessService, BusinessRoutingService, QRCodeService],
})
export class BusinessModule {}