import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { ConditionalAuthGuard } from './conditional-auth.guard';
import { PrismaService } from '../../core/prisma.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseController } from './firebase.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController, FirebaseController],
  providers: [
    PrismaService,
    UserService,
    FirebaseAdminService,
    FirebaseAuthGuard,
    ConditionalAuthGuard,
  ],
  exports: [
    UserService,
    FirebaseAdminService,
    FirebaseAuthGuard,
    ConditionalAuthGuard,
  ],
})
export class AuthModule {}
