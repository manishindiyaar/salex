/**
 * Twilio Service
 *
 * Handles SMS OTP sending via Twilio Verify API.
 * Only used in production mode.
 */
declare class TwilioService {
    private client;
    private verifyServiceSid;
    private getClient;
    /**
     * Send OTP via Twilio Verify API
     */
    sendOtp(phone: string): Promise<{
        success: boolean;
        sid?: string;
    }>;
    /**
     * Verify OTP via Twilio Verify API
     */
    verifyOtp(phone: string, code: string): Promise<{
        valid: boolean;
    }>;
}
export declare const twilioService: TwilioService;
export {};
//# sourceMappingURL=twilio.service.d.ts.map