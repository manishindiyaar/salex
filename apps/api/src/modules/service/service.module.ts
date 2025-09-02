import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { PrismaService } from '../../core/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ServiceController],
  providers: [ServiceService, PrismaService],
  exports: [ServiceService],
})
export class ServiceModule {}