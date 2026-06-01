/**
 * Admin WhatsApp Channel Controller
 *
 * Handles admin operations for dedicated WhatsApp channel configuration:
 * - View channel status
 * - Configure credentials
 * - Test connection
 * - Connect / Disconnect
 */

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '@salex/shared-types';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
import { whatsappChannelService } from '../services/whatsapp-channel.service';
import { auditLogService } from '../services/audit-log.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const UpsertChannelSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  displayPhoneNumber: z.string().min(1, 'Display Phone Number is required'),
  wabaId: z.string().min(1, 'WABA ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  appSecret: z.string().min(1, 'App Secret is required'),
});

class AdminWhatsAppChannelController {
  /**
   * GET /admin/businesses/:businessId/whatsapp-channel
   * Returns channel config or shared indicator.
   */
  async getChannel(req: AdminRequest, res: Response) {
    const { businessId } = req.params;
    await this.validateBusinessExists(businessId);

    const channel = await whatsappChannelService.getChannel(businessId);

    if (!channel) {
      return res.json({
        success: true,
        data: {
          mode: 'SHARED',
          channel: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        mode: 'DEDICATED',
        channel,
      },
    });
  }

  /**
   * PUT /admin/businesses/:businessId/whatsapp-channel
   * Create or update dedicated channel credentials.
   */
  async upsertChannel(req: AdminRequest, res: Response) {
    const { businessId } = req.params;
    await this.validateBusinessExists(businessId);

    const parsed = UpsertChannelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid channel configuration', parsed.error);
    }

    const channel = await whatsappChannelService.upsertChannel(businessId, parsed.data);

    await auditLogService.logAction({
      adminId: req.admin.adminId,
      action: 'UPSERT_WHATSAPP_CHANNEL',
      entityType: 'WhatsAppChannel',
      entityId: channel.id,
      changes: {
        businessId,
        phoneNumberId: parsed.data.phoneNumberId,
        displayPhoneNumber: parsed.data.displayPhoneNumber,
        wabaId: parsed.data.wabaId,
        credentialsUpdated: true,
      },
    });

    logger.info(
      { adminId: req.admin.adminId, businessId, channelId: channel.id },
      'Admin configured WhatsApp channel'
    );

    res.json({
      success: true,
      data: { channel },
      message: 'WhatsApp channel configured successfully',
    });
  }

  /**
   * POST /admin/businesses/:businessId/whatsapp-channel/test
   * Test connection to Meta Graph API.
   */
  async testConnection(req: AdminRequest, res: Response) {
    const { businessId } = req.params;
    await this.validateBusinessExists(businessId);

    const result = await whatsappChannelService.testConnection(businessId);

    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * POST /admin/businesses/:businessId/whatsapp-channel/connect
   * Activate the channel for production use.
   */
  async connect(req: AdminRequest, res: Response) {
    const { businessId } = req.params;
    await this.validateBusinessExists(businessId);

    await whatsappChannelService.connect(businessId);

    await auditLogService.logAction({
      adminId: req.admin.adminId,
      action: 'CONNECT_WHATSAPP_CHANNEL',
      entityType: 'WhatsAppChannel',
      entityId: businessId,
      changes: { status: 'CONNECTED' },
    });

    res.json({
      success: true,
      message: 'WhatsApp channel connected',
    });
  }

  /**
   * POST /admin/businesses/:businessId/whatsapp-channel/disconnect
   * Disable the channel (retains credentials).
   */
  async disconnect(req: AdminRequest, res: Response) {
    const { businessId } = req.params;
    await this.validateBusinessExists(businessId);

    await whatsappChannelService.disconnect(businessId);

    await auditLogService.logAction({
      adminId: req.admin.adminId,
      action: 'DISCONNECT_WHATSAPP_CHANNEL',
      entityType: 'WhatsAppChannel',
      entityId: businessId,
      changes: { status: 'DISABLED' },
    });

    res.json({
      success: true,
      message: 'WhatsApp channel disconnected',
    });
  }

  private async validateBusinessExists(businessId: string): Promise<void> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundError('Business', businessId);
    }
  }
}

export const adminWhatsAppChannelController = new AdminWhatsAppChannelController();
