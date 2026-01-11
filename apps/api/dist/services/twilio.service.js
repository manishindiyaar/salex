"use strict";
/**
 * Twilio Service
 *
 * Handles SMS OTP sending via Twilio Verify API.
 * Only used in production mode.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class TwilioService {
    client = null;
    verifyServiceSid = null;
    getClient() {
        if (!this.client) {
            const config = (0, config_1.getConfig)();
            if (!config.twilioAccountSid || !config.twilioAuthToken) {
                throw new Error('Twilio credentials not configured');
            }
            this.client = (0, twilio_1.default)(config.twilioAccountSid, config.twilioAuthToken);
            this.verifyServiceSid = config.twilioVerifyServiceSid || null;
        }
        return this.client;
    }
    /**
     * Send OTP via Twilio Verify API
     */
    async sendOtp(phone) {
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
            logger_1.logger.info({ phone, sid: verification.sid }, 'OTP sent via Twilio');
            return { success: true, sid: verification.sid };
        }
        catch (error) {
            logger_1.logger.error({ error, phone }, 'Failed to send OTP via Twilio');
            throw error;
        }
    }
    /**
     * Verify OTP via Twilio Verify API
     */
    async verifyOtp(phone, code) {
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
            logger_1.logger.info({ phone, valid }, 'OTP verification result from Twilio');
            return { valid };
        }
        catch (error) {
            logger_1.logger.error({ error, phone }, 'Failed to verify OTP via Twilio');
            return { valid: false };
        }
    }
}
exports.twilioService = new TwilioService();
//# sourceMappingURL=twilio.service.js.map