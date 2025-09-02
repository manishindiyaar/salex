import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';
import { UserService } from './user.service';
import { User } from '@prisma/client';
export interface AuthenticatedRequest extends Request {
    user: User;
    auth: {
        uid: string;
        token: string;
    };
}
export declare class FirebaseAuthGuard implements CanActivate {
    private readonly firebaseAdmin;
    private readonly userService;
    private readonly logger;
    constructor(firebaseAdmin: FirebaseAdminService, userService: UserService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
