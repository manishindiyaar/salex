import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerSessionService } from './customer-session.service';
import { RedisSessionService } from './redis-session.service';
import { RedisService } from '../../core/redis.service';
import { PrismaService } from '../../core/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [
    CustomerSessionService, 
    RedisSessionService,
    RedisService,
    PrismaService
  ],
  exports: [
    CustomerSessionService, 
    RedisSessionService,
    RedisService
  ],
})
export class CustomerModule {}