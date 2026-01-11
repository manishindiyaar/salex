/**
 * OTP Service
 * 
 * Handles OTP generation, storage, and verification.
 * 
 * Dev mode: Uses magic code "123456" stored in database.
 * Prod mode: Uses Twilio Verify API (Twilio manages the OTP).
 */

import { prisma } from '@salex/shared-types';
import { getConfig, isDevelopment, isPhoneWhitelisted } from '../config';
import { twilioService } from './twilio.service';
import { logger } from '../utils/logger';
import { BusinessRuleError } from '../utils/errors';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

class OtpService {
  /**
   * Check if we should use dev mode (database OTP) or production (Twilio Verify)
   */
  private shouldUseDevMode(phone: string): boolean {
    return isDevelopment() || isPhoneWhitelisted(phone);
  }

  /**
   * Request OTP for a phone number
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const config = getConfig();
    
    // Check if dev mode or whitelisted phone
    const useDevMode = this.shouldUseDevMode(phone);

    if (useDevMode) {
      // Dev mode: Store magic OTP in database
      await prisma.otp.deleteMany({ where: { phone } });
      
      const code = config.devMagicOtp;
      
      await prisma.otp.create({
        data: {
          phone,
          code,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        },
      });

      logger.info({ phone, code }, '🔐 DEV MODE: OTP generated (check console)');
      console.log(`\n🔐 DEV OTP for ${phone}: ${code}\n`);

      return {
        success: true,
        message: 'OTP sent successfully (dev mode)',
      };
    }

    // Production mode: Use Twilio Verify API
    // Twilio generates and manages the OTP - we don't store it
    try {
      await twilioService.sendOtp(phone);

      logger.info({ phone }, 'OTP sent via Twilio Verify');

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      logger.error({ error, phone }, 'Failed to send OTP via Twilio');
      throw new BusinessRuleError('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP for a phone number
   */
  async verifyOtp(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
    const useDevMode = this.shouldUseDevMode(phone);

    if (useDevMode) {
      // Dev mode: Verify against database
      return this.verifyOtpFromDatabase(phone, code);
    }

    // Production mode: Verify via Twilio Verify API
    return this.verifyOtpViaTwilio(phone, code);
  }

  /**
   * Verify OTP from database (dev mode)
   */
  private async verifyOtpFromDatabase(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
    const otpRecord = await prisma.otp.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { valid: false, message: 'No OTP found. Please request a new one.' };
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      return { valid: false, message: 'OTP expired. Please request a new one.' };
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    // Verify code
    if (otpRecord.code !== code) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      
      const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return { 
        valid: false, 
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.` 
      };
    }

    // OTP is valid - delete it
    await prisma.otp.delete({ where: { id: otpRecord.id } });

    logger.info({ phone }, 'OTP verified successfully (dev mode)');

    return { valid: true, message: 'OTP verified successfully' };
  }

  /**
   * Verify OTP via Twilio Verify API (production mode)
   */
  private async verifyOtpViaTwilio(phone: string, code: string): Promise<{ valid: boolean; message: string }> {
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
   * Clean up expired OTPs (can be called periodically)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Cleaned up expired OTPs');
    }

    return result.count;
  }
}

export const otpService = new OtpService();
