import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Table, Badge, Button, Input, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';
import { Filter, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
  admin?: {
    name: string;
    email: string;
  };
}

const ACTION_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  TOGGLE_STATUS: 'warning',
  CHANGE_PLAN: 'info',
  RECORD_PAYMENT: 'success',
  LOGIN: 'info',
  LOGOUT: 'info',
};

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    adminId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params: any = { page, limit };
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.adminId) params.adminId = filters.adminId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await apiClient.getAuditLogs(params);
      setLogs(response.data?.logs || response.data || []);
      setTotal(response.data?.pagination?.totalCount || response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', adminId: '', startDate: '', endDate: '' });
    setPage(1);
  };

  const formatChanges = (changes?: Record<string, any>) => {
    if (!changes) return '-';
    const entries = Object.entries(changes);
    if (entries.length === 0) return '-';
    return entries.slice(0, 2).map(([key, val]) => `${key}: ${JSON.stringify(val)}`).join(', ') + 
      (entries.length > 2 ? '...' : '');
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Time',
      render: (value: string) => (
        <div className="text-salex-sm">
          <p className="text-salex-white">{new Date(value).toLocaleDateString('en-IN')}</p>
          <p className="text-salex-secondary text-salex-xs">{new Date(value).toLocaleTimeString('en-IN')}</p>
        </div>
      ),
    },
    {
      key: 'admin',
      label: 'Admin',
      render: (_: any, row: AuditLog) => (
        <div>
          <p className="text-salex-white font-salex-medium">{row.admin?.name || row.adminName || 'System'}</p>
          <p className="text-salex-secondary text-salex-xs">{row.admin?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value: string) => (
        <Badge label={value} variant={ACTION_COLORS[value] || 'info'} size="sm" />
      ),
    },
    {
      key: 'entityType',
      label: 'Entity',
      render: (value: string, row: AuditLog) => (
        <div>
          <p className="text-salex-white">{value}</p>
          <p className="text-salex-secondary text-salex-xs font-mono">{row.entityId?.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (value: Record<string, any>) => (
        <p className="text-salex-secondary text-salex-xs max-w-[200px] truncate">
          {formatChanges(value)}
        </p>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value: string) => (
        <p className="text-salex-secondary text-salex-sm max-w-[150px] truncate">
          {value || '-'}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-salex-lg">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-salex-2xl font-salex-bold text-salex-white">Audit Logs</h1>
          <p className="text-salex-sm text-salex-secondary">Track all admin actions</p>
        </div>
        <div className="flex gap-salex-sm">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} className="mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-salex-md">
              <div>
                <label className="block text-salex-xs text-salex-secondary mb-salex-xs">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
                  className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-sm py-salex-sm text-salex-white text-salex-sm"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="TOGGLE_STATUS">Toggle Status</option>
                  <option value="CHANGE_PLAN">Change Plan</option>
                  <option value="RECORD_PAYMENT">Record Payment</option>
                  <option value="LOGIN">Login</option>
                </select>
              </div>
              <div>
                <label className="block text-salex-xs text-salex-secondary mb-salex-xs">Entity Type</label>
                <select
                  value={filters.entityType}
                  onChange={(e) => { setFilters({ ...filters, entityType: e.target.value }); setPage(1); }}
                  className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-sm py-salex-sm text-salex-white text-salex-sm"
                >
                  <option value="">All Entities</option>
                  <option value="BUSINESS">Business</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="TEMPLATE">Template</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <Input
                type="date"
                placeholder="Start date"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
              />
              <Input
                type="date"
                placeholder="End date"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
              />
              <Button variant="secondary" onClick={clearFilters} className="self-end">
                Clear
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader title="Activity Log" subtitle={`${total} entries`} />
        <CardBody>
          <Table columns={columns} data={logs} isLoading={isLoading} />
        </CardBody>
        <div className="px-salex-lg py-salex-md border-t border-salex-gray-border flex items-center justify-between">
          <p className="text-salex-sm text-salex-secondary">
            Page {page} of {Math.max(1, Math.ceil(total / limit))}
          </p>
          <div className="flex gap-salex-sm">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
