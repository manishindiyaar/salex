import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
  ValidationPipe,
  HttpStatus,
  HttpException,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConditionalAuthGuard } from '../auth/conditional-auth.guard';
import { AuthenticatedRequest } from '../auth/firebase-auth.guard';
import { UserService } from '../auth/user.service';
import { BusinessService } from './business.service';
import { BusinessRoutingService } from './business-routing.service';
import { QRCodeService, WhatsAppQRCodeData } from './qr-code.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto/business.dto';
import { UpdateBusinessHoursRequestDto } from './dto/update-business-hours.dto';
import { ApiResponse, Business, Service, BusinessHours, SetRoutingCodeRequest, CodeAvailabilityResponse, BusinessPublicInfo } from 'shared-types';

@Controller('api/v1/businesses')
export class BusinessController {
  private readonly logger = new Logger(BusinessController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly businessService: BusinessService,
    private readonly businessRoutingService: BusinessRoutingService,
    private readonly qrCodeService: QRCodeService,
  ) {}

  /**
   * Ensure mock user exists in database when auth is disabled
   */
  private async ensureMockUserExists(userId: string, phoneNumber: string): Promise<void> {
    const isAuthEnabled = this.configService.get<string>('ENABLE_AUTH') === 'true';
    
    if (!isAuthEnabled && userId === 'test-user-id') {
      try {
        // Try to find the user first
        let user = await this.userService.findById(userId);
        
        if (!user) {
          // User doesn't exist, create it
          this.logger.debug('Creating mock user for development/testing');
          await this.userService.createUser({
            firebaseUid: 'test-firebase-uid',
            phoneNumber: phoneNumber,
          });
          this.logger.log('Mock user created successfully');
        }
      } catch (error) {
        if (error.message === 'User already exists') {
          // User exists, continue
          this.logger.debug('Mock user already exists');
        } else {
          this.logger.error(`Failed to create mock user: ${error.message}`, error.stack);
          throw error;
        }
      }
    }
  }

  /**
   * Create a new business
   */
  @Post()
  @UseGuards(ConditionalAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBusiness(
    @Request() req: AuthenticatedRequest,
    @Body(new ValidationPipe()) createData: CreateBusinessDto,
  ): Promise<ApiResponse<Business>> {
    this.logger.debug(`Creating business for user: ${req.user.id}`);

    try {
      // Ensure mock user exists in database when auth is disabled
      await this.ensureMockUserExists(req.user.id, req.user.phoneNumber);

      const business = await this.businessService.createBusiness(req.user.id, createData);
      
      return {
        success: true,
        data: business,
        message: 'Business created successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to create business: ${error.message}`, error.stack);
      
      if (error.code === 'P2002') {
        throw new HttpException('Business with this information already exists', HttpStatus.CONFLICT);
      }
      
      throw new HttpException('Failed to create business', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get current user's business information
   * This endpoint creates User record on first authenticated call
   */
  @Get('me')
  @UseGuards(ConditionalAuthGuard)
  async getCurrentUserBusiness(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<Business | null>> {
    this.logger.debug(`Getting business for current user: ${req.user.id}`);

    try {
      // Get user's primary business (first business for now)
      const business = await this.businessService.getUserPrimaryBusiness(req.user.id);
      
      return {
        success: true,
        data: business,
        message: business 
          ? 'Business retrieved successfully'
          : 'No business found for current user',
      };
    } catch (error) {
      this.logger.error(`Failed to get user business: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get specific business by ID (Public access for customers)
   */
  @Get(':businessId')
  async getBusiness(
    @Param('businessId') businessId: string,
  ): Promise<ApiResponse<Business>> {
    this.logger.debug(`Getting business: ${businessId} (public access)`);

    try {
      const business = await this.businessService.getBusinessByIdPublic(businessId);
      
      return {
        success: true,
        data: business,
        message: 'Business retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get business: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'You do not have access to this business') {
        throw new HttpException('You do not have access to this business', HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to get business', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update business details
   */
  @Put(':businessId')
  @UseGuards(ConditionalAuthGuard)
  async updateBusiness(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
    @Body(new ValidationPipe()) updateData: UpdateBusinessDto,
  ): Promise<ApiResponse<Business>> {
    this.logger.debug(`Updating business: ${businessId} for user: ${req.user.id}`);

    try {
      const business = await this.businessService.updateBusiness(businessId, req.user.id, updateData);
      
      return {
        success: true,
        data: business,
        message: 'Business updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update business: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'You do not have access to this business') {
        throw new HttpException('You do not have access to this business', HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to update business', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Services endpoint moved to dedicated ServiceController for better separation of concerns

  /**
   * Get business bookings
   */
  @Get(':businessId/bookings')
  @UseGuards(ConditionalAuthGuard)
  async getBusinessBookings(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ): Promise<ApiResponse<any[]>> {
    this.logger.debug(`Getting bookings for business: ${businessId}`);

    try {
      const bookings = await this.businessService.getBusinessBookings(businessId, req.user.id);
      
      return {
        success: true,
        data: bookings,
        message: 'Bookings retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get bookings: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'You do not have access to this business') {
        throw new HttpException('You do not have access to this business', HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to get bookings', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update business hours
   */
  @Put(':businessId/hours')
  @UseGuards(ConditionalAuthGuard)
  async updateBusinessHours(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
    @Body(new ValidationPipe()) hoursData: UpdateBusinessHoursRequestDto,
  ): Promise<ApiResponse<Business>> {
    this.logger.debug(`Updating hours for business: ${businessId} by user: ${req.user.id}`);

    try {
      const business = await this.businessService.updateBusinessHours(
        businessId, 
        req.user.id, 
        hoursData.hoursOfOperation
      );
      
      return {
        success: true,
        data: business,
        message: 'Business hours updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update business hours: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'You do not have access to this business') {
        throw new HttpException('You do not have access to this business', HttpStatus.FORBIDDEN);
      }
      
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException('Failed to update business hours', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get business hours (Public access for customers)
   */
  @Get(':businessId/hours')
  async getBusinessHours(
    @Param('businessId') businessId: string,
  ): Promise<ApiResponse<BusinessHours>> {
    this.logger.debug(`Getting hours for business: ${businessId} (public access)`);

    try {
      const hours = await this.businessService.getBusinessHoursPublic(businessId);
      
      return {
        success: true,
        data: hours,
        message: 'Business hours retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get business hours: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException('Failed to get business hours', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if business is open at current time (Public access for customers)
   */
  @Get(':businessId/open-status')
  async getBusinessOpenStatus(
    @Param('businessId') businessId: string,
  ): Promise<ApiResponse<{ isOpen: boolean; currentTime: string }>> {
    this.logger.debug(`Checking open status for business: ${businessId} (public access)`);

    try {
      const currentTime = new Date();
      const isOpen = await this.businessService.isBusinessOpen(businessId, currentTime);
      
      return {
        success: true,
        data: {
          isOpen,
          currentTime: currentTime.toISOString(),
        },
        message: `Business is currently ${isOpen ? 'open' : 'closed'}`,
      };
    } catch (error) {
      this.logger.error(`Failed to check business open status: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException('Failed to check business open status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Set business routing code (one-time only)
   */
  @Put(':businessId/routing-code')
  @UseGuards(ConditionalAuthGuard)
  async setBusinessRoutingCode(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
    @Body(new ValidationPipe()) { routingCode }: SetRoutingCodeRequest,
  ): Promise<ApiResponse<{ routingCode: string; suggestions?: string[] }>> {
    this.logger.debug(`Setting routing code ${routingCode} for business: ${businessId} by user: ${req.user.id}`);

    try {
      await this.businessRoutingService.setBusinessRoutingCode(businessId, routingCode, req.user.id);
      
      return {
        success: true,
        data: { routingCode },
        message: 'Routing code set successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to set routing code: ${error.message}`, error.stack);
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'You do not have permission to modify this business') {
        throw new HttpException('You do not have permission to modify this business', HttpStatus.FORBIDDEN);
      }
      
      if (error.message.includes('already has a routing code')) {
        throw new HttpException('Business already has a routing code. Codes cannot be changed once set.', HttpStatus.CONFLICT);
      }
      
      if (error.message.includes('already taken')) {
        // Get suggestions for the taken code
        try {
          const availability = await this.businessRoutingService.checkCodeAvailability(routingCode);
          return {
            success: false,
            error: `Code ${routingCode} is already taken`,
            data: { routingCode, suggestions: availability.suggestions },
            message: 'Please choose from the suggested alternatives'
          };
        } catch (suggestionError) {
          throw new HttpException(`Code ${routingCode} is already taken`, HttpStatus.CONFLICT);
        }
      }
      
      if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException('Failed to set routing code', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  /**
   * Get routing code statistics (admin endpoint)
   */
  @Get('/routing-codes/statistics')
  @UseGuards(ConditionalAuthGuard)
  async getCodeStatistics(
    @Request() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{
    totalAssigned: number;
    totalAvailable: number;
    utilizationPercentage: number;
  }>> {
    this.logger.debug(`Getting routing code statistics for user: ${req.user.id}`);

    try {
      const stats = await this.businessRoutingService.getCodeStatistics();
      
      return {
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get code statistics: ${error.message}`, error.stack);
      throw new HttpException('Failed to get statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate WhatsApp QR code for business
   */
  @Get(':businessId/whatsapp-qr')
  @UseGuards(ConditionalAuthGuard)
  async generateWhatsAppQR(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
    @Query('message') customMessage?: string,
  ): Promise<ApiResponse<WhatsAppQRCodeData>> {
    this.logger.debug(`Generating WhatsApp QR for business: ${businessId}`);

    try {
      const qrData = await this.qrCodeService.generateBusinessQR(businessId, req.user.id, customMessage);
      
      return {
        success: true,
        data: qrData,
        message: 'WhatsApp QR code generated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      
      if (error.message.includes('routing code')) {
        throw new HttpException('Business must have a routing code to generate QR', HttpStatus.BAD_REQUEST);
      }
      
      if (error.message === 'Business not found') {
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);
      }
      
      if (error.message === 'You do not have access to this business') {
        throw new HttpException('You do not have access to this business', HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException('Failed to generate QR code', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get QR code variations for business
   */
  @Get(':businessId/whatsapp-qr/variations')
  @UseGuards(ConditionalAuthGuard)
  async getQRVariations(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ): Promise<ApiResponse<WhatsAppQRCodeData[]>> {
    this.logger.debug(`Getting QR variations for business: ${businessId}`);

    try {
      const variations = await this.qrCodeService.generateBusinessQRVariations(businessId, req.user.id);
      
      return {
        success: true,
        data: variations,
        message: 'QR code variations generated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to generate QR variations: ${error.message}`, error.stack);
      
      if (error.message.includes('routing code')) {
        throw new HttpException('Business must have a routing code to generate QR', HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException('Failed to generate QR variations', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get marketing materials with QR codes
   */
  @Get(':businessId/marketing-materials')
  @UseGuards(ConditionalAuthGuard)
  async getMarketingMaterials(
    @Request() req: AuthenticatedRequest,
    @Param('businessId') businessId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.debug(`Getting marketing materials for business: ${businessId}`);

    try {
      const materials = await this.qrCodeService.generateMarketingMaterials(businessId, req.user.id);
      
      return {
        success: true,
        data: materials,
        message: 'Marketing materials generated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to generate marketing materials: ${error.message}`, error.stack);
      
      if (error.message.includes('routing code')) {
        throw new HttpException('Business must have a routing code for marketing materials', HttpStatus.BAD_REQUEST);
      }
      
      throw new HttpException('Failed to generate marketing materials', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
