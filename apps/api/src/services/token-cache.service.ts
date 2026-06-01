/**
 * Token Cache Service
 *
 * In-memory cache for decrypted WhatsApp channel credentials.
 * Entries expire after 5 minutes to limit exposure of decrypted tokens.
 */

interface CacheEntry {
  accessToken: string;
  phoneNumberId: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

class TokenCacheService {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cached credentials for a business. Returns null if expired or missing.
   */
  get(businessId: string): { accessToken: string; phoneNumberId: string } | null {
    const entry = this.cache.get(businessId);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(businessId);
      return null;
    }

    return { accessToken: entry.accessToken, phoneNumberId: entry.phoneNumberId };
  }

  /**
   * Cache credentials for a business with a 5-minute TTL.
   */
  set(businessId: string, data: { accessToken: string; phoneNumberId: string }): void {
    this.cache.set(businessId, {
      accessToken: data.accessToken,
      phoneNumberId: data.phoneNumberId,
      expiresAt: Date.now() + DEFAULT_TTL_MS,
    });
  }

  /**
   * Invalidate cached credentials for a business.
   */
  invalidate(businessId: string): void {
    this.cache.delete(businessId);
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }
}

export const tokenCacheService = new TokenCacheService();
