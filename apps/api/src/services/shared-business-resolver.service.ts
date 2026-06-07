/**
 * Shared Business Resolver
 *
 * Resolves user queries on the shared WhatsApp number into business matches.
 * Supports: exact routing code, S1234-style codes, business name search,
 * address/area/city search, and last-used business for returning customers.
 *
 * Ranking:
 *   1. Exact routing code match
 *   2. Exact business name match
 *   3. Business name starts with query
 *   4. Business name contains query
 *   5. Address/slug contains query
 *   6. Last selected business for the customer phone
 *
 * Future: Redis/BullMQ for caching resolver results and rate-limiting.
 */

import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BusinessMatch {
  id: string;
  name: string;
  routingCode: string | null;
  category: string | null;
  slug: string | null;
  isAcceptingOrders: boolean;
}

export interface ResolveResult {
  /** Single confident match — start session immediately */
  exactMatch: BusinessMatch | null;
  /** List of candidates for interactive selection */
  matches: BusinessMatch[];
  /** True when nothing matched */
  noMatch: boolean;
  /** How the result was resolved */
  resolvedBy: 'routing_code' | 'name_exact' | 'search' | 'none';
}

export interface ResolveInput {
  query: string;
  customerPhone?: string;
  limit?: number;
}

// ─── Routing code extraction ─────────────────────────────────────────────────

const ROUTING_CODE_PATTERNS = [
  /^[sS](\d{4})$/,   // S1234, s1234
  /^(\d{4})$/,       // Just 4 digits
];

/**
 * Extract a 4-digit routing code from user input.
 * Returns the digits only, or null if not a routing code.
 */
function extractRoutingCode(text: string): string | null {
  const trimmed = text.trim();
  for (const pattern of ROUTING_CODE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

class SharedBusinessResolverService {
  /**
   * Resolve a user query into business matches.
   * Attempts routing code first, then name/search.
   */
  async resolve(input: ResolveInput): Promise<ResolveResult> {
    const { query, customerPhone, limit = 5 } = input;
    const trimmed = query.trim();

    if (!trimmed) {
      return { exactMatch: null, matches: [], noMatch: true, resolvedBy: 'none' };
    }

    // 1. Try routing code extraction
    const routingCode = extractRoutingCode(trimmed);
    if (routingCode) {
      const result = await this.resolveByRoutingCode(routingCode);
      if (result) return result;
      // Code didn't match any business — fall through to search
    }

    // 2. Search by name / address / slug
    const searchResult = await this.searchBusinesses(trimmed, limit);

    // 3. If no search results and we have a customerPhone, try last-used
    if (searchResult.matches.length === 0 && customerPhone) {
      const lastUsed = await this.getLastUsedBusiness(customerPhone);
      if (lastUsed) {
        return {
          exactMatch: null,
          matches: [lastUsed],
          noMatch: false,
          resolvedBy: 'search',
        };
      }
    }

    return searchResult;
  }

  /**
   * Resolve by exact routing code.
   */
  private async resolveByRoutingCode(code: string): Promise<ResolveResult | null> {
    const business = await prisma.business.findUnique({
      where: { routingCode: code },
      select: {
        id: true,
        name: true,
        routingCode: true,
        category: true,
        slug: true,
        isActive: true,
        isAcceptingOrders: true,
      },
    });

    if (!business || !business.isActive) return null;

    const match: BusinessMatch = {
      id: business.id,
      name: business.name,
      routingCode: business.routingCode,
      category: business.category,
      slug: business.slug,
      isAcceptingOrders: business.isAcceptingOrders,
    };

    logger.info({ routingCode: code, businessId: business.id }, 'Business resolved by routing code');

    return {
      exactMatch: match,
      matches: [match],
      noMatch: false,
      resolvedBy: 'routing_code',
    };
  }

  /**
   * Search businesses by name, slug, or address fields.
   * Uses case-insensitive LIKE matching. Ranks results by relevance.
   */
  private async searchBusinesses(query: string, limit: number): Promise<ResolveResult> {
    const lowerQuery = query.toLowerCase();

    // Query active businesses matching by name or slug (case-insensitive)
    const candidates = await prisma.business.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        routingCode: true,
        category: true,
        slug: true,
        isAcceptingOrders: true,
      },
      take: limit * 2, // Fetch extra for ranking/filtering
    });

    if (candidates.length === 0) {
      return { exactMatch: null, matches: [], noMatch: true, resolvedBy: 'none' };
    }

    // Rank results
    const scored = candidates.map(b => {
      const nameLower = b.name.toLowerCase();
      let score = 0;

      if (nameLower === lowerQuery) score = 100;         // exact name match
      else if (nameLower.startsWith(lowerQuery)) score = 80; // starts with
      else if (nameLower.includes(lowerQuery)) score = 60;   // contains in name
      else score = 40; // slug/address match

      return { ...b, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const matches: BusinessMatch[] = scored.slice(0, limit).map(({ score: _score, ...rest }) => rest);

    // If top result is an exact name match, treat as exact
    if (scored[0].score === 100 && scored.length === 1) {
      return {
        exactMatch: matches[0],
        matches,
        noMatch: false,
        resolvedBy: 'name_exact',
      };
    }

    return {
      exactMatch: null,
      matches,
      noMatch: false,
      resolvedBy: 'search',
    };
  }

  /**
   * Get the last business a customer interacted with (for returning users).
   */
  private async getLastUsedBusiness(customerPhone: string): Promise<BusinessMatch | null> {
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        customerPhone,
        businessId: { not: null },
      },
      orderBy: { lastMessageAt: 'desc' },
      select: {
        business: {
          select: {
            id: true,
            name: true,
            routingCode: true,
            category: true,
            slug: true,
            isActive: true,
            isAcceptingOrders: true,
          },
        },
      },
    });

    const biz = conversation?.business;
    if (!biz || !biz.isActive) return null;

    return {
      id: biz.id,
      name: biz.name,
      routingCode: biz.routingCode,
      category: biz.category,
      slug: biz.slug,
      isAcceptingOrders: biz.isAcceptingOrders,
    };
  }
}

export const sharedBusinessResolver = new SharedBusinessResolverService();
