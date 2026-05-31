/**
 * Application Configuration
 * 
 * Centralized configuration with Zod validation.
 * NEVER use process.env directly in application code.
 */

import { z } from 'zod';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://salex-admin-dashboard.vercel.app',
];

const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),
  
  // Auth toggle for development (set ENABLE_AUTH=false to bypass auth)
  enableAuth: z.preprocess(
    (val) => val === undefined ? true : val === 'true' || val === true,
    z.boolean().default(true)
  ),
  allowedOrigins: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return DEFAULT_ALLOWED_ORIGINS;
      const origins = val.split(',').map((origin) => origin.trim()).filter(Boolean);
      return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...origins]));
    },
    z.array(z.string().url()).default(DEFAULT_ALLOWED_ORIGINS)
  ),

  // Supabase Cloud Database
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
  directUrl: z.string().min(1, 'DIRECT_URL is required'),

  // Supabase API
  supabaseUrl: z.string().url('SUPABASE_URL must be a valid URL'),
  supabaseAnonKey: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  supabaseServiceKey: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  supabaseJwtSecret: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),

  // Twilio (OTP)
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioVerifyServiceSid: z.string().optional(),

  // WhatsApp
  whatsappAppSecret: z.string().optional(),
  whatsappAccessToken: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappVerifyToken: z.string().optional(),
  whatsappGraphApiVersion: z.string().default('v25.0'),
  whatsappMode: z.enum(['production', 'simulator']).default('simulator'),
  whatsappDbWorkersEnabled: z.preprocess(
    (val) => val === undefined ? true : val === 'true' || val === true,
    z.boolean().default(true)
  ),

  // Channel Encryption
  channelEncryptionKey: z.string().length(64).optional(), // 32 bytes hex for AES-256

  // Flow Engine
  flowEngineGlobalCutover: z.preprocess(
    (val) => val === undefined ? false : val === 'true' || val === true,
    z.boolean().default(false)
  ),

  // Simulator
  enableSimulatorRoutes: z.preprocess(
    (val) => val === undefined ? false : val === 'true' || val === true,
    z.boolean().default(false)
  ),
  simulatorDefaultBusinessId: z.string().optional(),
  webhookBaseUrl: z.string().default('http://localhost:3001'),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    enableAuth: process.env.ENABLE_AUTH,
    allowedOrigins: process.env.ALLOWED_ORIGINS,

    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,

    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,

    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,

    whatsappAppSecret: process.env.WHATSAPP_APP_SECRET,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    whatsappGraphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION,
    whatsappMode: process.env.WHATSAPP_MODE,
    whatsappDbWorkersEnabled: process.env.WHATSAPP_DB_WORKERS_ENABLED,

    channelEncryptionKey: process.env.CHANNEL_ENCRYPTION_KEY,

    flowEngineGlobalCutover: process.env.FLOW_ENGINE_GLOBAL_CUTOVER,

    simulatorDefaultBusinessId: process.env.SIMULATOR_DEFAULT_BUSINESS_ID,
    enableSimulatorRoutes: process.env.ENABLE_SIMULATOR_ROUTES,
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
let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

// Helper functions
export function isDevelopment(): boolean {
  return getConfig().nodeEnv === 'development';
}

export function isProduction(): boolean {
  return getConfig().nodeEnv === 'production';
}

export function isSimulatorMode(): boolean {
  return getConfig().whatsappMode === 'simulator';
}

export function areSimulatorRoutesEnabled(): boolean {
  const config = getConfig();
  return isDevelopment() || config.enableSimulatorRoutes;
}
