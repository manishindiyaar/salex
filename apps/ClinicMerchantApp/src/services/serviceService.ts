import apiClient from './apiClient';
import {
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  Paginated,
} from '../types';

/**
 * NOTE: Merchant-only endpoints alignment (see docs/architecture/05-api-specification.md)
 * Spec-scoped service endpoints are under a business:
 * - GET  /businesses/{businessId}/services
 * - POST /businesses/{businessId}/services
 *
 * IMPORTANT: Do NOT modify end-user (WhatsApp) consumer endpoints that allow browsing services,
 * viewing slots, or booking slots. Those public/consumer APIs are separate and must remain untouched.
 *
 * Current file exposes a flat /services base for convenience. Prefer adding scoped helpers below to
 * match the spec while keeping backward compatibility.
 */
const BASE = '/services';

export interface ListServiceParams {
  page?: number;
  pageSize?: number;
  search?: string;
  businessId?: string;
}

/**
 * Merchant: Create a new service under a salon (spec-scoped)
 * Spec: POST /businesses/{businessId}/services
 */
export async function createBusinessService(businessId: string, payload: Omit<CreateServiceRequest, 'businessId'>) {
  const res = await apiClient.post<any, Omit<CreateServiceRequest, 'businessId'>>(
    `/businesses/${businessId}/services`,
    payload
  );
  // Backend returns {success: true, data: {service: {...}}}
  // API client wraps it as {data: {success, data: {service}}}
  return res.data.data.service;
}

/**
 * Legacy/flat create (out of spec). Keep only if backend supports it.
 */
export async function createService(payload: CreateServiceRequest) {
  const res = await apiClient.post<any, CreateServiceRequest>(`${BASE}`, payload);
  // Backend returns {success: true, data: {service: {...}}}
  return res.data.data?.service || res.data;
}

export async function updateService(id: string, payload: UpdateServiceRequest) {
  const res = await apiClient.patch<any, UpdateServiceRequest>(`${BASE}/${id}`, payload);
  // Backend returns {success: true, data: {service: {...}}}
  return res.data.data.service;
}

/**
 * Merchant: Update a service under a business (spec-scoped)
 * Spec: PUT /businesses/{businessId}/services/{serviceId}
 * Note: Redirected to PATCH /services/:id as implemented on the backend.
 */
export async function updateBusinessService(businessId: string, serviceId: string, payload: any) {
  const res = await apiClient.patch<any, any>(
    `/services/${serviceId}`,
    payload
  );
  // Backend returns {success: true, data: {service: {...}}}
  return res.data.data.service;
}

export async function getService(id: string) {
  const res = await apiClient.get<any>(`${BASE}/${id}`);
  // Backend returns {success: true, data: {service: {...}}}
  return res.data.data.service;
}

/**
 * Merchant: Delete a service under a business (spec-scoped)  
 * Spec: DELETE /businesses/{businessId}/services/{serviceId}
 * Note: Redirected to DELETE /services/:id as implemented on the backend.
 */
export async function deleteBusinessService(businessId: string, serviceId: string) {
  const res = await apiClient.delete<{ success: boolean }>(
    `/services/${serviceId}`
  );
  return res.data;
}

/**
 * Merchant: Get single service under a business (spec-scoped)
 * Spec: GET /businesses/{businessId}/services/{serviceId}  
 */
export async function getBusinessService(businessId: string, serviceId: string) {
  const res = await apiClient.get<Service>(
    `/businesses/${businessId}/services/${serviceId}`
  );
  return res.data;
}

/**
 * Merchant: List services for a salon (spec-scoped)
 * Spec: GET /businesses/{businessId}/services
 */
export async function listBusinessServices(businessId: string, params: Omit<ListServiceParams, 'businessId'> = {}) {
  console.log('🔍 Fetching services for business:', businessId, 'params:', params);
  const res = await apiClient.get<any>(`/businesses/${businessId}/services`, { 
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 50,
    }
  });
  console.log('📦 Raw API response:', JSON.stringify(res, null, 2));
  // Backend returns {data: ServicesResponse, message: string, success: boolean}
  // API client wraps it as {data: {data: ServicesResponse, message: string, success: boolean}}
  // So we need to extract res.data.data to get the actual services data
  return res.data.data;
}

/**
 * Legacy/flat listing (out of spec). Keep only if backend supports it.
 */
export async function listServices(params: ListServiceParams = {}) {
  const res = await apiClient.get<Paginated<Service>>(`${BASE}`, { params });
  return res.data;
}

export async function deleteService(id: string) {
  const res = await apiClient.delete<{ success: boolean }>(`${BASE}/${id}`);
  return res.data;
}

export const ServiceService = {
  create: createService,
  update: updateService,
  getById: getService,
  list: listServices,
  delete: deleteService,
};

export default ServiceService;
