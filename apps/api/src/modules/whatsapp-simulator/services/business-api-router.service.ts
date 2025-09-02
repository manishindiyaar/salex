import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma.service';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

@Injectable()
export class BusinessApiRouterService {
  private readonly logger = new Logger(BusinessApiRouterService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private serviceAccountToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SalexSimulator/1.0',
      },
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.getServiceAccountToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`API request failed: ${error.message}`, error.response?.data);
        throw new HttpException(
          error.response?.data?.message || 'Business API request failed',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    );
  }

  /**
   * Get or refresh service account token for internal API calls
   */
  private async getServiceAccountToken(): Promise<string | null> {
    try {
      // Check if current token is still valid
      if (this.serviceAccountToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.serviceAccountToken;
      }

      // For simulator mode, we'll use a service account approach
      // In production, this would integrate with Clerk's service account system
      const serviceAccountId = this.configService.get<string>('SIMULATOR_SERVICE_ACCOUNT_ID');
      const serviceAccountSecret = this.configService.get<string>('SIMULATOR_SERVICE_ACCOUNT_SECRET');

      if (!serviceAccountId || !serviceAccountSecret) {
        this.logger.warn('Service account credentials not configured for simulator');
        return null;
      }

      // Generate service account JWT token
      // For now, we'll use a mock token approach - in production this would be proper Clerk integration
      this.serviceAccountToken = this.generateMockServiceToken(serviceAccountId);
      this.tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      this.logger.debug('Service account token refreshed for simulator API routing');
      return this.serviceAccountToken;

    } catch (error) {
      this.logger.error(`Failed to get service account token: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate mock service token for simulator (production would use real Clerk service account)
   */
  private generateMockServiceToken(serviceAccountId: string): string {
    // For simulator purposes, we'll use a mock token that matches expected format
    // In production, this would be replaced with actual Clerk service account token generation
    const mockPayload = {
      sub: serviceAccountId,
      iss: 'simulator-service-account',
      aud: 'salex-api',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      role: 'service-account',
      scope: 'business:read business:write'
    };

    // In development/simulator mode, we'll use the test JWT token from environment
    const testToken = this.configService.get<string>('CLERK_JWT_TOKEN');
    if (testToken) {
      return testToken;
    }

    // Fallback to a base64 encoded mock token for testing
    return `mock-service-token-${Buffer.from(JSON.stringify(mockPayload)).toString('base64')}`;
  }

  /**
   * Get business by routing code
   */
  async getBusinessByRoutingCode(routingCode: string): Promise<any> {
    this.logger.debug(`Looking up business by routing code: ${routingCode}`);

    try {
      // First try direct database lookup for routing code
      const business = await this.prisma.business.findFirst({
        where: {
          OR: [
            { routingCode: routingCode },
            { routingCode: `${routingCode}` },
          ]
        },
        include: {
          salon: true,
        }
      });

      if (business) {
        return {
          id: business.id,
          name: business.name,
          routingCode: business.routingCode,
          phoneNumber: business.phoneNumber,
          address: business.address,
          businessType: business.businessType,
        };
      }

      // If not found by routing code, try API endpoint (future implementation)
      const response = await this.httpClient.get(`/api/v1/businesses/routing/${routingCode}`);
      return response.data.data;

    } catch (error) {
      this.logger.error(`Failed to get business by routing code ${routingCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get business by ID
   */
  async getBusinessById(businessId: string): Promise<any> {
    this.logger.debug(`Getting business by ID: ${businessId}`);

    try {
      const response = await this.httpClient.get(`/api/v1/businesses/${businessId}`);
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get business by ID ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get business services
   */
  async getBusinessServices(businessId: string, userToken?: string): Promise<any[]> {
    this.logger.debug(`Getting services for business: ${businessId}`);

    try {
      const headers: any = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const response = await this.httpClient.get(
        `/api/v1/businesses/${businessId}/services`,
        { headers }
      );
      
      return response.data.data.services || [];
    } catch (error) {
      this.logger.error(`Failed to get services for business ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get business hours
   */
  async getBusinessHours(businessId: string, userToken?: string): Promise<any> {
    this.logger.debug(`Getting hours for business: ${businessId}`);

    try {
      const headers: any = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const response = await this.httpClient.get(
        `/api/v1/businesses/${businessId}/hours`,
        { headers }
      );
      
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get hours for business ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available time slots
   */
  async getAvailableTimeSlots(
    businessId: string, 
    userToken?: string,
    options?: {
      serviceId?: string;
      startDate?: string;
      endDate?: string;
      slotInterval?: number;
    }
  ): Promise<any[]> {
    this.logger.debug(`Getting time slots for business: ${businessId}`);

    try {
      const headers: any = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const params = new URLSearchParams();
      if (options?.serviceId) params.append('serviceId', options.serviceId);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.slotInterval) params.append('slotInterval', options.slotInterval.toString());

      const response = await this.httpClient.get(
        `/api/v1/businesses/${businessId}/timeslots?${params.toString()}`,
        { headers }
      );
      
      return response.data.data || [];
    } catch (error) {
      this.logger.error(`Failed to get time slots for business ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create booking
   */
  async createBooking(
    businessId: string,
    userToken: string,
    bookingData: {
      serviceId: string;
      timeSlot: string;
      customerPhone: string;
      customerName?: string;
      notes?: string;
    }
  ): Promise<any> {
    this.logger.debug(`Creating booking for business: ${businessId}`);

    try {
      const headers: any = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const response = await this.httpClient.post(
        `/api/v1/businesses/${businessId}/bookings`,
        bookingData,
        { headers }
      );
      
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to create booking for business ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get business open status
   */
  async getBusinessOpenStatus(businessId: string, userToken?: string): Promise<any> {
    this.logger.debug(`Getting open status for business: ${businessId}`);

    try {
      const headers: any = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const response = await this.httpClient.get(
        `/api/v1/businesses/${businessId}/open-status`,
        { headers }
      );
      
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get open status for business ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get business analytics
   */
  async getBusinessAnalytics(
    businessId: string, 
    userToken?: string,
    options?: {
      date?: string;
      timezone?: string;
    }
  ): Promise<any> {
    this.logger.debug(`Getting analytics for business: ${businessId}`);

    try {
      const headers: any = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const params = new URLSearchParams();
      if (options?.date) params.append('date', options.date);
      if (options?.timezone) params.append('timezone', options.timezone);

      const response = await this.httpClient.get(
        `/api/v1/businesses/${businessId}/analytics/daily?${params.toString()}`,
        { headers }
      );
      
      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to get analytics for business ${businessId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Health check for API connectivity
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error(`API health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get API client configuration info
   */
  getClientInfo(): {
    baseUrl: string;
    hasServiceAccount: boolean;
    tokenExpiry: Date | null;
  } {
    return {
      baseUrl: this.baseUrl,
      hasServiceAccount: !!this.serviceAccountToken,
      tokenExpiry: this.tokenExpiry,
    };
  }
}