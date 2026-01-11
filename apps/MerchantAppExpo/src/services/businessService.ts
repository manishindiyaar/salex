import apiClient from './apiClient';
import {
  Business,
  CreateBusinessInput,
  UpdateBusinessInput,
  Paginated,
} from '../types';

// Re-export types for backward compatibility
export type CreateBusinessRequest = CreateBusinessInput;
export type UpdateBusinessRequest = UpdateBusinessInput;

/**
 * Business service routes all network calls through the centralized API client.
 * IMPORTANT: Replace local interfaces with imports from packages/shared-types.
 * Endpoints should align with docs/architecture/05-api-specification.md
 */
/**
 * NOTE: Merchant-only endpoints per docs/architecture/05-api-specification.md
 * - GET /businesses/me
 * - PUT /businesses/{businessId}
 *
 * End-user (WhatsApp) consumer endpoints MUST NOT be modified here.
 * Those flows (browse services, view slots, book) are separate and remain untouched.
 */
const BASE = '/businesses';

export async function createBusiness(payload: CreateBusinessRequest) {
  const res = await apiClient.post<any, CreateBusinessRequest>(`${BASE}`, payload);
  // Backend returns {success: true, data: {business: {...}}}
  // API client wraps it as {data: {success, data: {business}}}
  // So we need to extract res.data.data.business to get the actual business object
  return res.data.data.business;
}

export async function updateBusiness(id: string, payload: UpdateBusinessRequest) {
  const res = await apiClient.patch<any, UpdateBusinessRequest>(`${BASE}/${id}`, payload);
  // Backend returns {success: true, data: {business: {...}}}
  // API client wraps it as {data: {success, data: {business}}}
  // So we need to extract res.data.data.business to get the actual business object
  return res.data.data.business;
}

/**
 * Merchant: Get current user's business profile
 * Spec: GET /businesses/me
 */
export async function getBusinessMe() {
  const res = await apiClient.get<any>(`/businesses/me`);
  // Backend returns {success: true, data: {business: {...}}}
  // API client wraps it as {data: {success, data: {business}}}
  // So we need to extract res.data.data.business to get the actual business object
  return res.data.data.business;
}

/**
 * Deprecated: Only use if backend supports direct GET by id for merchant dashboard needs.
 * Prefer getBusinessMe per spec.
 */
export async function getBusiness(id: string) {
  const res = await apiClient.get<any>(`${BASE}/${id}`);
  // Backend returns {success: true, data: {business: {...}}}
  // API client wraps it as {data: {success, data: {business}}}
  // So we need to extract res.data.data.business to get the actual business object
  return res.data.data.business;
}

/**
 * QR Code: GET /businesses/:businessId/qr-code -> { url: string }
 * Returns an object with a URL for the QR image.
 */
export interface QrCodeResponse {
  url: string;
}

export async function getBusinessQrCode(businessId: string) {
  const res = await apiClient.get<QrCodeResponse>(`/businesses/${businessId}/qr-code`);
  return res.data;
}

/**
 * Update business hours
 * PATCH /businesses/:businessId (with hoursOfOperation field)
 */
export async function updateBusinessHours(businessId: string, hoursOfOperation: Record<string, { open: string; close: string; closed: boolean }>) {
  const res = await apiClient.patch<any>(`${BASE}/${businessId}`, { hoursOfOperation });
  // Backend returns {success: true, data: {business: {...}}}
  // API client wraps it as {data: {success, data: {business}}}
  // So we need to extract res.data.data.business to get the actual business object
  return res.data.data.business;
}

export interface ListBusinessParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Deprecated/Out of spec for Merchant:
 * Spec does not define generic list. Keep only if backend supports it.
 */
export async function listBusinesses(params: ListBusinessParams = {}) {
  const res = await apiClient.get<Paginated<Business>>(`${BASE}`, { params });
  return res.data;
}

/**
 * Deprecated/Out of spec for Merchant:
 * Spec does not define delete. Keep only if backend supports it.
 */
export async function deleteBusiness(id: string) {
  const res = await apiClient.delete<{ success: boolean }>(`${BASE}/${id}`);
  return res.data;
}

/**
 * Convenience API naming aligned with our spec (if needed)
 */
export const BusinessService = {
  create: createBusiness,
  update: updateBusiness,
  getById: getBusiness,
  list: listBusinesses,
  delete: deleteBusiness,
};

export default BusinessService;
