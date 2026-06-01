/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, CardBody, CardHeader, Modal } from '@/components';
import { apiClient } from '@/services/apiClient';
import { useBusinessStore } from '@/store/businessStore';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { WhatsAppChannelConfig } from '@/components/business/WhatsAppChannelConfig';

type TabId = 'overview' | 'access' | 'subscription' | 'payments' | 'whatsapp' | 'bookings' | 'support' | 'audit';

interface BusinessDetail {
  id: string;
  name: string;
  phoneNumber: string;
  routingCode: string | null;
  category: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  owner: { id: string; phone: string; createdAt: string } | null;
  subscription: {
    id: string;
    status: string;
    plan: string;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    payments: Array<{ id: string; amount: number; paymentMethod: string; createdAt: string }>;
  } | null;
  services: Array<{ id: string; name: string; price: number; durationMinutes: number }>;
  resources: Array<{ id: string; name: string; description: string | null }>;
  staff: Array<{ id: string; name: string; phone: string | null }>;
  bookings: Array<{
    id: string;
    status: string;
    totalPrice: number;
    createdAt: string;
    customer?: { id: string; name: string | null; phoneNumber: string } | null;
    businessCustomer?: {
      id: string;
      displayName?: string | null;
      person?: {
        phoneNumber: string;
      } | null;
    } | null;
    items: Array<{ service?: { name: string } | null }>;
  }>;
  whatsappChannels: Array<{
    id: string;
    displayPhoneNumber: string;
    mode: string;
    status: string;
    phoneNumberId: string;
    lastInboundAt?: string | null;
    lastOutboundAt?: string | null;
  }>;
  bookingDiagnostics: Array<{
    id: string;
    channel: string;
    stage: string;
    status: string;
    failureCode?: string | null;
    failureMessage?: string | null;
    createdAt: string;
  }>;
  whatsappMessageAudit: Array<{
    id: string;
    direction: string;
    messageType: string;
    status: string;
    createdAt: string;
    conversation?: { customerPhone: string; state: string };
  }>;
  supportNotes: Array<{
    id: string;
    body: string;
    status: string;
    createdAt: string;
    admin?: { name: string; email: string };
  }>;
}

interface Analytics {
  bookings: { total: number; recent: number; weekly: number };
  revenue: { total: number; recent: number; weekly: number };
  customers: { total: number; recent: number };
}

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview',      label: 'Overview' },
  { id: 'access',        label: 'Access' },
  { id: 'subscription',  label: 'Subscription' },
  { id: 'payments',      label: 'Payments' },
  { id: 'whatsapp',      label: 'WhatsApp' },
  { id: 'bookings',      label: 'Bookings' },
  { id: 'support',       label: 'Support' },
  { id: 'audit',         label: 'Audit Logs' },
];

/* ─── Tiny local components with explicit colors ─────────────────────────── */

const MetricCard = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div
    className="bg-white rounded-salex-lg border p-5"
    style={{ borderColor: '#E5E4E3', boxShadow: '0 1px 3px rgba(3,3,31,0.05)' }}
  >
    <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#A8A6B0' }}>{label}</p>
    <p className="mt-2 font-bold text-[26px] leading-none tracking-tight" style={{ color: '#03031F' }}>{value}</p>
    <p className="mt-1.5 text-[12px]" style={{ color: '#A8A6B0' }}>{sub}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div
    className="flex items-center justify-between py-3"
    style={{ borderBottom: '1px solid #F0EFEE' }}
  >
    <span className="text-[13px]" style={{ color: '#6F6D7A' }}>{label}</span>
    <span className="text-[13px] font-semibold text-right" style={{ color: '#03031F' }}>{value || '—'}</span>
  </div>
);

const ListEmpty = ({
  empty, label, children,
}: { empty: boolean; label: string; children: React.ReactNode }) => (
  <div className="space-y-2 max-h-[560px] overflow-y-auto">
    {empty
      ? <p className="text-[13px] py-6 text-center" style={{ color: '#A8A6B0' }}>{label}</p>
      : children}
  </div>
);

const LogRow = ({
  title, meta, date, badge, actions,
}: { title: string; meta: string; date: string; badge: string; actions?: React.ReactNode }) => {
  const isError = badge.toLowerCase().includes('fail') || badge.toLowerCase().includes('error');
  return (
    <div
      className="p-3 rounded-salex-md"
      style={{ background: '#F5F3F1', border: '1px solid #E5E4E3' }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold break-words flex-1" style={{ color: '#03031F' }}>{title}</p>
        <Badge
          label={badge}
          variant={isError ? 'error' : 'info'}
          size="sm"
        />
      </div>
      <p className="text-[11px] mt-1 break-words" style={{ color: '#6F6D7A' }}>{meta}</p>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[11px] font-mono" style={{ color: '#A8A6B0' }}>{date}</p>
        {actions}
      </div>
    </div>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────────── */

export const BusinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { toggleBusinessStatus, changeSubscriptionPlan, error, clearError } = useBusinessStore();

  const [business, setBusiness]   = useState<BusinessDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPlanModal, setShowPlanModal]     = useState(false);
  const [showNoteModal, setShowNoteModal]     = useState(false);
  const [newPlan, setNewPlan]         = useState('');
  const [planReason, setPlanReason]   = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [supportNote, setSupportNote] = useState('');
  const [supportNoteStatus, setSupportNoteStatus] = useState<'OPEN' | 'FOLLOW_UP' | 'RESOLVED'>('OPEN');

  // Mutation error states
  const [statusError, setStatusError] = useState<string | null>(null);
  const [planError, setPlanError]     = useState<string | null>(null);
  const [noteError, setNoteError]     = useState<string | null>(null);

  // Mutation loading states
  const [statusChanging, setStatusChanging] = useState(false);
  const [planChanging, setPlanChanging]     = useState(false);
  const [noteCreating, setNoteCreating]     = useState(false);
  const [diagnosticsRefreshing, setDiagnosticsRefreshing] = useState(false);
  const [whatsappRefreshing, setWhatsappRefreshing]       = useState(false);
  const [supportRefreshing, setSupportRefreshing]         = useState(false);
  const [noteUpdatingId, setNoteUpdatingId]               = useState<string | null>(null);

  useEffect(() => { if (id) void fetchBusinessDetails(); }, [id]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await apiClient.getBusinessDetails(id!);
      const biz = response.data.business;
      
      // Resilient normalization
      setBusiness({
        id: biz.id,
        name: biz.name || 'Unnamed Business',
        phoneNumber: biz.phoneNumber || 'No phone number',
        routingCode: biz.routingCode || null,
        category: biz.category || 'OTHER',
        isActive: biz.isActive !== false,
        onboardingCompleted: biz.onboardingCompleted === true,
        createdAt: biz.createdAt || new Date().toISOString(),
        owner: biz.owner ? {
          id: biz.owner.id || '',
          phone: biz.owner.phone || 'No phone number',
          createdAt: biz.owner.createdAt || new Date().toISOString(),
        } : null,
        subscription: biz.subscription ? {
          id: biz.subscription.id || '',
          status: biz.subscription.status || 'TRIAL',
          plan: biz.subscription.plan || 'BASIC',
          trialEndsAt: biz.subscription.trialEndsAt || null,
          currentPeriodStart: biz.subscription.currentPeriodStart || null,
          currentPeriodEnd: biz.subscription.currentPeriodEnd || null,
          payments: biz.subscription.payments ?? [],
        } : null,
        services: biz.services ?? [],
        resources: biz.resources ?? [],
        staff: biz.staff ?? [],
        bookings: biz.bookings ?? [],
        whatsappChannels: biz.whatsappChannels ?? [],
        bookingDiagnostics: biz.bookingDiagnostics ?? [],
        whatsappMessageAudit: biz.whatsappMessageAudit ?? [],
        supportNotes: biz.supportNotes ?? [],
      });

      setAnalytics(response.data.analytics || {
        bookings: { total: 0, recent: 0, weekly: 0 },
        revenue: { total: 0, recent: 0, weekly: 0 },
        customers: { total: 0, recent: 0 },
      });
    } catch (err: any) {
      setFetchError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to fetch business details');
    } finally {
      setLoading(false);
    }
  };

  const refreshBookingDiagnostics = async () => {
    if (!id || !business) return;
    setDiagnosticsRefreshing(true);
    try {
      const res = await apiClient.getBookingDiagnostics(id);
      setBusiness({ ...business, bookingDiagnostics: res.data.attempts ?? [] });
    } catch (err) {
      console.error(err);
    } finally {
      setDiagnosticsRefreshing(false);
    }
  };

  const refreshWhatsAppAudit = async () => {
    if (!id || !business) return;
    setWhatsappRefreshing(true);
    try {
      const res = await apiClient.getWhatsAppAudit(id);
      setBusiness({ ...business, whatsappMessageAudit: res.data.messages ?? [] });
    } catch (err) {
      console.error(err);
    } finally {
      setWhatsappRefreshing(false);
    }
  };

  const refreshSupportNotes = async () => {
    if (!id || !business) return;
    setSupportRefreshing(true);
    try {
      const res = await apiClient.getSupportNotes(id);
      setBusiness({ ...business, supportNotes: res.data.notes ?? [] });
    } catch (err) {
      console.error(err);
    } finally {
      setSupportRefreshing(false);
    }
  };

  const handleToggleStatus = async () => {
    const reason = statusReason.trim();
    if (!id || !reason) return;
    setStatusChanging(true);
    setStatusError(null);
    try {
      await toggleBusinessStatus(id, reason);
      setShowStatusModal(false);
      setStatusReason('');
      await fetchBusinessDetails();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || err.message || 'Failed to toggle business status');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleChangePlan = async () => {
    const reason = planReason.trim();
    if (!id || !newPlan || !reason) return;
    setPlanChanging(true);
    setPlanError(null);
    try {
      await changeSubscriptionPlan(id, newPlan, reason);
      setShowPlanModal(false);
      setNewPlan('');
      setPlanReason('');
      await fetchBusinessDetails();
    } catch (err: any) {
      setPlanError(err.response?.data?.message || err.message || 'Failed to change plan');
    } finally {
      setPlanChanging(false);
    }
  };

  const handleCreateSupportNote = async () => {
    const body = supportNote.trim();
    if (!id || !body) return;
    setNoteCreating(true);
    setNoteError(null);
    try {
      await apiClient.createSupportNote(id, body, supportNoteStatus);
      setSupportNote('');
      setSupportNoteStatus('OPEN');
      setShowNoteModal(false);
      await refreshSupportNotes();
    } catch (err: any) {
      setNoteError(err.response?.data?.message || err.message || 'Failed to create support note');
    } finally {
      setNoteCreating(false);
    }
  };

  const handleUpdateNoteStatus = async (noteId: string, status: 'OPEN' | 'FOLLOW_UP' | 'RESOLVED') => {
    if (!id) return;
    setNoteUpdatingId(noteId);
    try {
      await apiClient.updateSupportNoteStatus(id, noteId, status);
      await refreshSupportNotes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update note status');
    } finally {
      setNoteUpdatingId(null);
    }
  };

  const fmt    = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const fmtD   = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtDT  = (d?: string | null) => d ? new Date(d).toLocaleString('en-IN') : '—';

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  /* ── Error ── */
  if (fetchError || !business) {
    return (
      <div className="space-y-4">
        <Alert type="error" title="Error" message={fetchError || 'Business not found'} />
        <Button variant="secondary" onClick={() => navigate('/businesses')}>Back to Businesses</Button>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="space-y-5">
      {error && <Alert type="error" title="Store Error" message={error} onClose={clearError} />}



      {/* ── Top bar ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => navigate('/businesses')}
          >
            Back
          </Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#A8A6B0' }}>
              Business Detail
            </p>
            <h1 className="font-serif text-[26px] leading-tight mt-0.5" style={{ color: '#03031F', fontWeight: 400 }}>
              {business.name}
            </h1>
            <p className="text-[12px] font-mono mt-0.5" style={{ color: '#A8A6B0' }}>
              {business.routingCode || 'No routing code'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={business.category} variant="info" dot />
          <Badge label={business.isActive ? 'Active' : 'Inactive'} variant={business.isActive ? 'success' : 'error'} dot />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex flex-wrap gap-0 border-b" style={{ borderColor: '#E5E4E3' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 pb-3 pt-1 text-[13px] font-sans border-b-2 transition-colors"
            style={{
              borderBottomColor: activeTab === tab.id ? '#12A36D' : 'transparent',
              color: activeTab === tab.id ? '#12A36D' : '#6F6D7A',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Bookings"   value={String(analytics.bookings.total)}          sub={`+${analytics.bookings.weekly} this week`} />
          <MetricCard label="Total Revenue"    value={fmt(analytics.revenue.total)}              sub={`+${fmt(analytics.revenue.weekly)} this week`} />
          <MetricCard label="Customers"        value={String(analytics.customers.total)}         sub={`+${analytics.customers.recent} this month`} />
          <MetricCard label="Subscription"     value={business.subscription?.plan || 'TRIAL'}    sub={business.subscription?.status || 'TRIAL'} />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Business Info" />
            <CardBody>
              <InfoRow label="Phone"       value={business.phoneNumber} />
              <InfoRow label="Category"    value={business.category} />
              <InfoRow label="Joined"      value={fmtD(business.createdAt)} />
              <InfoRow label="Onboarding"  value={business.onboardingCompleted ? 'Completed' : 'Pending'} />
              <InfoRow label="Owner Phone" value={business.owner?.phone || 'No owner phone'} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Salon Setup" />
            <CardBody>
              <InfoRow label="Services"         value={String(business.services.length)} />
              <InfoRow label="Chairs / Resources" value={String(business.resources.length)} />
              <InfoRow label="Staff"            value={String(business.staff.length)} />
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Access ── */}
      {activeTab === 'access' && (
        <Card>
          <CardHeader title="Access Control" />
          <CardBody>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[14px]" style={{ color: '#03031F' }}>Business Status</p>
                <p className="text-[12px] mt-0.5" style={{ color: '#6F6D7A' }}>
                  Deactivation blocks merchant access and customer bookings.
                </p>
              </div>
              <Button
                variant={business.isActive ? 'danger' : 'primary'}
                onClick={() => { setStatusError(null); setStatusReason(''); setShowStatusModal(true); }}
              >
                {business.isActive ? 'Suspend Account' : 'Reactivate Account'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Subscription ── */}
      {activeTab === 'subscription' && (
        <Card>
          <CardHeader title="Subscription" />
          <CardBody>
            <InfoRow label="Billing Label (Plan)" value={business.subscription?.plan || 'TRIAL'} />
            <InfoRow label="Status"       value={business.subscription?.status || 'TRIAL'} />
            <InfoRow label="Period Start" value={fmtD(business.subscription?.currentPeriodStart)} />
            <InfoRow label="Period End"   value={fmtD(business.subscription?.currentPeriodEnd)} />
            <InfoRow label="Trial Ends"   value={fmtD(business.subscription?.trialEndsAt)} />
            <div className="pt-4 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => navigate(`/payments?businessId=${id}`)}>
                Extend Subscription / Record Payment
              </Button>
              <Button variant="secondary" onClick={() => { setPlanError(null); setNewPlan(business.subscription?.plan || ''); setPlanReason(''); setShowPlanModal(true); }}>
                Change Plan Label (Low Priority)
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Payments ── */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader title="Payments" subtitle="Payment history and manual collection" />
          <CardBody>
            <div className="space-y-4">
              <Button variant="primary" onClick={() => navigate(`/payments?businessId=${id}`)}>
                Record Manual Payment
              </Button>
              {business.subscription?.payments && business.subscription.payments.length > 0 ? (
                <div className="space-y-2 mt-4">
                  <p className="font-semibold text-salex-sm">Recent Payments</p>
                  {business.subscription.payments.map((p) => (
                    <div key={p.id} className="p-3 border rounded-salex-md flex justify-between items-center text-[13px]">
                      <div>
                        <p className="font-semibold">₹{p.amount.toLocaleString()}</p>
                        <p className="text-[11px] text-salex-secondary">{p.paymentMethod.toUpperCase()}</p>
                      </div>
                      <p className="text-[11px] text-salex-secondary">{fmtD(p.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-salex-secondary mt-2">No manual payments recorded yet.</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Bookings ── */}
      {activeTab === 'bookings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Recent Bookings" subtitle="Last 20 bookings" />
            <CardBody>
              <ListEmpty empty={business.bookings.length === 0} label="No bookings yet">
                {business.bookings.map((b) => {
                  const customerName = b.customer?.name || b.businessCustomer?.displayName || 'Walk-in Customer';
                  const customerPhone = b.customer?.phoneNumber || b.businessCustomer?.person?.phoneNumber || 'No phone';
                  return (
                    <LogRow
                      key={b.id}
                      title={`${customerName} (${customerPhone})`}
                      meta={`${b.items.map((i) => i.service?.name).filter(Boolean).join(', ') || 'Service'} • ${fmt(b.totalPrice)}`}
                      date={fmtDT(b.createdAt)}
                      badge={b.status}
                    />
                  );
                })}
              </ListEmpty>
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Booking Diagnostics"
              subtitle="Recent attempts and failures"
              action={
                <Button variant="ghost" size="xs" leftIcon={<RefreshCw size={12} />} onClick={refreshBookingDiagnostics} isLoading={diagnosticsRefreshing}>
                  Refresh
                </Button>
              }
            />
            <CardBody>
              <ListEmpty empty={business.bookingDiagnostics.length === 0} label="No booking attempts recorded">
                {business.bookingDiagnostics.map((a) => (
                  <LogRow
                    key={a.id}
                    title={`${a.channel} / ${a.stage}`}
                    meta={a.failureMessage || a.failureCode || 'No failure message'}
                    date={fmtDT(a.createdAt)}
                    badge={a.status}
                  />
                ))}
              </ListEmpty>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── WhatsApp ── */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          {/* Dedicated Channel Configuration */}
          <WhatsAppChannelConfig businessId={business.id} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="WhatsApp Channel Status" subtitle="Onboarding details and mode" />
            <CardBody>
              {business.whatsappChannels.length > 0 ? (
                <div className="space-y-4">
                  {business.whatsappChannels.map((ch) => (
                    <div key={ch.id} className="space-y-3">
                      <InfoRow label="Routing Mode" value={ch.mode === 'DEDICATED' ? 'DEDICATED (Dedicated Number)' : 'SHARED (Shared Routing)'} />
                      <InfoRow label="Onboarding Status" value={ch.status} />
                      <InfoRow label="Display Phone Number" value={ch.displayPhoneNumber} />
                      <InfoRow label="Phone Number ID" value={ch.phoneNumberId} />
                      <InfoRow label="Last Inbound Msg" value={fmtDT(ch.lastInboundAt)} />
                      <InfoRow label="Last Outbound Msg" value={fmtDT(ch.lastOutboundAt)} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 text-center py-6">
                  <p className="text-[13px]" style={{ color: '#A8A6B0' }}>
                    No dedicated channel configured; shared routing is used.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="WhatsApp Message Audit"
              subtitle="Inbound and outbound message trail"
              action={
                <Button variant="ghost" size="xs" leftIcon={<RefreshCw size={12} />} onClick={refreshWhatsAppAudit} isLoading={whatsappRefreshing}>
                  Refresh
                </Button>
              }
            />
            <CardBody>
              <ListEmpty empty={business.whatsappMessageAudit.length === 0} label="No WhatsApp messages audited">
                {business.whatsappMessageAudit.map((m) => (
                  <LogRow
                    key={m.id}
                    title={`${m.direction.toUpperCase()} — ${m.messageType.toUpperCase()}`}
                    meta={m.conversation?.customerPhone || 'Unknown customer'}
                    date={fmtDT(m.createdAt)}
                    badge={m.status}
                  />
                ))}
              </ListEmpty>
            </CardBody>
          </Card>
        </div>
        </div>
      )}

      {/* ── Support ── */}
      {activeTab === 'support' && (
        <Card>
          <CardHeader
            title="Support Notes"
            subtitle="Internal admin notes for this business"
            action={
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" leftIcon={<RefreshCw size={12} />} onClick={refreshSupportNotes} isLoading={supportRefreshing}>Refresh</Button>
                <Button variant="primary" size="xs" leftIcon={<Plus size={12} />} onClick={() => { setNoteError(null); setSupportNote(''); setSupportNoteStatus('OPEN'); setShowNoteModal(true); }}>Add Note</Button>
              </div>
            }
          />
          <CardBody>
            <ListEmpty empty={business.supportNotes.length === 0} label="No support notes yet">
              {business.supportNotes.map((note) => (
                <LogRow
                  key={note.id}
                  title={note.body}
                  meta={`Created by: ${note.admin?.name || note.admin?.email || 'Admin'}`}
                  date={fmtDT(note.createdAt)}
                  badge={note.status}
                  actions={
                    <div className="flex items-center gap-1">
                      {note.status !== 'OPEN' && (
                        <Button size="xs" variant="ghost" onClick={() => handleUpdateNoteStatus(note.id, 'OPEN')} disabled={noteUpdatingId === note.id}>
                          Set Open
                        </Button>
                      )}
                      {note.status !== 'FOLLOW_UP' && (
                        <Button size="xs" variant="ghost" onClick={() => handleUpdateNoteStatus(note.id, 'FOLLOW_UP')} disabled={noteUpdatingId === note.id}>
                          Set Follow Up
                        </Button>
                      )}
                      {note.status !== 'RESOLVED' && (
                        <Button size="xs" variant="ghost" onClick={() => handleUpdateNoteStatus(note.id, 'RESOLVED')} disabled={noteUpdatingId === note.id}>
                          Set Resolved
                        </Button>
                      )}
                    </div>
                  }
                />
              ))}
            </ListEmpty>
          </CardBody>
        </Card>
      )}

      {/* ── Audit ── */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader title="Audit Logs" />
          <CardBody>
            <p className="text-[13px] text-salex-secondary mb-4">View actions log specific to this business context.</p>
            <Button variant="primary" onClick={() => navigate(`/audit-logs?entityType=Business&entityId=${id}`)}>
              Open Audit Logs
            </Button>
          </CardBody>
        </Card>
      )}

      {/* ── Status Modal ── */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => { if (!statusChanging) setShowStatusModal(false); }}
        title={business.isActive ? 'Suspend Account' : 'Reactivate Account'}
        subtitle="This action will be recorded in the audit log."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={statusChanging}>Cancel</Button>
            <Button
              variant={business.isActive ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
              isLoading={statusChanging}
              disabled={!statusReason.trim() || statusChanging}
            >
              {business.isActive ? 'Suspend Account' : 'Reactivate Account'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {statusError && <Alert type="error" title="Error" message={statusError} />}
          <div>
            <label className="block font-semibold text-[12px] uppercase tracking-wide mb-2" style={{ color: '#6F6D7A' }}>
              Reason for Action *
            </label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder={business.isActive ? 'Describe the reason for suspending this account…' : 'Describe the reason for reactivating this account…'}
              rows={4}
              className="w-full rounded-salex-md px-3 py-2.5 border text-[14px] resize-none"
              style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white' }}
              disabled={statusChanging}
            />
          </div>
        </div>
      </Modal>

      {/* ── Plan Modal ── */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => { if (!planChanging) setShowPlanModal(false); }}
        title="Change Subscription Billing Label (Low Priority)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPlanModal(false)} disabled={planChanging}>Cancel</Button>
            <Button variant="primary" onClick={handleChangePlan} isLoading={planChanging} disabled={!newPlan || !planReason.trim() || planChanging}>
              Change Label
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {planError && <Alert type="error" title="Error" message={planError} />}
          <div>
            <label className="block font-semibold text-[12px] uppercase tracking-wide mb-2" style={{ color: '#6F6D7A' }}>New Billing Plan Label</label>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="w-full rounded-salex-md px-3 py-2.5 border text-[14px]"
              style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white' }}
              disabled={planChanging}
            >
              <option value="">Select a plan label</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Professional</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[12px] uppercase tracking-wide mb-2" style={{ color: '#6F6D7A' }}>Reason for Label Change *</label>
            <textarea
              value={planReason}
              onChange={(e) => setPlanReason(e.target.value)}
              placeholder="Reason for plan billing label change…"
              rows={3}
              className="w-full rounded-salex-md px-3 py-2.5 border text-[14px] resize-none"
              style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white' }}
              disabled={planChanging}
            />
          </div>
        </div>
      </Modal>

      {/* ── Support Note Modal ── */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => { if (!noteCreating) setShowNoteModal(false); }}
        title="Add Support Note"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNoteModal(false)} disabled={noteCreating}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSupportNote} isLoading={noteCreating} disabled={!supportNote.trim() || noteCreating}>Add Note</Button>
          </>
        }
      >
        <div className="space-y-4">
          {noteError && <Alert type="error" title="Error" message={noteError} />}
          <div>
            <label className="block font-semibold text-[12px] uppercase tracking-wide mb-2" style={{ color: '#6F6D7A' }}>Note *</label>
            <textarea
              value={supportNote}
              onChange={(e) => setSupportNote(e.target.value)}
              placeholder="Write an internal support note…"
              rows={5}
              className="w-full rounded-salex-md px-3 py-2.5 border text-[14px] resize-none"
              style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white' }}
              disabled={noteCreating}
            />
          </div>
          <div>
            <label className="block font-semibold text-[12px] uppercase tracking-wide mb-2" style={{ color: '#6F6D7A' }}>Initial Status</label>
            <select
              value={supportNoteStatus}
              onChange={(e) => setSupportNoteStatus(e.target.value as any)}
              className="w-full rounded-salex-md px-3 py-2.5 border text-[14px]"
              style={{ borderColor: '#C9C7CF', color: '#03031F', background: 'white' }}
              disabled={noteCreating}
            >
              <option value="OPEN">Open</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
