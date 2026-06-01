/**
 * Credential Masking Utility
 *
 * Masks sensitive credential values for safe display in API responses.
 */

/**
 * Mask a credential value, showing only the last 4 characters.
 * Returns null if input is null/undefined.
 * If length < 4, returns all asterisks.
 */
export function maskCredential(value: string | null | undefined): string | null {
  if (value == null) return null;

  if (value.length >= 4) {
    return `****${value.slice(-4)}`;
  }

  return '*'.repeat(value.length);
}
