/**
 * Resource Service
 * 
 * API client for resource management endpoints.
 * 
 * Endpoints:
 * - GET    /businesses/{businessId}/resources           - List resources
 * - POST   /businesses/{businessId}/resources           - Create resource
 * - POST   /businesses/{businessId}/resources/bulk      - Bulk create resources
 * - GET    /businesses/{businessId}/resources/{id}      - Get single resource
 * - PUT    /businesses/{businessId}/resources/{id}      - Update resource
 * - POST   /businesses/{businessId}/resources/{id}/deactivate   - Deactivate
 * - POST   /businesses/{businessId}/resources/{id}/reactivate   - Reactivate
 */

import apiClient from './apiClient';
import {
  Resource,
  CreateResourceInput,
  UpdateResourceInput,
  BulkCreateResourceInput,
  ResourceWithStats,
} from '../types';

export interface ListResourceParams {
  includeInactive?: boolean;
}

/**
 * List resources for a business
 */
export async function listResources(
  businessId: string,
  params: ListResourceParams = {}
): Promise<ResourceWithStats[]> {
  const res = await apiClient.get<any>(`/businesses/${businessId}/resources`, { params });
  return res.data.data?.resources || res.data.data || [];
}

/**
 * Create a single resource
 */
export async function createResource(
  businessId: string,
  payload: CreateResourceInput
): Promise<Resource> {
  const res = await apiClient.post<any>(`/businesses/${businessId}/resources`, payload);
  return res.data.data?.resource || res.data.data;
}

/**
 * Bulk create resources (e.g., "5 chairs")
 */
export async function bulkCreateResources(
  businessId: string,
  payload: BulkCreateResourceInput
): Promise<Resource[]> {
  const res = await apiClient.post<any>(`/businesses/${businessId}/resources/bulk`, payload);
  return res.data.data?.resources || res.data.data || [];
}

/**
 * Get a single resource by ID
 */
export async function getResource(
  businessId: string,
  resourceId: string
): Promise<ResourceWithStats> {
  const res = await apiClient.get<any>(`/businesses/${businessId}/resources/${resourceId}`);
  return res.data.data?.resource || res.data.data;
}

/**
 * Update a resource
 */
export async function updateResource(
  businessId: string,
  resourceId: string,
  payload: UpdateResourceInput
): Promise<Resource> {
  const res = await apiClient.put<any>(
    `/businesses/${businessId}/resources/${resourceId}`,
    payload
  );
  return res.data.data?.resource || res.data.data;
}

/**
 * Deactivate a resource (soft delete)
 */
export async function deactivateResource(
  businessId: string,
  resourceId: string
): Promise<Resource> {
  const res = await apiClient.post<any>(
    `/businesses/${businessId}/resources/${resourceId}/deactivate`
  );
  return res.data.data?.resource || res.data.data;
}

/**
 * Reactivate a resource
 */
export async function reactivateResource(
  businessId: string,
  resourceId: string
): Promise<Resource> {
  const res = await apiClient.post<any>(
    `/businesses/${businessId}/resources/${resourceId}/reactivate`
  );
  return res.data.data?.resource || res.data.data;
}

export const ResourceService = {
  list: listResources,
  create: createResource,
  bulkCreate: bulkCreateResources,
  getById: getResource,
  update: updateResource,
  deactivate: deactivateResource,
  reactivate: reactivateResource,
};

export default ResourceService;
