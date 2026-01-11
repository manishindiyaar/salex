/**
 * Service Catalog Zod Schemas
 */

import { z } from 'zod';

// Service creation
export const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive().multipleOf(0.01),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  isActive: z.boolean().default(true),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

// Service update
export const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive().multipleOf(0.01).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// Service ID validation
export const serviceIdSchema = z.object({
  id: z.string().cuid(),
});

export type ServiceIdInput = z.infer<typeof serviceIdSchema>;

// Service list query
export const serviceListQuerySchema = z.object({
  businessId: z.string().cuid(),
  includeInactive: z.boolean().default(false),
});

export type ServiceListQueryInput = z.infer<typeof serviceListQuerySchema>;
