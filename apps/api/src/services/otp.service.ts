/**
 * OTP Service
 * 
 * Handles OTP generation, storage, and verification.
 * Respects auth feature flags - rejects requests when OTP is disabled.
 */

import { prisma } from '@salex/shared-types';
import { twilioService } from './twilio.service';
import { getAuthFlags } from '../config/auth-flags';
import { logger } from '../utils/logger';
import { BusinessRuleError } from '../utils/errors';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

class OtpService {
  /**
   * Request OTP for a phone number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const flags = getAuthFlags();
    if (!flags.otpLoginEnabled) {
      throw new BusinessRuleError('OTP login is currently disabled. Please use password login.');
    }

    try {
      await twilioService.sendOtp(phone);
      logger.info({ phone }, 'OTP sent via Twilio Verify');
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      logger.error({ error, phone }, 'Failed to send OTP via Twilio');
      throw new BusinessRuleError('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP for a phone number
   */
  async verifyOtp(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
    const flags = getAuthFlags();
    if (!flags.otpLoginEnabled) {
      return { valid: false, message: 'OTP login is currently disabled' };
    }

    try {
      const result = await twilioService.verifyOtp(phone, code);
      if (result.valid) {
        logger.info({ phone }, 'OTP verified successfully via Twilio');
        return { valid: true, message: 'OTP verified successfully' };
      }
      return { valid: false, message: 'Invalid OTP. Please try again.' };
    } catch (error) {
      logger.error({ error, phone }, 'Failed to verify OTP via Twilio');
      return { valid: false, message: 'Verification failed. Please try again.' };
    }
  }

  /**
   * Clean up expired OTPs
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info({ count: result.count }, 'Cleaned up expired OTPs');
    }
    return result.count;
  }
}

export const otpService = new OtpService();
