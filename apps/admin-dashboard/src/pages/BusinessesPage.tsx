import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessStore } from '@/store/businessStore';
import { apiClient } from '@/services/apiClient';
import { Card, CardHeader, CardBody, Table, Badge, Button, Input, Modal, Alert } from '@/components';
import { Search, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';

export const BusinessesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    businesses,
    isLoading,
    error,
    pagination,
    fetchBusinesses,
    toggleBusinessStatus,
    changeSubscriptionPlan,
    setPagination,
    clearError,
  } = useBusinessStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBusinesses({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm,
    });
  }, [pagination.page, pagination.limit]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(1, pagination.limit);
    fetchBusinesses({
      page: 1,
      limit: pagination.limit,
      search: value,
    });
  };

  const handleToggleStatus = async (id: string) => {
    await toggleBusinessStatus(id);
  };

  const handleChangePlan = async () => {
    if (selectedBusiness && newPlan) {
      // TODO: Add reason input field to BusinessesPage modal
      const reason = 'Plan changed from businesses list page';
      await changeSubscriptionPlan(selectedBusiness.id, newPlan, reason);
      setShowModal(false);
      setNewPlan('');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await apiClient.exportBusinesses({ search: searchTerm });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `businesses-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
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
          <p className="font-salex-medium">{value}</p>
          <p className="text-salex-xs text-salex-secondary">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: string) => <Badge label={value} variant="info" size="sm" />,
    },
    {
      key: 'subscription',
      label: 'Subscription',
      render: (value: any) => (
        <Badge
          label={value?.status || 'TRIAL'}
          variant={value?.status === 'ACTIVE' ? 'success' : 'warning'}
          size="sm"
        />
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <Badge
          label={value ? 'Active' : 'Inactive'}
          variant={value ? 'success' : 'error'}
          size="sm"
        />
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string, row: any) => (
        <div className="flex gap-salex-sm">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/businesses/${value}`)}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedBusiness(row);
              setShowModal(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.isActive ? 'danger' : 'secondary'}
            onClick={() => handleToggleStatus(value)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-salex-lg">
      {error && <Alert type="error" title="Error" message={error} onClose={clearError} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-salex-2xl font-salex-bold text-salex-white">Businesses</h1>
        <Button variant="secondary" onClick={handleExport} isLoading={exporting}>
          <Download size={18} className="mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <div className="flex gap-salex-md">
            <Input
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" size="md">
              <Search size={18} />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader title="Businesses" subtitle={`Total: ${pagination.total}`} />
        <CardBody>
          <Table columns={columns} data={businesses} isLoading={isLoading} />
        </CardBody>

        {/* Pagination */}
        <div className="px-salex-lg py-salex-md border-t border-salex-gray-border flex items-center justify-between">
          <p className="text-salex-sm text-salex-secondary">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </p>
          <div className="flex gap-salex-sm">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(pagination.page - 1, pagination.limit)}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => setPagination(pagination.page + 1, pagination.limit)}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedBusiness(null);
          setNewPlan('');
        }}
        title="Edit Business"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedBusiness(null);
                setNewPlan('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleChangePlan} isLoading={isLoading}>
              Save Changes
            </Button>
          </>
        }
      >
        {selectedBusiness && (
          <div className="space-y-salex-lg">
            <div>
              <p className="text-salex-sm font-salex-medium text-salex-white">Business Name</p>
              <p className="text-salex-base text-salex-secondary mt-salex-sm">
                {selectedBusiness.name}
              </p>
            </div>
            <div>
              <p className="text-salex-sm font-salex-medium text-salex-white">Current Plan</p>
              <p className="text-salex-base text-salex-secondary mt-salex-sm">
                {selectedBusiness.subscription?.plan || 'TRIAL'}
              </p>
            </div>
            <div>
              <label className="block text-salex-sm font-salex-medium text-salex-white mb-salex-sm">
                Change Plan
              </label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-md text-salex-white"
              >
                <option value="">Select a plan</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Professional</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
