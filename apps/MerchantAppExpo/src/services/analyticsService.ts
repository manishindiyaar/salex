import apiClient from './apiClient';
import {
  AnalyticsSummary,
} from '../types';

const BASE = '/analytics';

export interface AnalyticsQueryParams {
  businessId: string;
  from?: string; // ISO date or datetime
  to?: string;   // ISO date or datetime
  tz?: string;   // timezone id e.g., 'Asia/Kolkata'
}

export async function getDailyAnalytics(params: AnalyticsQueryParams) {
  const res = await apiClient.get<AnalyticsSummary>(`${BASE}/daily`, { params });
  return res.data;
}

export async function getSummary(params: AnalyticsQueryParams) {
  const res = await apiClient.get<AnalyticsSummary>(`${BASE}/summary`, { params });
  return res.data;
}

export const AnalyticsService = {
  getDailyAnalytics,
  getSummary,
};

export default AnalyticsService;
