import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Table, Badge, Button, Input, Modal, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';
import { Plus, DollarSign } from 'lucide-react';

interface Payment {
  id: string;
  businessId: string;
  businessName?: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  createdAt: string;
  subscription?: {
    business?: {
      name: string;
    };
  };
}

interface PaymentFormData {
  businessId: string;
  amount: string;
  paymentMethod: string;
  transactionRef: string;
  periodStart: string;
  periodEnd: string;
  notes: string;
}

const initialFormData: PaymentFormData = {
  businessId: '',
  amount: '',
  paymentMethod: 'BANK_TRANSFER',
  transactionRef: '',
  periodStart: '',
  periodEnd: '',
  notes: '',
};

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData);

  const limit = 10;

  useEffect(() => {
    fetchPayments();
  }, [page, searchTerm, dateFilter.startDate, dateFilter.endDate]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.listPayments({
        page,
        limit,
        businessId: searchTerm || undefined,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
      });
      const paymentsList = response.data?.payments || response.data || [];
      setPayments(paymentsList);
      setTotal(response.data?.pagination?.totalCount || response.pagination?.total || 0);
      
      const revenue = paymentsList.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0);
      setTotalRevenue(revenue);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => setFormData(initialFormData);

  const handleRecordPayment = async () => {
    if (!formData.businessId || !formData.amount) {
      setError('Please fill in Business ID and Amount');
      return;
    }

    try {
      await apiClient.recordPayment(
        formData.businessId,
        parseFloat(formData.amount),
        formData.paymentMethod,
        formData.transactionRef || undefined,
        formData.periodStart || undefined,
        formData.periodEnd || undefined,
        formData.notes || undefined
      );
      setShowModal(false);
      resetForm();
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const getBusinessName = (payment: Payment) => {
    return payment.businessName || payment.subscription?.business?.name || 'Unknown';
  };

  const columns = [
    {
      key: 'businessId',
      label: 'Business',
      render: (_: string, row: Payment) => (
        <div>
          <p className="font-salex-medium text-salex-white">{getBusinessName(row)}</p>
          <p className="text-salex-xs text-salex-secondary">{row.businessId?.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => (
        <p className="font-salex-bold text-salex-green">₹{(value || 0).toLocaleString('en-IN')}</p>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (value: string) => <Badge label={value || 'N/A'} variant="info" size="sm" />,
    },
    {
      key: 'transactionRef',
      label: 'Ref',
      render: (value: string) => (
        <p className="text-salex-sm text-salex-secondary font-mono">{value || '-'}</p>
      ),
    },
    {
      key: 'periodStart',
      label: 'Period',
      render: (value: string, row: Payment) => (
        <div className="text-salex-xs text-salex-secondary">
          {value && row.periodEnd ? (
            <>
              {new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(row.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </>
          ) : '-'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Recorded',
      render: (value: string) => (
        <p className="text-salex-sm text-salex-secondary">
          {new Date(value).toLocaleDateString('en-IN')}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-salex-lg">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Header with Revenue */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-salex-2xl font-salex-bold text-salex-white">Payments</h1>
          <div className="flex items-center gap-salex-sm mt-salex-xs">
            <DollarSign size={16} className="text-salex-green" />
            <span className="text-salex-green font-salex-bold">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="text-salex-secondary text-salex-sm">total revenue</span>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-1" />
          Record Payment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-salex-md">
            <Input
              placeholder="Search by business ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              placeholder="Start date"
              value={dateFilter.startDate}
              onChange={(e) => { setDateFilter(prev => ({ ...prev, startDate: e.target.value })); setPage(1); }}
            />
            <Input
              type="date"
              placeholder="End date"
              value={dateFilter.endDate}
              onChange={(e) => { setDateFilter(prev => ({ ...prev, endDate: e.target.value })); setPage(1); }}
            />
            <Button variant="secondary" onClick={() => { setDateFilter({ startDate: '', endDate: '' }); setSearchTerm(''); }}>
              Clear Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader title="Payment History" subtitle={`${total} payments`} />
        <CardBody>
          <Table columns={columns} data={payments} isLoading={isLoading} />
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Record Manual Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" onClick={handleRecordPayment} isLoading={isLoading}>Record Payment</Button>
          </>
        }
      >
        <div className="space-y-salex-md">
          <Input
            label="Business ID *"
            placeholder="Enter business UUID"
            value={formData.businessId}
            onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
          />
          <Input
            label="Amount (₹) *"
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <div>
            <label className="block text-salex-sm font-salex-medium text-salex-white mb-salex-xs">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-sm text-salex-white"
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <Input
            label="Transaction Reference"
            placeholder="e.g., UTR number, cheque number"
            value={formData.transactionRef}
            onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-salex-md">
            <Input
              label="Period Start"
              type="date"
              value={formData.periodStart}
              onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
            />
            <Input
              label="Period End"
              type="date"
              value={formData.periodEnd}
              onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-salex-sm font-salex-medium text-salex-white mb-salex-xs">Notes</label>
            <textarea
              placeholder="Additional notes about this payment..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-sm text-salex-white min-h-[80px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
