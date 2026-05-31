/**
 * WhatsApp Channel Service
 *
 * Manages dedicated WhatsApp channel configuration per business:
 * - CRUD operations with encrypted credential storage
 * - Connection testing via Meta Graph API
 * - Channel lifecycle (connect/disconnect)
 * - Credential retrieval for runtime message sending
 */

import { prisma } from '@salex/shared-types';
import { getConfig } from '../config';
import { encryptionService } from './encryption.service';
import { tokenCacheService } from './token-cache.service';
import { maskCredential } from '../utils/mask-credential';
import { BusinessRuleError, NotFoundError, ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ChannelUpsertInput {
  phoneNumberId: string;
  displayPhoneNumber: string;
  wabaId: string;
  accessToken: string;
  appSecret: string;
}

export interface ChannelResponse {
  id: string;
  businessId: string | null;
  mode: string;
  displayPhoneNumber: string;
  phoneNumberId: string;
  wabaId: string | null;
  status: string;
  accessTokenMasked: string | null;
  appSecretMasked: string | null;
  lastTestedAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectionResult {
  success: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  error?: string;
}

export interface ChannelCredentials {
  accessToken: string;
  appSecret: string;
  phoneNumberId: string;
}

class WhatsAppChannelService {
  /**
   * Get channel config for a business, with masked credentials.
   */
  async getChannel(businessId: string): Promise<ChannelResponse | null> {
    const channel = await prisma.whatsAppChannel.findUnique({
      where: { businessId },
    });

    if (!channel) return null;

    return {
      id: channel.id,
      businessId: channel.businessId,
      mode: channel.mode,
      displayPhoneNumber: channel.displayPhoneNumber,
      phoneNumberId: channel.phoneNumberId,
      wabaId: channel.wabaId,
      status: channel.status,
      accessTokenMasked: maskCredential(channel.accessToken ? 'configured' : null),
      appSecretMasked: maskCredential(channel.appSecret ? 'configured' : null),
      lastTestedAt: channel.lastTestedAt?.toISOString() ?? null,
      lastInboundAt: channel.lastInboundAt?.toISOString() ?? null,
      lastOutboundAt: channel.lastOutboundAt?.toISOString() ?? null,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };
  }

  /**
   * Create or update a dedicated channel for a business.
   * Encrypts credentials before storage.
   */
  async upsertChannel(businessId: string, input: ChannelUpsertInput): Promise<ChannelResponse> {
    // Check phoneNumberId uniqueness (must not belong to another business)
    const existing = await prisma.whatsAppChannel.findUnique({
      where: { phoneNumberId: input.phoneNumberId },
    });

    if (existing && existing.businessId !== businessId) {
      throw new ConflictError(
        `Phone Number ID ${input.phoneNumberId} is already assigned to another business`
      );
    }

    const encryptedAccessToken = encryptionService.encrypt(input.accessToken);
    const encryptedAppSecret = encryptionService.encrypt(input.appSecret);

    const channel = await prisma.whatsAppChannel.upsert({
      where: { businessId },
      create: {
        businessId,
        mode: 'DEDICATED',
        displayPhoneNumber: input.displayPhoneNumber,
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        accessToken: encryptedAccessToken,
        appSecret: encryptedAppSecret,
        status: 'PENDING',
      },
      update: {
        displayPhoneNumber: input.displayPhoneNumber,
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        accessToken: encryptedAccessToken,
        appSecret: encryptedAppSecret,
        status: 'PENDING',
        lastTestedAt: null,
      },
    });

    // Invalidate token cache since credentials changed
    tokenCacheService.invalidate(businessId);

    return {
      id: channel.id,
      businessId: channel.businessId,
      mode: channel.mode,
      displayPhoneNumber: channel.displayPhoneNumber,
      phoneNumberId: channel.phoneNumberId,
      wabaId: channel.wabaId,
      status: channel.status,
      accessTokenMasked: maskCredential('configured'),
      appSecretMasked: maskCredential('configured'),
      lastTestedAt: channel.lastTestedAt?.toISOString() ?? null,
      lastInboundAt: channel.lastInboundAt?.toISOString() ?? null,
      lastOutboundAt: channel.lastOutboundAt?.toISOString() ?? null,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };
  }

  /**
   * Test connection by calling Meta Graph API with decrypted token.
   */
  async testConnection(businessId: string): Promise<TestConnectionResult> {
    const channel = await prisma.whatsAppChannel.findUnique({
      where: { businessId },
    });

    if (!channel) {
      throw new NotFoundError('No WhatsApp channel configured for this business');
    }

    if (!channel.accessToken) {
      throw new BusinessRuleError('Access token not configured');
    }

    let decryptedToken: string;
    try {
      decryptedToken = encryptionService.decrypt(channel.accessToken);
    } catch (err) {
      logger.error({ businessId, error: err }, 'Failed to decrypt access token for test');
      return { success: false, error: 'Failed to decrypt access token' };
    }

    const config = getConfig();
    const url = `https://graph.facebook.com/${config.whatsappGraphApiVersion}/${channel.phoneNumberId}?fields=display_phone_number,verified_name`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${decryptedToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const errorMsg = (body as any)?.error?.message || `HTTP ${response.status}`;
        logger.warn({ businessId, status: response.status, errorMsg }, 'WhatsApp test connection failed');

        await prisma.whatsAppChannel.update({
          where: { id: channel.id },
          data: { status: 'FAILED', lastTestedAt: new Date() },
        });

        return { success: false, error: errorMsg };
      }

      const data = await response.json() as { display_phone_number?: string; verified_name?: string };

      await prisma.whatsAppChannel.update({
        where: { id: channel.id },
        data: { lastTestedAt: new Date() },
      });

      logger.info({ businessId, verifiedName: data.verified_name }, 'WhatsApp test connection succeeded');

      return {
        success: true,
        displayPhoneNumber: data.display_phone_number,
        verifiedName: data.verified_name,
      };
    } catch (err: any) {
      const errorMsg = err.name === 'AbortError' ? 'Connection timed out (10s)' : err.message;
      logger.error({ businessId, error: err }, 'WhatsApp test connection error');

      await prisma.whatsAppChannel.update({
        where: { id: channel.id },
        data: { status: 'FAILED', lastTestedAt: new Date() },
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Connect a channel (requires successful test first).
   */
  async connect(businessId: string): Promise<void> {
    const channel = await prisma.whatsAppChannel.findUnique({
      where: { businessId },
    });

    if (!channel) {
      throw new NotFoundError('No WhatsApp channel configured for this business');
    }

    if (!channel.lastTestedAt) {
      throw new BusinessRuleError('Channel must be tested successfully before connecting');
    }

    await prisma.whatsAppChannel.update({
      where: { id: channel.id },
      data: { status: 'CONNECTED' },
    });

    logger.info({ businessId, channelId: channel.id }, 'WhatsApp channel connected');
  }

  /**
   * Disconnect a channel. Retains credentials but sets status to DISABLED.
   */
  async disconnect(businessId: string): Promise<void> {
    const channel = await prisma.whatsAppChannel.findUnique({
      where: { businessId },
    });

    if (!channel) {
      throw new NotFoundError('No WhatsApp channel configured for this business');
    }

    await prisma.whatsAppChannel.update({
      where: { id: channel.id },
      data: { status: 'DISABLED' },
    });

    tokenCacheService.invalidate(businessId);

    logger.info({ businessId, channelId: channel.id }, 'WhatsApp channel disconnected');
  }

  /**
   * Get decrypted credentials for runtime use (sending messages, signature verification).
   * Returns null if no dedicated channel or credentials are missing.
   */
  async getCredentials(businessId: string): Promise<ChannelCredentials | null> {
    const channel = await prisma.whatsAppChannel.findUnique({
      where: { businessId },
    });

    if (!channel || channel.mode !== 'DEDICATED' || channel.status !== 'CONNECTED') {
      return null;
    }

    if (!channel.accessToken || !channel.appSecret) {
      return null;
    }

    try {
      const accessToken = encryptionService.decrypt(channel.accessToken);
      const appSecret = encryptionService.decrypt(channel.appSecret);

      return {
        accessToken,
        appSecret,
        phoneNumberId: channel.phoneNumberId,
      };
    } catch (err) {
      logger.error({ businessId, error: err }, 'Failed to decrypt channel credentials');
      return null;
    }
  }
}

export const whatsappChannelService = new WhatsAppChannelService();
