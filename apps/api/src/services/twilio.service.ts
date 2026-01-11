/**
 * Twilio Service
 * 
 * Handles SMS OTP sending via Twilio Verify API.
 * Only used in production mode.
 */

import Twilio from 'twilio';
import { getConfig } from '../config';
import { logger } from '../utils/logger';

class TwilioService {
  private client: Twilio.Twilio | null = null;
  private verifyServiceSid: string | null = null;

  private getClient(): Twilio.Twilio {
    if (!this.client) {
      const config = getConfig();
      
      if (!config.twilioAccountSid || !config.twilioAuthToken) {
        throw new Error('Twilio credentials not configured');
      }

      this.client = Twilio(config.twilioAccountSid, config.twilioAuthToken);
      this.verifyServiceSid = config.twilioVerifyServiceSid || null;
    }
    return this.client;
  }

  /**
   * Send OTP via Twilio Verify API
   */
  async sendOtp(phone: string): Promise<{ success: boolean; sid?: string }> {
    try {
      const client = this.getClient();
      
      if (!this.verifyServiceSid) {
        throw new Error('Twilio Verify Service SID not configured');
      }

      const verification = await client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          to: phone,
          channel: 'sms',
        });

      logger.info({ phone, sid: verification.sid }, 'OTP sent via Twilio');
      
      return { success: true, sid: verification.sid };
    } catch (error) {
      logger.error({ error, phone }, 'Failed to send OTP via Twilio');
      throw error;
    }
  }

  /**
   * Verify OTP via Twilio Verify API
   */
  async verifyOtp(phone: string, code: string): Promise<{ valid: boolean }> {
    try {
      const client = this.getClient();
      
      if (!this.verifyServiceSid) {
        throw new Error('Twilio Verify Service SID not configured');
      }

      const verificationCheck = await client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phone,
          code,
        });

      const valid = verificationCheck.status === 'approved';
      
      logger.info({ phone, valid }, 'OTP verification result from Twilio');
      
      return { valid };
    } catch (error) {
      logger.error({ error, phone }, 'Failed to verify OTP via Twilio');
      return { valid: false };
    }
  }
}

export const twilioService = new TwilioService();
