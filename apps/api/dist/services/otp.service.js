"use strict";
/**
 * OTP Service
 *
 * Handles OTP generation, storage, and verification.
 *
 * Dev mode: Uses magic code "123456" stored in database.
 * Prod mode: Uses Twilio Verify API (Twilio manages the OTP).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = void 0;
const shared_types_1 = require("@salex/shared-types");
const config_1 = require("../config");
const twilio_service_1 = require("./twilio.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
class OtpService {
    /**
     * Check if we should use dev mode (database OTP) or production (Twilio Verify)
     */
    shouldUseDevMode(phone) {
        return (0, config_1.isDevelopment)() || (0, config_1.isPhoneWhitelisted)(phone);
    }
    /**
     * Request OTP for a phone number
     */
    async requestOtp(phone) {
        const config = (0, config_1.getConfig)();
        // Check if dev mode or whitelisted phone
        const useDevMode = this.shouldUseDevMode(phone);
        if (useDevMode) {
            // Dev mode: Store magic OTP in database
            await shared_types_1.prisma.otp.deleteMany({ where: { phone } });
            const code = config.devMagicOtp;
            await shared_types_1.prisma.otp.create({
                data: {
                    phone,
                    code,
                    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
                },
            });
            logger_1.logger.info({ phone, code }, '🔐 DEV MODE: OTP generated (check console)');
            console.log(`\n🔐 DEV OTP for ${phone}: ${code}\n`);
            return {
                success: true,
                message: 'OTP sent successfully (dev mode)',
            };
        }
        // Production mode: Use Twilio Verify API
        // Twilio generates and manages the OTP - we don't store it
        try {
            await twilio_service_1.twilioService.sendOtp(phone);
            logger_1.logger.info({ phone }, 'OTP sent via Twilio Verify');
            return {
                success: true,
                message: 'OTP sent successfully',
            };
        }
        catch (error) {
            logger_1.logger.error({ error, phone }, 'Failed to send OTP via Twilio');
            throw new errors_1.BusinessRuleError('Failed to send OTP. Please try again.');
        }
    }
    /**
     * Verify OTP for a phone number
     */
    async verifyOtp(phone, code) {
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
    async verifyOtpFromDatabase(phone, code) {
        const otpRecord = await shared_types_1.prisma.otp.findFirst({
            where: { phone },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpRecord) {
            return { valid: false, message: 'No OTP found. Please request a new one.' };
        }
        // Check expiry
        if (new Date() > otpRecord.expiresAt) {
            await shared_types_1.prisma.otp.delete({ where: { id: otpRecord.id } });
            return { valid: false, message: 'OTP expired. Please request a new one.' };
        }
        // Check attempts
        if (otpRecord.attempts >= MAX_ATTEMPTS) {
            await shared_types_1.prisma.otp.delete({ where: { id: otpRecord.id } });
            return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
        }
        // Verify code
        if (otpRecord.code !== code) {
            await shared_types_1.prisma.otp.update({
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
        await shared_types_1.prisma.otp.delete({ where: { id: otpRecord.id } });
        logger_1.logger.info({ phone }, 'OTP verified successfully (dev mode)');
        return { valid: true, message: 'OTP verified successfully' };
    }
    /**
     * Verify OTP via Twilio Verify API (production mode)
     */
    async verifyOtpViaTwilio(phone, code) {
        try {
            const result = await twilio_service_1.twilioService.verifyOtp(phone, code);
            if (result.valid) {
                logger_1.logger.info({ phone }, 'OTP verified successfully via Twilio');
                return { valid: true, message: 'OTP verified successfully' };
            }
            return { valid: false, message: 'Invalid OTP. Please try again.' };
        }
        catch (error) {
            logger_1.logger.error({ error, phone }, 'Failed to verify OTP via Twilio');
            return { valid: false, message: 'Verification failed. Please try again.' };
        }
    }
    /**
     * Clean up expired OTPs (can be called periodically)
     */
    async cleanupExpiredOtps() {
        const result = await shared_types_1.prisma.otp.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        if (result.count > 0) {
            logger_1.logger.info({ count: result.count }, 'Cleaned up expired OTPs');
        }
        return result.count;
    }
}
exports.otpService = new OtpService();
//# sourceMappingURL=otp.service.js.map