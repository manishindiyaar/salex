/**
 * Tests for admin provisioning and password auth flows.
 * Uses Vitest with mocked Prisma client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../utils/password';
import { getAuthFlags } from '../config/auth-flags';

// ─── Password Utility Tests ─────────────────────────────────────────────────

describe('password utility', () => {
  it('hashes and verifies a password correctly', async () => {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);

    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('CorrectPassword');
    const valid = await verifyPassword('WrongPassword', hash);
    expect(valid).toBe(false);
  });

  it('produces different hashes for same password (salt)', async () => {
    const hash1 = await hashPassword('SamePassword');
    const hash2 = await hashPassword('SamePassword');
    expect(hash1).not.toBe(hash2);
  });
});

// ─── Auth Flags Tests ───────────────────────────────────────────────────────

describe('auth flags', () => {
  beforeEach(() => {
    delete process.env.PASSWORD_LOGIN_ENABLED;
    delete process.env.OTP_LOGIN_ENABLED;
    delete process.env.OTP_ALLOW_NEW_USER_SIGNUP;
  });

  it('defaults to password enabled, OTP disabled', () => {
    const flags = getAuthFlags();
    expect(flags.passwordLoginEnabled).toBe(true);
    expect(flags.otpLoginEnabled).toBe(false);
    expect(flags.otpAllowNewUserSignup).toBe(false);
  });

  it('respects PASSWORD_LOGIN_ENABLED=false', () => {
    process.env.PASSWORD_LOGIN_ENABLED = 'false';
    const flags = getAuthFlags();
    expect(flags.passwordLoginEnabled).toBe(false);
  });

  it('respects OTP_LOGIN_ENABLED=true', () => {
    process.env.OTP_LOGIN_ENABLED = 'true';
    const flags = getAuthFlags();
    expect(flags.otpLoginEnabled).toBe(true);
  });

  it('respects OTP_ALLOW_NEW_USER_SIGNUP=true', () => {
    process.env.OTP_ALLOW_NEW_USER_SIGNUP = 'true';
    const flags = getAuthFlags();
    expect(flags.otpAllowNewUserSignup).toBe(true);
  });
});

// ─── Provisioning Schema Validation Tests ───────────────────────────────────

describe('admin provision schema validation', () => {
  // Import dynamically to avoid Prisma client initialization issues in test
  it('validates a correct provisioning payload', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const valid = adminProvisionSchema.safeParse({
      ownerPhone: '+919876543210',
      temporaryPassword: 'TempPass123!',
      business: {
        name: 'Test Salon',
        phoneNumber: '+919876543210',
        category: 'SALON',
      },
    });

    expect(valid.success).toBe(true);
  });

  it('accepts minimal admin provisioning with only phone and category', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const result = adminProvisionSchema.safeParse({
      ownerPhone: '+919876543210',
      business: {
        category: 'SALON',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.temporaryPassword).toBeUndefined();
      expect(result.data.business.name).toBeUndefined();
      expect(result.data.business.phoneNumber).toBeUndefined();
      expect(result.data.business.category).toBe('SALON');
    }
  });

  it('normalizes 10-digit India phone numbers for admin provisioning', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const result = adminProvisionSchema.safeParse({
      ownerPhone: '9876543210',
      business: {
        category: 'CLINIC',
        phoneNumber: '9876543211',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ownerPhone).toBe('+919876543210');
      expect(result.data.business.phoneNumber).toBe('+919876543211');
    }
  });

  it('rejects invalid phone format that cannot be normalized', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const result = adminProvisionSchema.safeParse({
      ownerPhone: '12345',
      temporaryPassword: 'TempPass123!',
      business: {
        name: 'Test Salon',
        phoneNumber: '+919876543210',
        category: 'SALON',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects short password when a temporary password is provided', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const result = adminProvisionSchema.safeParse({
      ownerPhone: '+919876543210',
      temporaryPassword: 'short',
      business: {
        name: 'Test Salon',
        phoneNumber: '+919876543210',
        category: 'SALON',
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid category', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const result = adminProvisionSchema.safeParse({
      ownerPhone: '+919876543210',
      temporaryPassword: 'TempPass123!',
      business: {
        name: 'Test',
        phoneNumber: '+919876543210',
        category: 'INVALID',
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional onboarding data', async () => {
    const { adminProvisionSchema } = await import('@salex/shared-types');

    const result = adminProvisionSchema.safeParse({
      ownerPhone: '+919876543210',
      temporaryPassword: 'TempPass123!',
      business: {
        name: 'Asha Clinic',
        phoneNumber: '+919876543210',
        category: 'CLINIC',
        routingCode: '1234',
      },
      subscription: { plan: 'PRO', status: 'ACTIVE' },
      onboarding: {
        services: [{ name: 'Consultation', price: 500, durationMinutes: 20 }],
        resources: [{ name: 'Room 1' }],
        staff: [{ name: 'Dr. Sharma', phone: '+919876543211' }],
        hoursOfOperation: {
          monday: { open: '08:00', close: '20:00' },
        },
      },
    });

    expect(result.success).toBe(true);
  });
});

// ─── Password Login Schema Tests ────────────────────────────────────────────

describe('password login schema', () => {
  it('validates correct login input', async () => {
    const { passwordLoginSchema } = await import('@salex/shared-types');

    const result = passwordLoginSchema.safeParse({
      phone: '+919876543210',
      password: 'mypassword',
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty password', async () => {
    const { passwordLoginSchema } = await import('@salex/shared-types');

    const result = passwordLoginSchema.safeParse({
      phone: '+919876543210',
      password: '',
    });

    expect(result.success).toBe(false);
  });
});

// ─── Password Change Schema Tests ───────────────────────────────────────────

describe('password change schema', () => {
  it('validates correct change input', async () => {
    const { passwordChangeSchema } = await import('@salex/shared-types');

    const result = passwordChangeSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
    });

    expect(result.success).toBe(true);
  });

  it('rejects new password under 8 chars', async () => {
    const { passwordChangeSchema } = await import('@salex/shared-types');

    const result = passwordChangeSchema.safeParse({
      currentPassword: 'OldPassword123',
      newPassword: 'short',
    });

    expect(result.success).toBe(false);
  });
});

// ─── Vertical Config Tests ──────────────────────────────────────────────────

describe('business verticals config', () => {
  it('returns correct terminology for SALON', async () => {
    const { getVerticalConfig } = await import('@salex/shared-types');
    const config = getVerticalConfig('SALON');

    expect(config.terminology.resource).toBe('Chair');
    expect(config.terminology.staff).toBe('Stylist');
    expect(config.defaultServices.length).toBeGreaterThan(0);
  });

  it('returns correct terminology for CLINIC', async () => {
    const { getVerticalConfig } = await import('@salex/shared-types');
    const config = getVerticalConfig('CLINIC');

    expect(config.terminology.resource).toBe('Room');
    expect(config.terminology.staff).toBe('Doctor');
  });

  it('falls back to OTHER for unknown category', async () => {
    const { getVerticalConfig } = await import('@salex/shared-types');
    const config = getVerticalConfig('UNKNOWN');

    expect(config.terminology.resource).toBe('Resource');
    expect(config.terminology.staff).toBe('Staff');
  });
});
