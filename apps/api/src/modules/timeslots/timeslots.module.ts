import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TimeSlotsController } from './timeslots.controller';
import { TimeSlotsService } from './timeslots.service';
import { PrismaService } from '../../core/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [TimeSlotsController],
  providers: [
    TimeSlotsService,
    PrismaService,
  ],
  exports: [TimeSlotsService],
})
export class TimeSlotsModule {}