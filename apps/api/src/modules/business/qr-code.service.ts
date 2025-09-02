import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessService } from './business.service';
import { BusinessRoutingService } from './business-routing.service';

export interface WhatsAppQRCodeData {
  qrCodeUrl: string;
  whatsappUrl: string;
  routingCode: string;
  businessName: string;
  message: string;
}

@Injectable()
export class QRCodeService {
  private readonly logger = new Logger(QRCodeService.name);
  private readonly whatsappNumber: string;
  private readonly businessPrefix: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly businessService: BusinessService,
    private readonly businessRoutingService: BusinessRoutingService,
  ) {
    // Official Salex WhatsApp Business Number (configured in environment)
    this.whatsappNumber = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID', '+919876543210');
    this.businessPrefix = this.configService.get<string>('WHATSAPP_BUSINESS_IDENTIFIER_PREFIX', 'S');
  }

  /**
   * Generate WhatsApp QR code for business routing
   */
  async generateBusinessQR(
    businessId: string, 
    userId: string,
    customMessage?: string
  ): Promise<WhatsAppQRCodeData> {
    this.logger.debug(`Generating QR code for business: ${businessId}`);

    // Verify business ownership
    const business = await this.businessService.getBusinessById(businessId, userId);
    
    if (!business.routingCode) {
      throw new NotFoundException('Business does not have a routing code. Please set one first.');
    }

    // Generate WhatsApp URL with routing message
    const routingMessage = customMessage || `BOOK_AT_${this.businessPrefix}${business.routingCode}`;
    const whatsappUrl = this.generateWhatsAppURL(routingMessage);
    
    // Generate QR code URL (using QR code generation service)
    const qrCodeUrl = this.generateQRCodeURL(whatsappUrl);

    return {
      qrCodeUrl,
      whatsappUrl,
      routingCode: business.routingCode,
      businessName: business.name,
      message: routingMessage,
    };
  }

  /**
   * Generate multiple QR code variations for a business
   */
  async generateBusinessQRVariations(
    businessId: string, 
    userId: string
  ): Promise<WhatsAppQRCodeData[]> {
    const business = await this.businessService.getBusinessById(businessId, userId);
    
    if (!business.routingCode) {
      throw new NotFoundException('Business does not have a routing code. Please set one first.');
    }

    const routingCode = business.routingCode;
    const prefix = this.businessPrefix;

    // Different message variations for QR codes
    const messageVariations = [
      `BOOK_AT_${prefix}${routingCode}`,
      `BOOK_${prefix}${routingCode}`,
      `APPOINTMENT_${prefix}${routingCode}`,
      `SALON_${prefix}${routingCode}`,
      `${prefix}${routingCode}`,
    ];

    const qrVariations = messageVariations.map(message => {
      const whatsappUrl = this.generateWhatsAppURL(message);
      const qrCodeUrl = this.generateQRCodeURL(whatsappUrl);

      return {
        qrCodeUrl,
        whatsappUrl,
        routingCode,
        businessName: business.name,
        message,
      };
    });

    return qrVariations;
  }

  /**
   * Generate WhatsApp wa.me URL
   */
  private generateWhatsAppURL(message: string): string {
    // Remove + from phone number for wa.me format
    const phoneNumber = this.whatsappNumber.replace('+', '');
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }

  /**
   * Generate QR code URL using Google Charts API or QR server
   */
  private generateQRCodeURL(data: string): string {
    // Using Google Charts QR Code API
    const encodedData = encodeURIComponent(data);
    const size = '300x300'; // QR code size
    const errorCorrection = 'M'; // Error correction level
    
    return `https://chart.googleapis.com/chart?chs=${size}&cht=qr&chl=${encodedData}&choe=UTF-8&chld=${errorCorrection}|2`;
  }

  /**
   * Get business routing statistics for QR code analytics
   */
  async getBusinessQRStats(businessId: string, userId: string): Promise<{
    routingCode: string;
    businessName: string;
    qrGenerated: boolean;
    suggestedMessages: string[];
  }> {
    const business = await this.businessService.getBusinessById(businessId, userId);
    
    if (!business.routingCode) {
      return {
        routingCode: '',
        businessName: business.name,
        qrGenerated: false,
        suggestedMessages: ['Please set a routing code first'],
      };
    }

    const prefix = this.businessPrefix;
    const routingCode = business.routingCode;

    const suggestedMessages = [
      `"Scan to book at ${business.name}"`,
      `"Quick booking: ${prefix}${routingCode}"`,
      `"WhatsApp us: BOOK_AT_${prefix}${routingCode}"`,
      `"Message us: SALON_${prefix}${routingCode}"`,
    ];

    return {
      routingCode,
      businessName: business.name,
      qrGenerated: true,
      suggestedMessages,
    };
  }

  /**
   * Validate routing code and suggest alternatives
   */
  async validateAndSuggestCode(preferredCode: string): Promise<{
    isAvailable: boolean;
    suggestions: string[];
  }> {
    const isAvailable = await this.businessRoutingService.isCodeAvailable(preferredCode);
    
    if (isAvailable) {
      return { isAvailable: true, suggestions: [] };
    }

    const suggestions = await this.businessRoutingService.suggestSimilarCodes(preferredCode, 5);
    return { isAvailable: false, suggestions };
  }

  /**
   * Generate shareable marketing materials
   */
  async generateMarketingMaterials(
    businessId: string, 
    userId: string
  ): Promise<{
    qrCodes: WhatsAppQRCodeData[];
    printableText: string[];
    socialMediaText: string[];
  }> {
    const business = await this.businessService.getBusinessById(businessId, userId);
    
    if (!business.routingCode) {
      throw new NotFoundException('Business routing code required for marketing materials');
    }

    const qrCodes = await this.generateBusinessQRVariations(businessId, userId);
    const routingCode = business.routingCode;
    const prefix = this.businessPrefix;

    const printableText = [
      `📱 Book with ${business.name}`,
      `Text us: ${prefix}${routingCode}`,
      `WhatsApp: ${this.whatsappNumber}`,
      `Message: "BOOK_AT_${prefix}${routingCode}"`,
    ];

    const socialMediaText = [
      `🚀 Now booking on WhatsApp! Text "${prefix}${routingCode}" to ${this.whatsappNumber}`,
      `📅 Quick appointments at ${business.name} - just send "${prefix}${routingCode}"!`,
      `💬 Skip the call, just text! Message us "${prefix}${routingCode}" to book instantly`,
    ];

    return {
      qrCodes,
      printableText,
      socialMediaText,
    };
  }
}