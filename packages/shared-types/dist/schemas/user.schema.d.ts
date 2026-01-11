/**
 * User & Authentication Zod Schemas
 */
import { z } from 'zod';
export declare const otpRequestSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export declare const otpVerifySchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    otp: string;
    phone: string;
}, {
    otp: string;
    phone: string;
}>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export declare const createUserSchema: z.ZodObject<{
    phone: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["OWNER", "STAFF"]>>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    role: "OWNER" | "STAFF";
}, {
    phone: string;
    role?: "OWNER" | "STAFF" | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export declare const updateUserSchema: z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<["OWNER", "STAFF"]>>;
}, "strip", z.ZodTypeAny, {
    role?: "OWNER" | "STAFF" | undefined;
}, {
    role?: "OWNER" | "STAFF" | undefined;
}>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
