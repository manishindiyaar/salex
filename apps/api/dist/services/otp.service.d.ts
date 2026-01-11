/**
 * OTP Service
 *
 * Handles OTP generation, storage, and verification.
 *
 * Dev mode: Uses magic code "123456" stored in database.
 * Prod mode: Uses Twilio Verify API (Twilio manages the OTP).
 */
declare class OtpService {
    /**
     * Check if we should use dev mode (database OTP) or production (Twilio Verify)
     */
    private shouldUseDevMode;
    /**
     * Request OTP for a phone number
     */
    requestOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Verify OTP for a phone number
     */
    verifyOtp(phone: string, code: string): Promise<{
        valid: boolean;
        message: string;
    }>;
    /**
     * Verify OTP from database (dev mode)
     */
    private verifyOtpFromDatabase;
    /**
     * Verify OTP via Twilio Verify API (production mode)
     */
    private verifyOtpViaTwilio;
    /**
     * Clean up expired OTPs (can be called periodically)
     */
    cleanupExpiredOtps(): Promise<number>;
}
export declare const otpService: OtpService;
export {};
//# sourceMappingURL=otp.service.d.ts.map