/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Table, Badge, Button, Input, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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
  admin?: { name: string; email: string };
}

const ACTION_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  CREATE:                      'success',
  UPDATE:                      'info',
  DELETE:                      'error',
  TOGGLE_BUSINESS_STATUS:      'warning',
  CHANGE_SUBSCRIPTION_PLAN:    'info',
  RECORD_PAYMENT:              'success',
  CREATE_SUPPORT_NOTE:         'info',
  UPDATE_SUPPORT_NOTE_STATUS:  'info',
  LOGIN:                       'default',
  LOGOUT:                      'default',
};

export const AuditLogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [logs, setLogs]         = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters]   = useState({
    action: searchParams.get('action') || '',
    entityType: searchParams.get('entityType') || '',
    entityId: searchParams.get('entityId') || '',
    adminId: searchParams.get('adminId') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  const limit = 20;

  // Auto-open filters panel on load if URL params are present
  useEffect(() => {
    if (
      searchParams.get('action') ||
      searchParams.get('entityType') ||
      searchParams.get('entityId') ||
      searchParams.get('adminId') ||
      searchParams.get('startDate') ||
      searchParams.get('endDate')
    ) {
      setShowFilters(true);
    }
  }, []);

  // Sync URL query params when filters state changes
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.entityId) params.entityId = filters.entityId;
    if (filters.adminId) params.adminId = filters.adminId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    setSearchParams(params);
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (filters.action)     params.action     = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId)   params.entityId   = filters.entityId;
      if (filters.adminId)    params.adminId    = filters.adminId;
      if (filters.startDate)  params.startDate  = filters.startDate ? new Date(filters.startDate).toISOString() : undefined;
      if (filters.endDate)    params.endDate    = filters.endDate ? new Date(filters.endDate).toISOString() : undefined;

      const res = await apiClient.getAuditLogs(params);
      setLogs(res.data?.logs || res.data || []);
      setTotal(res.data?.pagination?.totalCount || res.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', entityId: '', adminId: '', startDate: '', endDate: '' });
    setPage(1);
  };

  const formatChanges = (changes?: Record<string, any>) => {
    if (!changes) return '—';
    const entries = Object.entries(changes);
    if (entries.length === 0) return '—';
    const preview = entries.slice(0, 2).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
    return preview + (entries.length > 2 ? '…' : '');
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Time',
      render: (value: string) => (
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#03031F' }}>
            {new Date(value).toLocaleDateString('en-IN')}
          </p>
          <p className="text-[11px] font-mono text-salex-secondary">
            {new Date(value).toLocaleTimeString('en-IN')}
          </p>
        </div>
      ),
    },
    {
      key: 'admin',
      label: 'Admin',
      render: (_: any, row: AuditLog) => (
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#03031F' }}>
            {row.admin?.name || row.adminName || 'System'}
          </p>
          <p className="text-[11px] text-salex-secondary">{row.admin?.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value: string) => (
        <Badge label={value} variant={ACTION_VARIANTS[value] ?? 'default'} size="sm" />
      ),
    },
    {
      key: 'entityType',
      label: 'Entity',
      render: (value: string, row: AuditLog) => (
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#03031F' }}>{value}</p>
          <p className="text-[11px] font-mono text-salex-secondary truncate max-w-[120px]" title={row.entityId}>
            {row.entityId}
          </p>
        </div>
      ),
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (value: Record<string, any>) => (
        <p className="text-[12px] max-w-[180px] truncate" style={{ color: '#6F6D7A' }}>
          {formatChanges(value)}
        </p>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value: string) => (
        <p className="text-[12px] max-w-[140px] truncate" style={{ color: '#6F6D7A' }}>
          {value || '—'}
        </p>
      ),
    },
  ];

  const selectStyle = {
    borderColor: '#C9C7CF',
    color: '#03031F',
    background: 'white',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    border: '1.5px solid #C9C7CF',
    height: '38px',
  } as React.CSSProperties;

  return (
    <div className="space-y-5">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A8A6B0' }}>Admin</p>
          <h1 className="font-serif text-[28px] leading-tight" style={{ color: '#03031F', fontWeight: 400 }}>
            Audit Logs
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#A8A6B0' }}>Track all admin actions</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter size={14} />}
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardHeader title="Filter Logs" />
          <CardBody>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#6F6D7A' }}>Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
                    style={selectStyle}
                  >
                    <option value="">All Actions</option>
                    <option value="TOGGLE_BUSINESS_STATUS">Toggle Business Status</option>
                    <option value="CHANGE_SUBSCRIPTION_PLAN">Change Subscription Plan</option>
                    <option value="RECORD_PAYMENT">Record Payment</option>
                    <option value="CREATE_SUPPORT_NOTE">Create Support Note</option>
                    <option value="UPDATE_SUPPORT_NOTE_STATUS">Update Support Note Status</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#6F6D7A' }}>Entity Type</label>
                  <select
                    value={filters.entityType}
                    onChange={(e) => { setFilters({ ...filters, entityType: e.target.value }); setPage(1); }}
                    style={selectStyle}
                  >
                    <option value="">All Entities</option>
                    <option value="Business">Business</option>
                    <option value="Subscription">Subscription</option>
                    <option value="PaymentRecord">Payment Record</option>
                    <option value="SupportNote">Support Note</option>
                    <option value="AdminUser">Admin User</option>
                  </select>
                </div>
                <Input
                  label="Entity ID"
                  placeholder="Filter by Entity UUID…"
                  value={filters.entityId}
                  onChange={(e) => { setFilters({ ...filters, entityId: e.target.value }); setPage(1); }}
                />
                <Input
                  label="Admin ID"
                  placeholder="Filter by Admin UUID…"
                  value={filters.adminId}
                  onChange={(e) => { setFilters({ ...filters, adminId: e.target.value }); setPage(1); }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <Input
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
                />
                <Button variant="secondary" onClick={clearFilters} className="w-full">
                  Clear All
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader
          title="Activity Log"
          subtitle={`${total} total entries recorded`}
        />
        <CardBody noPadding>
          <Table columns={columns} data={logs} isLoading={isLoading} />
        </CardBody>
        <CardFooter>
          <p className="font-mono text-[11px]" style={{ color: '#A8A6B0' }}>
            Page {page} of {Math.max(1, Math.ceil(total / limit))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft size={14} />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight size={14} />}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
