/**
 * Application Configuration
 *
 * Centralized configuration with Zod validation.
 * NEVER use process.env directly in application code.
 */
import { z } from 'zod';
declare const configSchema: z.ZodObject<{
    nodeEnv: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    port: z.ZodDefault<z.ZodNumber>;
    enableAuth: z.ZodEffects<z.ZodDefault<z.ZodBoolean>, boolean, unknown>;
    databaseUrl: z.ZodString;
    directUrl: z.ZodString;
    supabaseUrl: z.ZodString;
    supabaseAnonKey: z.ZodString;
    supabaseServiceKey: z.ZodString;
    supabaseJwtSecret: z.ZodString;
    twilioAccountSid: z.ZodOptional<z.ZodString>;
    twilioAuthToken: z.ZodOptional<z.ZodString>;
    twilioVerifyServiceSid: z.ZodOptional<z.ZodString>;
    devPhoneWhitelist: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    devMagicOtp: z.ZodDefault<z.ZodString>;
    whatsappAppSecret: z.ZodOptional<z.ZodString>;
    whatsappAccessToken: z.ZodOptional<z.ZodString>;
    whatsappPhoneNumberId: z.ZodOptional<z.ZodString>;
    whatsappVerifyToken: z.ZodOptional<z.ZodString>;
    whatsappMode: z.ZodDefault<z.ZodEnum<["production", "simulator"]>>;
    simulatorDefaultBusinessId: z.ZodOptional<z.ZodString>;
    webhookBaseUrl: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nodeEnv: "development" | "production" | "test";
    port: number;
    enableAuth: boolean;
    databaseUrl: string;
    directUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
    supabaseJwtSecret: string;
    devPhoneWhitelist: string[];
    devMagicOtp: string;
    whatsappMode: "production" | "simulator";
    webhookBaseUrl: string;
    twilioAccountSid?: string | undefined;
    twilioAuthToken?: string | undefined;
    twilioVerifyServiceSid?: string | undefined;
    whatsappAppSecret?: string | undefined;
    whatsappAccessToken?: string | undefined;
    whatsappPhoneNumberId?: string | undefined;
    whatsappVerifyToken?: string | undefined;
    simulatorDefaultBusinessId?: string | undefined;
}, {
    databaseUrl: string;
    directUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceKey: string;
    supabaseJwtSecret: string;
    nodeEnv?: "development" | "production" | "test" | undefined;
    port?: number | undefined;
    enableAuth?: unknown;
    twilioAccountSid?: string | undefined;
    twilioAuthToken?: string | undefined;
    twilioVerifyServiceSid?: string | undefined;
    devPhoneWhitelist?: string[] | undefined;
    devMagicOtp?: string | undefined;
    whatsappAppSecret?: string | undefined;
    whatsappAccessToken?: string | undefined;
    whatsappPhoneNumberId?: string | undefined;
    whatsappVerifyToken?: string | undefined;
    whatsappMode?: "production" | "simulator" | undefined;
    simulatorDefaultBusinessId?: string | undefined;
    webhookBaseUrl?: string | undefined;
}>;
export type AppConfig = z.infer<typeof configSchema>;
export declare function getConfig(): AppConfig;
export declare function isDevelopment(): boolean;
export declare function isProduction(): boolean;
export declare function isSimulatorMode(): boolean;
export declare function isPhoneWhitelisted(phone: string): boolean;
export {};
//# sourceMappingURL=index.d.ts.map