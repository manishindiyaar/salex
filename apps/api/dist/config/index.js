"use strict";
/**
 * Application Configuration
 *
 * Centralized configuration with Zod validation.
 * NEVER use process.env directly in application code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.isDevelopment = isDevelopment;
exports.isProduction = isProduction;
exports.isSimulatorMode = isSimulatorMode;
exports.isPhoneWhitelisted = isPhoneWhitelisted;
const zod_1 = require("zod");
const configSchema = zod_1.z.object({
    // Server
    nodeEnv: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    port: zod_1.z.coerce.number().default(3001),
    // Auth toggle for development (set ENABLE_AUTH=false to bypass auth)
    enableAuth: zod_1.z.preprocess((val) => val === undefined ? true : val === 'true' || val === true, zod_1.z.boolean().default(true)),
    // Supabase Cloud Database
    databaseUrl: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    directUrl: zod_1.z.string().min(1, 'DIRECT_URL is required'),
    // Supabase API
    supabaseUrl: zod_1.z.string().url('SUPABASE_URL must be a valid URL'),
    supabaseAnonKey: zod_1.z.string().min(1, 'SUPABASE_ANON_KEY is required'),
    supabaseServiceKey: zod_1.z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    supabaseJwtSecret: zod_1.z.string().min(1, 'SUPABASE_JWT_SECRET is required'),
    // Twilio (OTP)
    twilioAccountSid: zod_1.z.string().optional(),
    twilioAuthToken: zod_1.z.string().optional(),
    twilioVerifyServiceSid: zod_1.z.string().optional(),
    // Development OTP Bypass
    devPhoneWhitelist: zod_1.z.array(zod_1.z.string()).default([]),
    devMagicOtp: zod_1.z.string().default('123456'),
    // WhatsApp
    whatsappAppSecret: zod_1.z.string().optional(),
    whatsappAccessToken: zod_1.z.string().optional(),
    whatsappPhoneNumberId: zod_1.z.string().optional(),
    whatsappVerifyToken: zod_1.z.string().optional(),
    whatsappMode: zod_1.z.enum(['production', 'simulator']).default('simulator'),
    // Simulator
    simulatorDefaultBusinessId: zod_1.z.string().optional(),
    webhookBaseUrl: zod_1.z.string().default('http://localhost:3001'),
});
function loadConfig() {
    const rawConfig = {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        enableAuth: process.env.ENABLE_AUTH,
        databaseUrl: process.env.DATABASE_URL,
        directUrl: process.env.DIRECT_URL,
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
        devPhoneWhitelist: process.env.DEV_PHONE_WHITELIST?.split(',').filter(Boolean) || [],
        devMagicOtp: process.env.DEV_MAGIC_OTP,
        whatsappAppSecret: process.env.WHATSAPP_APP_SECRET,
        whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
        whatsappMode: process.env.WHATSAPP_MODE,
        simulatorDefaultBusinessId: process.env.SIMULATOR_DEFAULT_BUSINESS_ID,
        webhookBaseUrl: process.env.WEBHOOK_BASE_URL,
    };
    const result = configSchema.safeParse(rawConfig);
    if (!result.success) {
        console.error('❌ Invalid configuration:');
        console.error(result.error.format());
        throw new Error('Configuration validation failed');
    }
    return result.data;
}
// Singleton config instance
let _config = null;
function getConfig() {
    if (!_config) {
        _config = loadConfig();
    }
    return _config;
}
// Helper functions
function isDevelopment() {
    return getConfig().nodeEnv === 'development';
}
function isProduction() {
    return getConfig().nodeEnv === 'production';
}
function isSimulatorMode() {
    return getConfig().whatsappMode === 'simulator';
}
function isPhoneWhitelisted(phone) {
    return getConfig().devPhoneWhitelist.includes(phone);
}
//# sourceMappingURL=index.js.map