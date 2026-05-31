/**
 * Auth Validation Schemas
 * Password login, password change, and admin provisioning.
 */

import { z } from 'zod';

const phoneSchema = z.string().regex(/^\+\d{10,15}$/, 'Invalid phone format. Use E.164 format (e.g., +919876543210)');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const optionalNonEmptyString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(1).max(max).optional()
  );

const normalizeProvisionPhone = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return trimmed;
};

const provisionPhoneSchema = z.preprocess(normalizeProvisionPhone, phoneSchema);

const optionalPhoneSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : normalizeProvisionPhone(value)),
  phoneSchema.optional()
);

// Password login
export const passwordLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

// Password change
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// Admin provisioning - service/resource/staff/hours sub-schemas
const provisionServiceSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  description: z.string().max(500).optional(),
});

const provisionResourceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const provisionStaffSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
});

const dayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  close: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  closed: z.boolean().optional(),
});

const hoursSchema = z.record(dayHoursSchema).optional();

// Admin merchant provisioning
export const adminProvisionSchema = z.object({
  ownerPhone: provisionPhoneSchema,
  temporaryPassword: passwordSchema.optional(),
  business: z.object({
    name: optionalNonEmptyString(100),
    phoneNumber: optionalPhoneSchema,
    category: z.enum(['SALON', 'BEAUTY_PARLOR', 'SPA', 'CLINIC', 'FITNESS', 'OTHER']),
    routingCode: z.string().length(4).regex(/^\d{4}$/).optional(),
  }),
  subscription: z.object({
    plan: z.enum(['BASIC', 'PRO', 'CUSTOM']).default('BASIC'),
    status: z.enum(['TRIAL', 'ACTIVE']).default('TRIAL'),
  }).optional(),
  onboarding: z.object({
    services: z.array(provisionServiceSchema).optional(),
    resources: z.array(provisionResourceSchema).optional(),
    staff: z.array(provisionStaffSchema).optional(),
    hoursOfOperation: hoursSchema,
  }).optional(),
  reason: z.string().max(500).optional(),
});
export type AdminProvisionInput = z.infer<typeof adminProvisionSchema>;

// Admin password reset
export const adminPasswordResetSchema = z.object({
  newPassword: passwordSchema,
  reason: z.string().min(1).max(500),
});
export type AdminPasswordResetInput = z.infer<typeof adminPasswordResetSchema>;
