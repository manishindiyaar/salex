/**
 * Customer Zod Schemas
 */

import { z } from 'zod';

// Phone number validation (E.164 format or WhatsApp wa_id)
const phoneSchema = z.string().regex(/^\+?\d{10,15}$/, 'Invalid phone format');

// Customer creation
export const createCustomerSchema = z.object({
  phoneNumber: phoneSchema,
  name: z.string().min(1).max(100).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// Customer update
export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isBlocked: z.boolean().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

// Customer upsert (for WhatsApp flow)
export const upsertCustomerSchema = z.object({
  phoneNumber: phoneSchema,
  name: z.string().min(1).max(100).optional(),
});

export type UpsertCustomerInput = z.infer<typeof upsertCustomerSchema>;
