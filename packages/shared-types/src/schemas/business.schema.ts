/**
 * Business Zod Schemas
 */

import { z } from 'zod';

// Phone number validation (E.164 format) - more lenient to accept various formats
// Accepts: +919876543210, +1234567890, etc.
const phoneSchema = z.string().regex(/^\+\d{10,15}$/, 'Invalid phone format. Use E.164 format (e.g., +919876543210)');

// Hours of operation schema
const hoursOfOperationSchema = z.record(
  z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    close: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
    closed: z.boolean().optional(),
  })
).optional();

// Routing code validation (exactly 4 digits)
const routingCodeSchema = z.string().length(4).regex(/^\d{4}$/, 'Routing code must be exactly 4 digits');

// Business category enum (matches Prisma enum)
export const businessCategorySchema = z.enum([
  'SALON',
  'BEAUTY_PARLOR',
  'SPA',
  'CLINIC',
  'FITNESS',
  'OTHER',
]);

export type BusinessCategoryType = z.infer<typeof businessCategorySchema>;

// Business creation
export const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: phoneSchema,
  routingCode: routingCodeSchema.optional(),
  category: businessCategorySchema.optional(), // NEW: Business category
  hoursOfOperation: hoursOfOperationSchema,
  maxConcurrentBookings: z.number().int().min(1).max(20).default(1).optional(),
  isAcceptingOrders: z.boolean().default(true).optional(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

// Alias for backward compatibility
export type CreateBusinessRequest = CreateBusinessInput;

// Business update - all fields optional
export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phoneNumber: phoneSchema.optional(),
  routingCode: routingCodeSchema.optional(),
  category: businessCategorySchema.optional(), // NEW: Business category
  hoursOfOperation: hoursOfOperationSchema,
  maxConcurrentBookings: z.number().int().min(1).max(20).optional(),
  isAcceptingOrders: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
  address: z.string().max(500).optional(), // NEW: Address field
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

// Alias for backward compatibility
export type UpdateBusinessRequest = UpdateBusinessInput;

// Business lookup by routing code
export const businessRoutingCodeSchema = z.object({
  code: routingCodeSchema,
});

export type BusinessRoutingCodeInput = z.infer<typeof businessRoutingCodeSchema>;

/**
 * Helper function to format phone number to E.164 format
 * @param phone - Phone number in any format
 * @param countryCode - Country code (default: +91 for India)
 * @returns Phone number in E.164 format
 */
export function formatPhoneToE164(phone: string, countryCode: string = '+91'): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code (starts with country code digits)
  if (phone.startsWith('+')) {
    return '+' + digits;
  }
  
  // If starts with 0, remove it (common in India)
  const cleanDigits = digits.startsWith('0') ? digits.slice(1) : digits;
  
  // Add country code
  return countryCode + cleanDigits;
}
