import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';
import { UserService } from './user.service';
import { User } from '@prisma/client';

// Extend Express Request type to include our custom auth properties
export interface AuthenticatedRequest extends Request {
  user: User; // The user record from our database
  auth: {
    uid: string; // Firebase UID
    token: string;
  };
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided.');
    }

    try {
      // 1. Verify the Firebase ID token
      const decodedToken = await this.firebaseAdmin.verifyIdToken(token);
      const { uid, phone_number: phoneNumber } = decodedToken;

      if (!uid) {
        throw new UnauthorizedException('Invalid Firebase token: UID missing.');
      }

      this.logger.debug(`Token verified for Firebase UID: ${uid}`);

      // 2. Sync user with our database (create if not exists)
      // We will rename syncUserFromClerk to syncUserByFirebaseUid later
      const user = await this.userService.syncUserByFirebaseUid(uid, phoneNumber);

      if (!user) {
        throw new UnauthorizedException('User could not be found or created.');
      }

      // 3. Attach user and auth info to the request object
      // Cast to any to avoid legacy Clerk-specific fields (e.g., clerkUserId) required by older types
      request.user = user as any;
      request.auth = { uid, token };

      return true;
    } catch (error) {
      this.logger.error(`Firebase auth error: ${error.message}`);
      throw new UnauthorizedException('Firebase authentication failed.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
