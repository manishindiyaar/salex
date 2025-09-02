import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../core/prisma.service';
import { BusinessModule } from '../business/business.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    BusinessModule,
    AuthModule,
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    PrismaService,
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}