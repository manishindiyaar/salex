/**
 * Phone Utilities for React Native
 * 
 * React Native-safe phone formatting utilities that don't depend on shared-types
 * to avoid Prisma client import issues.
 */

/**
 * Format phone number to E164 format
 * Simple implementation for React Native without external dependencies
 */
export const formatPhoneToE164 = (phone: string, countryCode: string = '+91'): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it already starts with country code digits, return with +
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If it's a 10-digit Indian number, add +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If it already has + at the start, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: add the country code
  return `${countryCode}${digits}`;
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const e164 = formatPhoneToE164(phone);
  // Basic validation for E164 format
  return /^\+[1-9]\d{1,14}$/.test(e164);
};

/**
 * Format phone number for display
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const e164 = formatPhoneToE164(phone);
  
  // Format Indian numbers as +91 XXXXX XXXXX
  if (e164.startsWith('+91') && e164.length === 13) {
    const number = e164.slice(3);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  
  return e164;
};