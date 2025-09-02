import { AuthenticatedRequest } from './firebase-auth.guard';
import { UserService } from './user.service';
import { AuthUserResponseDto } from './dto/auth-response.dto';
import { ApiResponse } from 'shared-types';
export declare class AuthController {
    private readonly userService;
    private readonly logger;
    constructor(userService: UserService);
    getCurrentUser(req: AuthenticatedRequest): Promise<ApiResponse<AuthUserResponseDto>>;
    healthCheck(req: AuthenticatedRequest): Promise<ApiResponse<{
        status: string;
        userId: string;
    }>>;
}
