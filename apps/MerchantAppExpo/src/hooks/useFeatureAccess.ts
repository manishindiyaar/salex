/**
 * useFeatureAccess Hook
 * 
 * Checks feature availability based on subscription plan.
 * Task 20: Feature Gating
 */

import { useState, useEffect, useCallback } from 'react';
import { useBusinessStore } from '../store/businessStore';
import apiClient from '../services/apiClient';

interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  suggestedPlan?: 'BASIC' | 'PRO' | 'CUSTOM';
  loading: boolean;
}

// Cache for feature access results
const featureCache = new Map<string, { result: FeatureAccessResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFeatureAccess(featureCode: string): FeatureAccessResult {
  const { business } = useBusinessStore();
  const [result, setResult] = useState<FeatureAccessResult>({
    allowed: false,
    loading: true,
  });

  const checkAccess = useCallback(async () => {
    if (!business?.id) {
      setResult({ allowed: false, loading: false, reason: 'No business found' });
      return;
    }

    const cacheKey = `${business.id}:${featureCode}`;
    const cached = featureCache.get(cacheKey);
    
    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResult({ ...cached.result, loading: false });
      return;
    }

    try {
      const response = await apiClient.get<{
        allowed: boolean;
        reason?: string;
        suggestedPlan?: 'BASIC' | 'PRO' | 'CUSTOM';
      }>(`/v1/businesses/${business.id}/features/${featureCode}`);

      const accessResult: FeatureAccessResult = {
        allowed: response.data.allowed,
        reason: response.data.reason,
        suggestedPlan: response.data.suggestedPlan,
        loading: false,
      };

      // Cache the result
      featureCache.set(cacheKey, { result: accessResult, timestamp: Date.now() });
      setResult(accessResult);
    } catch (error: any) {
      // On error, default to checking local subscription data
      const subscription = (business as any).subscription;
      
      if (!subscription) {
        setResult({ allowed: false, loading: false, reason: 'No subscription found' });
        return;
      }

      // Simple local check based on plan
      const proFeatures = ['whatsapp_booking', 'customer_history', 'automated_reminders', 'advanced_analytics'];
      const customFeatures = ['own_whatsapp_number', 'website_widget', 'custom_branding', 'api_access'];

      let allowed = true;
      let suggestedPlan: 'PRO' | 'CUSTOM' | undefined;

      if (proFeatures.includes(featureCode) && subscription.plan === 'BASIC') {
        allowed = false;
        suggestedPlan = 'PRO';
      } else if (customFeatures.includes(featureCode) && subscription.plan !== 'CUSTOM') {
        allowed = false;
        suggestedPlan = 'CUSTOM';
      }

      setResult({
        allowed,
        suggestedPlan,
        reason: allowed ? undefined : `Feature not available in ${subscription.plan} plan`,
        loading: false,
      });
    }
  }, [business?.id, featureCode]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return result;
}

/**
 * Clear feature access cache (call after subscription changes)
 */
export function clearFeatureCache() {
  featureCache.clear();
}

/**
 * Check multiple features at once
 */
export function useMultipleFeatureAccess(featureCodes: string[]): Record<string, FeatureAccessResult> {
  const results: Record<string, FeatureAccessResult> = {};
  
  for (const code of featureCodes) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[code] = useFeatureAccess(code);
  }
  
  return results;
}

export default useFeatureAccess;
