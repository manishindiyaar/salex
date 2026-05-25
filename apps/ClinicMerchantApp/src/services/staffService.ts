/**
 * Staff Service
 * 
 * API client for staff management endpoints.
 * 
 * Endpoints:
 * - GET    /businesses/{businessId}/staff                    - List staff
 * - POST   /businesses/{businessId}/staff                    - Create staff
 * - GET    /businesses/{businessId}/staff/{id}               - Get single staff
 * - PUT    /businesses/{businessId}/staff/{id}               - Update staff
 * - POST   /businesses/{businessId}/staff/{id}/deactivate    - Deactivate
 * - POST   /businesses/{businessId}/staff/{id}/reactivate    - Reactivate
 * - POST   /businesses/{businessId}/staff/{id}/link          - Link to resource
 * - DELETE /businesses/{businessId}/staff/{id}/link/{resourceId} - Unlink
 */

import apiClient from './apiClient';
import {
  Staff,
  CreateStaffInput,
  UpdateStaffInput,
  LinkResourceInput,
  StaffWithStats,
  LinkedResource,
} from '../types';

export interface ListStaffParams {
  includeInactive?: boolean;
}

/**
 * List staff for a business
 */
export async function listStaff(
  businessId: string,
  params: ListStaffParams = {}
): Promise<StaffWithStats[]> {
  const res = await apiClient.get<any>(`/businesses/${businessId}/staff`, { params });
  return res.data.data?.staff || res.data.data || [];
}

/**
 * Create a staff member
 */
export async function createStaff(
  businessId: string,
  payload: CreateStaffInput
): Promise<Staff> {
  const res = await apiClient.post<any>(`/businesses/${businessId}/staff`, payload);
  return res.data.data?.staff || res.data.data;
}

/**
 * Get a single staff member by ID
 */
export async function getStaff(
  businessId: string,
  staffId: string
): Promise<StaffWithStats> {
  const res = await apiClient.get<any>(`/businesses/${businessId}/staff/${staffId}`);
  return res.data.data?.staff || res.data.data;
}

/**
 * Update a staff member
 */
export async function updateStaff(
  businessId: string,
  staffId: string,
  payload: UpdateStaffInput
): Promise<Staff> {
  const res = await apiClient.put<any>(
    `/businesses/${businessId}/staff/${staffId}`,
    payload
  );
  return res.data.data?.staff || res.data.data;
}

/**
 * Deactivate a staff member (soft delete)
 */
export async function deactivateStaff(
  businessId: string,
  staffId: string
): Promise<Staff> {
  const res = await apiClient.post<any>(
    `/businesses/${businessId}/staff/${staffId}/deactivate`
  );
  return res.data.data?.staff || res.data.data;
}

/**
 * Reactivate a staff member
 */
export async function reactivateStaff(
  businessId: string,
  staffId: string
): Promise<Staff> {
  const res = await apiClient.post<any>(
    `/businesses/${businessId}/staff/${staffId}/reactivate`
  );
  return res.data.data?.staff || res.data.data;
}

/**
 * Link staff to a resource
 */
export async function linkStaffToResource(
  businessId: string,
  staffId: string,
  payload: LinkResourceInput
): Promise<StaffWithStats> {
  const res = await apiClient.post<any>(
    `/businesses/${businessId}/staff/${staffId}/link`,
    payload
  );
  return res.data.data?.staff || res.data.data;
}

/**
 * Unlink staff from a resource
 */
export async function unlinkStaffFromResource(
  businessId: string,
  staffId: string,
  resourceId: string
): Promise<StaffWithStats> {
  const res = await apiClient.delete<any>(
    `/businesses/${businessId}/staff/${staffId}/link/${resourceId}`
  );
  return res.data.data?.staff || res.data.data;
}

export const StaffService = {
  list: listStaff,
  create: createStaff,
  getById: getStaff,
  update: updateStaff,
  deactivate: deactivateStaff,
  reactivate: reactivateStaff,
  linkToResource: linkStaffToResource,
  unlinkFromResource: unlinkStaffFromResource,
};

export default StaffService;
