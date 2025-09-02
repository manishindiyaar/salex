import { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookPayloadDto } from './dto/whatsapp-webhook.dto';
import { ApiResponse } from 'shared-types';
export declare class WhatsAppController {
    private readonly whatsappService;
    private readonly configService;
    private readonly logger;
    constructor(whatsappService: WhatsAppService, configService: ConfigService);
    verifyWebhook(query: any): Promise<string>;
    handleWebhook(req: RawBodyRequest<Request>, payload: WhatsAppWebhookPayloadDto, signature?: string): Promise<ApiResponse<{
        status: string;
    }>>;
    healthCheck(): Promise<ApiResponse<{
        status: string;
        timestamp: string;
    }>>;
}
