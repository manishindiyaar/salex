import { 
  Controller, 
  Get, 
  UseGuards, 
  Request, 
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ConditionalAuthGuard } from './conditional-auth.guard';
import { AuthenticatedRequest } from './firebase-auth.guard';
import { UserService } from './user.service';
import { AuthUserResponseDto } from './dto/auth-response.dto';
import { ApiResponse } from 'shared-types';

@Controller('api/v1')
@UseGuards(ConditionalAuthGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Get current user profile
   * This endpoint automatically creates user record on first call
   */
  @Get('auth/me')
  async getCurrentUser(@Request() req: AuthenticatedRequest): Promise<ApiResponse<AuthUserResponseDto>> {
    this.logger.debug(`Getting current user profile for: ${req.user.id}`);

    try {
      // Map Firebase-authenticated user to the DTO shape expected by clients
      // Ensure we only set fields that exist on AuthUserResponseDto
      const userResponse: AuthUserResponseDto = {
        id: req.user.id,
        phoneNumber: req.user.phoneNumber,
        createdAt: req.user.createdAt as any,
        updatedAt: req.user.updatedAt as any,
      } as AuthUserResponseDto;
      
      return {
        success: true,
        data: userResponse,
        message: 'User profile retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get current user: ${error.message}`, error.stack);
      return {
        success: false,
        error: 'Failed to retrieve user profile',
      };
    }
  }


  /**
   * Health check endpoint for authentication
   */
  @Get('auth/health')
  async healthCheck(@Request() req: AuthenticatedRequest): Promise<ApiResponse<{ status: string; userId: string }>> {
    return {
      success: true,
      data: {
        status: 'authenticated',
        userId: req.user.id,
      },
      message: 'Authentication is working correctly',
    };
  }
}
