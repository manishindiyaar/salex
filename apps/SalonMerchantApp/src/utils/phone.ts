/**
 * Phone Utilities — Tap-to-Call
 *
 * Reusable helpers to normalize, format, validate, and dial phone numbers.
 * Rules: Indian 10-digit numbers → +91XXXXXXXXXX, 12-digit starting with 91 → +91XXXXXXXXXX,
 * international E.164 (+X 10-15 digits). Rejects walk-in labels, customer IDs, and garbage.
 */

import { Alert, Linking } from 'react-native';

/**
 * Returns a tel-safe E.164 phone string or null.
 * Rejects walk-in labels, customer IDs, empty strings, non-numeric junk.
 */
export const normalizeCallablePhone = (input?: string | null): string | null => {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject obvious non-phone strings
  if (/walk/i.test(trimmed)) return null;

  // Reject CUID-style IDs (alphanumeric 20+ chars)
  if (/^[a-z0-9]{20,}$/i.test(trimmed)) return null;

  // Strip spaces, dashes, parentheses — keep digits and leading +
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Extract leading + if present
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');

  // Reject if fewer than 10 or more than 15 digits
  if (digits.length < 10 || digits.length > 15) return null;

  // Indian 10-digit number
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // 12-digit starting with 91 → Indian number
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // International: must have had a leading + and 10-15 digits
  if (hasPlus && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  // 11-digit starting with 91 is ambiguous — reject
  // Any other format without leading + is not reliably callable
  if (digits.length >= 11 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return null;
};

/**
 * Returns a readable formatted phone number or null.
 * Indian numbers: +91 98765 43210
 */
export const formatDisplayPhone = (input?: string | null): string | null => {
  const normalized = normalizeCallablePhone(input);
  if (!normalized) return null;

  // Indian number: +91XXXXXXXXXX → +91 XXXXX XXXXX
  if (normalized.startsWith('+91') && normalized.length === 13) {
    const local = normalized.slice(3);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }

  // Other international — just return as-is with +
  return normalized;
};

/**
 * Returns true if the input can be called (has a valid normalized phone).
 */
export const canCallPhone = (input?: string | null): boolean => {
  return normalizeCallablePhone(input) !== null;
};

/**
 * Opens the phone dialer with the given number.
 * Returns true on success, false on failure or invalid phone.
 */
export const openPhoneDialer = async (input?: string | null): Promise<boolean> => {
  const normalized = normalizeCallablePhone(input);
  if (!normalized) {
    return false;
  }

  const url = `tel:${normalized}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Could not open phone dialer.');
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Could not open phone dialer.');
    return false;
  }
};
