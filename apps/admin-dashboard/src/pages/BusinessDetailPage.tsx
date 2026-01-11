import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessStore } from '@/store/businessStore';
import { apiClient } from '@/services/apiClient';
import { Card, CardHeader, CardBody, Badge, Button, Modal, Alert } from '@/components';

interface BusinessDetail {
  id: string;
  name: string;
  phoneNumber: string;
  routingCode: string;
  category: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  owner: { id: string; phone: string; createdAt: string };
  subscription: {
    id: string;
    status: string;
    plan: string;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    payments: Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      createdAt: string;
    }>;
  } | null;
  services: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
  resources: Array<{ id: string; name: string; description: string }>;
  staff: Array<{ id: string; name: string; phone: string }>;
  moduleConfigs: Array<{ id: string; moduleCode: string; isEnabled: boolean }>;
  bookings: Array<{
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    customer: { id: string; name: string; phoneNumber: string };
    items: Array<{ service: { name: string } }>;
  }>;
}

interface Analytics {
  bookings: { total: number; recent: number; weekly: number };
  revenue: { total: number; recent: number; weekly: number };
  customers: { total: number; recent: number };
}

const FEATURE_MODULES = [
  { code: 'appointment_booking', name: 'Appointment Booking' },
  { code: 'walk_in_queue', name: 'Walk-in Queue' },
  { code: 'resource_management', name: 'Resource Management' },
  { code: 'staff_management', name: 'Staff Management' },
  { code: 'whatsapp_booking', name: 'WhatsApp Booking' },
  { code: 'analytics', name: 'Analytics' },
];

export const BusinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleBusinessStatus, changeSubscriptionPlan, isLoading, error, clearError } = useBusinessStore();

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [planReason, setPlanReason] = useState('');
  const [moduleUpdates, setModuleUpdates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) {
      fetchBusinessDetails();
    }
  }, [id]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await apiClient.getBusinessDetails(id!);
      setBusiness(response.data.business);
      setAnalytics(response.data.analytics);
      
      // Initialize module states
      const modules: Record<string, boolean> = {};
      response.data.business.moduleConfigs?.forEach((config: any) => {
        modules[config.moduleCode] = config.isEnabled;
      });
      setModuleUpdates(modules);
    } catch (err: any) {
      setFetchError(err.response?.data?.message || 'Failed to fetch business details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id) return;
    await toggleBusinessStatus(id);
    setShowStatusModal(false);
    fetchBusinessDetails();
  };

  const handleChangePlan = async () => {
    const trimmedReason = planReason.trim();
    console.log('=== DEBUG: Frontend Handler ===');
    console.log('ID:', id);
    console.log('newPlan:', newPlan);
    console.log('planReason:', planReason);
    console.log('trimmedReason:', trimmedReason);
    console.log('===============================');
    
    if (!id || !newPlan || !trimmedReason) return;
    await changeSubscriptionPlan(id, newPlan, trimmedReason);
    setShowPlanModal(false);
    setNewPlan('');
    setPlanReason('');
    fetchBusinessDetails();
  };

  const handleModuleToggle = async (moduleCode: string, enabled: boolean) => {
    if (!id) return;
    try {
      await apiClient.updateBusinessModules(id, { [moduleCode]: enabled });
      setModuleUpdates((prev) => ({ ...prev, [moduleCode]: enabled }));
    } catch (err: any) {
      console.error('Failed to update module:', err);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <svg className="w-8 h-8 text-salex-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (fetchError || !business) {
    return (
      <div className="space-y-salex-lg">
        <Alert type="error" title="Error" message={fetchError || 'Business not found'} />
        <Button variant="secondary" onClick={() => navigate('/businesses')}>
          ← Back to Businesses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-salex-lg">
      {error && <Alert type="error" title="Error" message={error} onClose={clearError} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-salex-md">
          <Button variant="secondary" size="sm" onClick={() => navigate('/businesses')}>
            ←
          </Button>
          <div>
            <h1 className="text-salex-xl font-salex-bold text-salex-white">{business.name}</h1>
            <p className="text-salex-sm text-salex-secondary">{business.routingCode}</p>
          </div>
        </div>
        <div className="flex gap-salex-sm">
          <Badge label={business.category} variant="info" />
          <Badge label={business.isActive ? 'Active' : 'Inactive'} variant={business.isActive ? 'success' : 'error'} />
        </div>
      </div>

      {/* Stats Grid */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-salex-md">
          <Card>
            <CardBody>
              <div className="flex items-center gap-salex-md">
                <div className="p-salex-sm bg-salex-green/10 rounded-salex-md">
                  <span className="text-salex-green text-xl">📅</span>
                </div>
                <div>
                  <p className="text-salex-xs text-salex-secondary">Total Bookings</p>
                  <p className="text-salex-xl font-salex-bold text-salex-white">{analytics.bookings.total}</p>
                  <p className="text-salex-xs text-salex-secondary">+{analytics.bookings.weekly} this week</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-salex-md">
                <div className="p-salex-sm bg-salex-green/10 rounded-salex-md">
                  <span className="text-salex-green text-xl">💰</span>
                </div>
                <div>
                  <p className="text-salex-xs text-salex-secondary">Total Revenue</p>
                  <p className="text-salex-xl font-salex-bold text-salex-white">{formatCurrency(analytics.revenue.total)}</p>
                  <p className="text-salex-xs text-salex-secondary">+{formatCurrency(analytics.revenue.weekly)} this week</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-salex-md">
                <div className="p-salex-sm bg-salex-green/10 rounded-salex-md">
                  <span className="text-salex-green text-xl">👥</span>
                </div>
                <div>
                  <p className="text-salex-xs text-salex-secondary">Total Customers</p>
                  <p className="text-salex-xl font-salex-bold text-salex-white">{analytics.customers.total}</p>
                  <p className="text-salex-xs text-salex-secondary">+{analytics.customers.recent} this month</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-salex-md">
                <div className="p-salex-sm bg-salex-green/10 rounded-salex-md">
                  <span className="text-salex-green text-xl">💳</span>
                </div>
                <div>
                  <p className="text-salex-xs text-salex-secondary">Subscription</p>
                  <p className="text-salex-xl font-salex-bold text-salex-white">{business.subscription?.plan || 'None'}</p>
                  <Badge label={business.subscription?.status || 'N/A'} variant={business.subscription?.status === 'ACTIVE' ? 'success' : 'warning'} size="sm" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-salex-lg">
        {/* Left Column - Business Info & Actions */}
        <div className="space-y-salex-lg">
          {/* Business Info */}
          <Card>
            <CardHeader title="Business Info" />
            <CardBody>
              <div className="space-y-salex-md">
                <div className="flex items-center gap-salex-sm">
                  <span className="text-salex-secondary">📞</span>
                  <span className="text-salex-white">{business.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-salex-sm">
                  <span className="text-salex-secondary">🏢</span>
                  <span className="text-salex-white">{business.category}</span>
                </div>
                <div className="flex items-center gap-salex-sm">
                  <span className="text-salex-secondary">📅</span>
                  <span className="text-salex-white">Joined {formatDate(business.createdAt)}</span>
                </div>
                <div className="pt-salex-md border-t border-salex-gray-border">
                  <p className="text-salex-xs text-salex-secondary mb-salex-sm">Onboarding</p>
                  <Badge label={business.onboardingCompleted ? 'Completed' : 'Pending'} variant={business.onboardingCompleted ? 'success' : 'warning'} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody>
              <div className="space-y-salex-sm">
                <Button variant={business.isActive ? 'danger' : 'primary'} className="w-full justify-start" onClick={() => setShowStatusModal(true)}>
                  <span className="mr-2">{business.isActive ? '⏸️' : '▶️'}</span>
                  {business.isActive ? 'Deactivate Business' : 'Activate Business'}
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => setShowPlanModal(true)}>
                  <span className="mr-2">💳</span>
                  Change Plan
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Resources & Staff */}
          <Card>
            <CardHeader title="Resources & Staff" />
            <CardBody>
              <div className="space-y-salex-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-salex-sm">
                    <span className="text-salex-secondary">📦</span>
                    <span className="text-salex-white">Resources</span>
                  </div>
                  <Badge label={String(business.resources.length)} variant="info" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-salex-sm">
                    <span className="text-salex-secondary">👤</span>
                    <span className="text-salex-white">Staff</span>
                  </div>
                  <Badge label={String(business.staff.length)} variant="info" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-salex-sm">
                    <span className="text-salex-secondary">⚙️</span>
                    <span className="text-salex-white">Services</span>
                  </div>
                  <Badge label={String(business.services.length)} variant="info" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Middle Column - Module Config */}
        <div className="space-y-salex-lg">
          <Card>
            <CardHeader title="Feature Modules" subtitle="Toggle features for this business" />
            <CardBody>
              <div className="space-y-salex-sm">
                {FEATURE_MODULES.map((module) => {
                  const isEnabled = moduleUpdates[module.code] ?? false;
                  return (
                    <div key={module.code} className="flex items-center justify-between p-salex-sm bg-salex-black-light rounded-salex-md">
                      <span className="text-salex-white text-salex-sm">{module.name}</span>
                      <button
                        onClick={() => handleModuleToggle(module.code, !isEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-salex-green' : 'bg-salex-gray-border'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Services List */}
          <Card>
            <CardHeader title="Services" subtitle={`${business.services.length} active services`} />
            <CardBody>
              <div className="space-y-salex-sm max-h-64 overflow-y-auto">
                {business.services.length === 0 ? (
                  <p className="text-salex-secondary text-salex-sm">No services configured</p>
                ) : (
                  business.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-salex-sm bg-salex-black-light rounded-salex-md">
                      <div>
                        <p className="text-salex-white text-salex-sm">{service.name}</p>
                        <p className="text-salex-secondary text-salex-xs">{service.durationMinutes} min</p>
                      </div>
                      <span className="text-salex-green font-salex-medium">{formatCurrency(service.price)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column - Recent Bookings */}
        <div>
          <Card>
            <CardHeader title="Recent Bookings" subtitle="Last 20 bookings" />
            <CardBody>
              <div className="space-y-salex-sm max-h-[600px] overflow-y-auto">
                {business.bookings.length === 0 ? (
                  <p className="text-salex-secondary text-salex-sm">No bookings yet</p>
                ) : (
                  business.bookings.map((booking) => (
                    <div key={booking.id} className="p-salex-sm bg-salex-black-light rounded-salex-md">
                      <div className="flex items-center justify-between mb-salex-xs">
                        <span className="text-salex-white text-salex-sm">{booking.customer?.name || 'Unknown'}</span>
                        <Badge label={booking.status} variant={booking.status === 'COMPLETED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'warning'} size="sm" />
                      </div>
                      <p className="text-salex-secondary text-salex-xs">{booking.items.map((i) => i.service?.name).join(', ')}</p>
                      <div className="flex items-center justify-between mt-salex-xs">
                        <span className="text-salex-secondary text-salex-xs">{formatDate(booking.createdAt)}</span>
                        <span className="text-salex-green text-salex-sm">{formatCurrency(booking.totalPrice)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Status Toggle Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={business.isActive ? 'Deactivate Business' : 'Activate Business'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button variant={business.isActive ? 'danger' : 'primary'} onClick={handleToggleStatus} isLoading={isLoading}>
              {business.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <p className="text-salex-secondary">
          {business.isActive
            ? `Are you sure you want to deactivate "${business.name}"? This will prevent customers from making new bookings.`
            : `Are you sure you want to activate "${business.name}"? This will allow customers to make bookings again.`}
        </p>
      </Modal>

      {/* Plan Change Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => { setShowPlanModal(false); setNewPlan(''); setPlanReason(''); }}
        title="Change Subscription Plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowPlanModal(false); setNewPlan(''); setPlanReason(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleChangePlan} isLoading={isLoading} disabled={!newPlan || !planReason.trim()}>
              Change Plan
            </Button>
          </>
        }
      >
        <div className="space-y-salex-md">
          <div>
            <p className="text-salex-sm text-salex-secondary mb-salex-xs">Current Plan</p>
            <Badge label={business.subscription?.plan || 'None'} variant="info" />
          </div>
          <div>
            <label className="block text-salex-sm text-salex-white mb-salex-xs">New Plan</label>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-sm text-salex-white"
            >
              <option value="">Select a plan</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Professional</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-salex-sm text-salex-white mb-salex-xs">Reason for change</label>
            <textarea
              value={planReason}
              onChange={(e) => setPlanReason(e.target.value)}
              placeholder="Enter reason for plan change..."
              className="w-full bg-salex-black-light border border-salex-gray-border rounded-salex-md px-salex-md py-salex-sm text-salex-white min-h-[80px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
