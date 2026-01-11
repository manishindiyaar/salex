/**
 * Staff Management Zod Schemas
 * 
 * Schemas for staff members who perform services
 */

import { z } from 'zod';

// Staff creation
export const createStaffSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  linkedResourceIds: z.array(z.string().cuid()).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// Staff update
export const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// Staff ID validation
export const staffIdSchema = z.object({
  id: z.string().cuid(),
});

export type StaffIdInput = z.infer<typeof staffIdSchema>;

// Staff list query
export const staffListQuerySchema = z.object({
  businessId: z.string().cuid(),
  includeInactive: z.boolean().default(false),
});

export type StaffListQueryInput = z.infer<typeof staffListQuerySchema>;

// Staff-Resource link
export const linkResourceSchema = z.object({
  resourceId: z.string().cuid(),
  isPrimary: z.boolean().default(false),
});

export type LinkResourceInput = z.infer<typeof linkResourceSchema>;

// Staff response
export const staffResponseSchema = z.object({
  id: z.string().cuid(),
  businessId: z.string().cuid(),
  name: z.string(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StaffResponse = z.infer<typeof staffResponseSchema>;

// Linked resource info
export const linkedResourceSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  isPrimary: z.boolean(),
});

export type LinkedResource = z.infer<typeof linkedResourceSchema>;

// Staff with stats and linked resources
export const staffWithStatsSchema = staffResponseSchema.extend({
  linkedResources: z.array(linkedResourceSchema),
  utilizationPercent: z.number().min(0).max(100),
  activeBookingsCount: z.number().int().min(0),
});

export type StaffWithStats = z.infer<typeof staffWithStatsSchema>;
