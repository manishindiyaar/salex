/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessStore } from '@/store/businessStore';
import { apiClient } from '@/services/apiClient';
import { Card, CardHeader, CardBody, CardFooter, Table, Badge, Button, Input, Modal, Alert } from '@/components';
import { Search, ChevronLeft, ChevronRight, Eye, Download, Plus } from 'lucide-react';
import { CreateBusinessModal } from '@/components/business/CreateBusinessModal';

export const BusinessesPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    businesses,
    isLoading,
    error,
    pagination,
    fetchBusinesses,
    toggleBusinessStatus,
    setPagination,
    clearError,
  } = useBusinessStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubStatus, setFilterSubStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');


  
  // Status Change Modal States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [businessToToggle, setBusinessToToggle] = useState<any>(null);
  const [statusReason, setStatusReason] = useState('');

  // Create Business Modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Data Export
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      category: filterCategory || undefined,
      status: filterSubStatus || undefined,
      plan: filterPlan || undefined,
    };
    if (filterStatus === 'active') params.isActive = true;
    if (filterStatus === 'inactive') params.isActive = false;

    void fetchBusinesses(params);
  }, [pagination.page, pagination.limit, searchTerm, filterCategory, filterStatus, filterSubStatus, filterPlan]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setPagination(1, pagination.limit);
  };

  const handleToggleStatusClick = (row: any) => {
    setBusinessToToggle(row);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (businessToToggle && statusReason) {
      try {
        await toggleBusinessStatus(businessToToggle.id, statusReason);
        setShowStatusModal(false);
        setBusinessToToggle(null);
        setStatusReason('');
        // Refresh businesses preserving current page and filters
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined,
          category: filterCategory || undefined,
          status: filterSubStatus || undefined,
          plan: filterPlan || undefined,
        };
        if (filterStatus === 'active') params.isActive = true;
        if (filterStatus === 'inactive') params.isActive = false;
        void fetchBusinesses(params);
      } catch (err) {
        // Keep statusReason on error, error handled globally/store
      }
    }
  };



  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {
        category: filterCategory || undefined,
        plan: filterPlan || undefined,
        status: filterSubStatus || undefined,
      };
      if (filterStatus === 'active') params.isActive = true;
      if (filterStatus === 'inactive') params.isActive = false;

      const res = await apiClient.exportBusinesses(params);
      
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `businesses_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Business Name',
      render: (value: string, row: any) => (
        <div>
          <p className="font-semibold text-salex-sm" style={{ color: '#03031F' }}>{value || 'Unnamed Business'}</p>
          <p className="text-[11px] text-salex-secondary mt-0.5 font-mono">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      render: (value: string) => (
        <span className="font-mono text-[13px]">{value}</span>
      ),
    },
    {
      key: 'routingCode',
      label: 'Code',
      render: (value: string) => (
        <Badge variant="default" label={value || '—'} />
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: string) => (
        <span className="text-[12px] tracking-wide" style={{ color: '#2E2D38' }}>{value}</span>
      ),
    },
    {
      key: 'subscription',
      label: 'Billing / Subscription',
      render: (value: any) => (
        <Badge
          label={`${value?.plan || 'TRIAL'} (${value?.status || 'TRIAL'})`}
          variant={value?.status === 'ACTIVE' ? 'success' : 'warning'}
        />
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <Badge
          variant={value ? 'success' : 'error'}
          label={value ? 'Active' : 'Suspended'}
        />
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string, row: any) => (
        <div className="flex gap-salex-sm items-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/businesses/${value}`)}
            title="View Details"
          >
            <Eye size={16} />
          </Button>
          <>
            <Button
              size="sm"
              variant={row.isActive ? 'danger' : 'secondary'}
              onClick={() => handleToggleStatusClick(row)}
            >
              {row.isActive ? 'Suspend' : 'Reactivate'}
            </Button>
          </>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {error && <Alert type="error" title="Error" message={error} onClose={clearError} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A8A6B0' }}>Businesses</p>
          <h1 className="font-serif text-[28px] leading-tight" style={{ color: '#03031F', fontWeight: 400 }}>All Businesses</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} isLoading={exporting} leftIcon={<Download size={15} />}>
            Export CSV
          </Button>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={15} />}>
            Create Business
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardBody>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Search by name, phone, or routing code"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
                leftIcon={<Search size={15} />}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#6F6D7A' }}>Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPagination(1, pagination.limit); }}
                  className="w-full rounded-salex-md px-3 py-2 border text-[13px]"
                  style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white', height: '38px' }}
                >
                  <option value="">All Categories</option>
                  <option value="SALON">Salon</option>
                  <option value="BEAUTY_PARLOR">Beauty Parlor</option>
                  <option value="SPA">Spa</option>
                  <option value="CLINIC">Clinic</option>
                  <option value="FITNESS">Fitness</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#6F6D7A' }}>Active Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPagination(1, pagination.limit); }}
                  className="w-full rounded-salex-md px-3 py-2 border text-[13px]"
                  style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white', height: '38px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#6F6D7A' }}>Subscription Status</label>
                <select
                  value={filterSubStatus}
                  onChange={(e) => { setFilterSubStatus(e.target.value); setPagination(1, pagination.limit); }}
                  className="w-full rounded-salex-md px-3 py-2 border text-[13px]"
                  style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white', height: '38px' }}
                >
                  <option value="">All Subscription Statuses</option>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="GRACE">Grace</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[11px] uppercase tracking-wide mb-1.5" style={{ color: '#6F6D7A' }}>Plan</label>
                <select
                  value={filterPlan}
                  onChange={(e) => { setFilterPlan(e.target.value); setPagination(1, pagination.limit); }}
                  className="w-full rounded-salex-md px-3 py-2 border text-[13px]"
                  style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white', height: '38px' }}
                >
                  <option value="">All Plans</option>
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Pro</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title="Businesses"
          subtitle={`${pagination.total} total businesses on the platform`}
        />
        <CardBody noPadding>
          <Table columns={columns} data={businesses} isLoading={isLoading} />
        </CardBody>

        {/* Pagination */}
        <CardFooter className="">
          <p className="font-mono text-[11px]" style={{ color: '#A8A6B0' }}>
            Page {pagination.page} of {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(pagination.page - 1, pagination.limit)}
              leftIcon={<ChevronLeft size={15} />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => setPagination(pagination.page + 1, pagination.limit)}
              rightIcon={<ChevronRight size={15} />}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Plan Modal removed */}

      {/* Toggle Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setBusinessToToggle(null);
          setStatusReason('');
        }}
        title={`Confirm ${businessToToggle?.isActive ? 'Suspension' : 'Reactivation'}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowStatusModal(false);
                setBusinessToToggle(null);
                setStatusReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant={businessToToggle?.isActive ? 'danger' : 'primary'}
              onClick={handleConfirmToggleStatus}
              isLoading={isLoading}
              disabled={!statusReason.trim()}
            >
              Confirm {businessToToggle?.isActive ? 'Suspension' : 'Reactivation'}
            </Button>
          </>
        }
      >
        {businessToToggle && (
          <div className="space-y-4">
            <Alert
              type={businessToToggle.isActive ? 'warning' : 'info'}
              title={businessToToggle.isActive ? 'Suspending Account' : 'Reactivating Account'}
              message={
                businessToToggle.isActive
                  ? 'Suspending this account will prevent them from accepting new bookings and hide them from the salon app.'
                  : 'Reactivating this account will allow them to accept new bookings.'
              }
            />
            <Input
              label="Reason for Action"
              placeholder="Enter reason…"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {/* Create Business Modal */}
      <CreateBusinessModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          const params: any = {
            page: 1,
            limit: pagination.limit,
            search: searchTerm || undefined,
            category: filterCategory || undefined,
            status: filterSubStatus || undefined,
            plan: filterPlan || undefined,
          };
          if (filterStatus === 'active') params.isActive = true;
          if (filterStatus === 'inactive') params.isActive = false;
          void fetchBusinesses(params);
        }}
      />
    </div>
  );
};
