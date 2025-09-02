import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthGuard } from './firebase-auth.guard';

/**
 * Conditional Authentication Guard
 * 
 * This guard allows toggling authentication on/off via the ENABLE_AUTH environment variable.
 * 
 * Usage:
 * - Set ENABLE_AUTH="true" in .env to enable authentication (production mode)
 * - Set ENABLE_AUTH="false" in .env to disable authentication (development/testing mode)
 * 
 * When authentication is disabled, all requests pass through without authentication.
 * When authentication is enabled, it uses the FirebaseAuthGuard for validation.
 */
@Injectable()
export class ConditionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(ConditionalAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseAuthGuard: FirebaseAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if authentication is enabled via environment variable
    const isAuthEnabled = this.configService.get<string>('ENABLE_AUTH') === 'true';

    if (!isAuthEnabled) {
      this.logger.debug('Authentication is disabled via ENABLE_AUTH environment variable');
      
      // Mock user object for development/testing
      const request = context.switchToHttp().getRequest();
      request.user = {
        id: 'test-user-id',
        phoneNumber: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      request.auth = {
        uid: 'test-firebase-uid',
        token: 'mock-token',
      };
      
      return true; // Allow all requests through when auth is disabled
    }

    // When auth is enabled, delegate to FirebaseAuthGuard
    this.logger.debug('Authentication is enabled, delegating to FirebaseAuthGuard');
    return this.firebaseAuthGuard.canActivate(context);
  }
}