import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthGuard } from './firebase-auth.guard';
export declare class ConditionalAuthGuard implements CanActivate {
    private readonly configService;
    private readonly firebaseAuthGuard;
    private readonly logger;
    constructor(configService: ConfigService, firebaseAuthGuard: FirebaseAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
