/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check, Plus, Trash2, Building2, User, Clock, Sparkles, KeyRound, Copy } from 'lucide-react';
import { Button, Input, Select, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';

// Vertical config (mirrors shared-types/verticals/business-verticals.ts)
const VERTICALS: Record<string, { terminology: { resource: string; resourcePlural: string; staff: string; staffPlural: string; service: string; servicePlural: string }; defaultServices: Array<{ name: string; duration: number; price: number }> }> = {
  SALON: { terminology: { resource: 'Chair', resourcePlural: 'Chairs', staff: 'Stylist', staffPlural: 'Stylists', service: 'Service', servicePlural: 'Services' }, defaultServices: [{ name: 'Haircut', duration: 30, price: 300 }, { name: 'Hair Wash & Blow Dry', duration: 20, price: 200 }, { name: 'Hair Coloring', duration: 90, price: 1500 }] },
  BEAUTY_PARLOR: { terminology: { resource: 'Station', resourcePlural: 'Stations', staff: 'Beautician', staffPlural: 'Beauticians', service: 'Service', servicePlural: 'Services' }, defaultServices: [{ name: 'Facial', duration: 45, price: 500 }, { name: 'Threading', duration: 15, price: 50 }, { name: 'Waxing', duration: 30, price: 300 }] },
  SPA: { terminology: { resource: 'Room', resourcePlural: 'Rooms', staff: 'Therapist', staffPlural: 'Therapists', service: 'Treatment', servicePlural: 'Treatments' }, defaultServices: [{ name: 'Swedish Massage', duration: 60, price: 2000 }, { name: 'Deep Tissue Massage', duration: 60, price: 2500 }] },
  CLINIC: { terminology: { resource: 'Room', resourcePlural: 'Rooms', staff: 'Doctor', staffPlural: 'Doctors', service: 'Treatment', servicePlural: 'Treatments' }, defaultServices: [{ name: 'General Consultation', duration: 20, price: 500 }, { name: 'Follow-up Visit', duration: 15, price: 300 }] },
  FITNESS: { terminology: { resource: 'Slot', resourcePlural: 'Slots', staff: 'Trainer', staffPlural: 'Trainers', service: 'Class', servicePlural: 'Classes' }, defaultServices: [{ name: 'Personal Training', duration: 60, price: 800 }, { name: 'Group Class', duration: 45, price: 300 }] },
  OTHER: { terminology: { resource: 'Resource', resourcePlural: 'Resources', staff: 'Staff', staffPlural: 'Staff', service: 'Service', servicePlural: 'Services' }, defaultServices: [] },
};

const CATEGORY_OPTIONS = [
  { value: 'SALON', label: 'Salon' },
  { value: 'BEAUTY_PARLOR', label: 'Beauty Parlor' },
  { value: 'SPA', label: 'Spa' },
  { value: 'CLINIC', label: 'Clinic' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'OTHER', label: 'Other' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  ownerPhone: string;
  temporaryPassword: string;
  businessName: string;
  category: string;
  businessPhone: string;
  routingCode: string;
  plan: string;
  services: Array<{ name: string; price: string; durationMinutes: string }>;
  resources: Array<{ name: string }>;
  staff: Array<{ name: string; phone: string }>;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
}

const INITIAL_HOURS: FormData['hours'] = Object.fromEntries(
  DAYS.map(d => [d, d === 'sunday' ? { open: '', close: '', closed: true } : { open: '09:00', close: '20:00', closed: false }])
);

const normalizeHoursForApi = (hours: FormData['hours']) =>
  Object.fromEntries(
    Object.entries(hours).map(([day, value]) => [
      day,
      value.closed
        ? { open: '00:00', close: '00:00', closed: true }
        : { open: value.open || '09:00', close: value.close || '20:00', closed: false },
    ])
  );

const hasHoursChangedFromDefault = (hours: FormData['hours']) =>
  DAYS.some((day) => {
    const current = hours[day];
    const initial = INITIAL_HOURS[day];
    return current.closed !== initial.closed || current.open !== initial.open || current.close !== initial.close;
  });

const getIndiaLocalPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

export const CreateBusinessModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionedAccount, setProvisionedAccount] = useState<{
    phone: string;
    temporaryPassword: string;
    businessName: string;
    routingCode: string | null;
  } | null>(null);
  const [form, setForm] = useState<FormData>({
    ownerPhone: '+91',
    temporaryPassword: '',
    businessName: '',
    category: 'SALON',
    businessPhone: '',
    routingCode: '',
    plan: 'BASIC',
    services: [],
    resources: [],
    staff: [],
    hours: { ...INITIAL_HOURS },
  });

  const vertical = useMemo(() => VERTICALS[form.category] || VERTICALS.OTHER, [form.category]);

  const steps = [
    { label: 'Owner Access', icon: <User size={14} /> },
    { label: 'Business Identity', icon: <Building2 size={14} /> },
    { label: 'Services', icon: <Sparkles size={14} /> },
    { label: 'Resources & Staff', icon: <Plus size={14} /> },
    { label: 'Hours & Review', icon: <Clock size={14} /> },
  ];

  const update = (patch: Partial<FormData>) => setForm(prev => ({ ...prev, ...patch }));
  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    return value.trim();
  };
  const isValidE164 = (value: string) => /^\+\d{10,15}$/.test(normalizePhone(value));

  // Validation
  const isStep0Valid = isValidE164(form.ownerPhone) && (form.temporaryPassword.trim().length === 0 || form.temporaryPassword.trim().length >= 8);
  const isStep1Valid = form.category.length > 0 && (form.businessPhone.trim().length === 0 || isValidE164(form.businessPhone));

  const canSubmit = isStep0Valid && isStep1Valid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        ownerPhone: normalizePhone(form.ownerPhone),
        business: {
          category: form.category,
          ...(form.routingCode.length === 4 ? { routingCode: form.routingCode } : {}),
        },
        subscription: { plan: form.plan, status: 'TRIAL' },
      };
      if (form.temporaryPassword.trim()) {
        payload.temporaryPassword = form.temporaryPassword.trim();
      }
      if (form.businessName.trim()) {
        payload.business.name = form.businessName.trim();
      }
      if (form.businessPhone.trim()) {
        payload.business.phoneNumber = normalizePhone(form.businessPhone);
      }

      // Add onboarding data if provided
      const onboarding: any = {};
      if (form.services.length > 0) {
        onboarding.services = form.services.map(s => ({
          name: s.name,
          price: Number(s.price) || 0,
          durationMinutes: Number(s.durationMinutes) || 30,
        }));
      }
      if (form.resources.length > 0) {
        onboarding.resources = form.resources.map(r => ({ name: r.name }));
      }
      if (form.staff.length > 0) {
        onboarding.staff = form.staff.map(s => ({ name: s.name, ...(s.phone ? { phone: s.phone } : {}) }));
      }
      // Only include hours when the admin reaches/reviews the hours step and changes them.
      if (step === 4 && hasHoursChangedFromDefault(form.hours)) {
        onboarding.hoursOfOperation = normalizeHoursForApi(form.hours);
      }
      if (Object.keys(onboarding).length > 0) {
        payload.onboarding = onboarding;
      }

      const result = await apiClient.provisionMerchant(payload);
      const provisioned = result.data;
      setProvisionedAccount({
        phone: provisioned.user.phone,
        temporaryPassword: provisioned.temporaryPassword,
        businessName: provisioned.business.name,
        routingCode: provisioned.business.routingCode,
      });
      onSuccess();
    } catch (err: any) {
      const details = err.response?.data?.error?.details;
      const firstDetail = details && Object.entries(details)[0];
      const msg = firstDetail
        ? `${firstDetail[0]}: ${(firstDetail[1] as string[]).join(', ')}`
        : err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create business';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setError(null);
    setProvisionedAccount(null);
    setForm({
      ownerPhone: '+91',
      temporaryPassword: '',
      businessName: '',
      category: 'SALON',
      businessPhone: '',
      routingCode: '',
      plan: 'BASIC',
      services: [],
      resources: [],
      staff: [],
      hours: { ...INITIAL_HOURS },
    });
    onClose();
  };

  const loadDefaults = () => {
    update({ services: vertical.defaultServices.map(s => ({ name: s.name, price: String(s.price), durationMinutes: String(s.duration) })) });
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3, 3, 31, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="bg-white rounded-salex-xl w-full max-w-2xl animate-scale-in overflow-hidden flex flex-col"
        style={{ border: '1px solid #E5E4E3', boxShadow: '0 24px 64px rgba(3,3,31,0.2)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E4E3' }}>
          <div>
            <h3 className="font-serif text-[20px]" style={{ color: '#03031F', fontWeight: 400 }}>Create Business</h3>
            <p className="text-[12px] mt-0.5" style={{ color: '#A8A6B0' }}>Provision a new merchant account</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-salex-md hover:bg-[#F5F3F1]" style={{ color: '#A8A6B0' }}>
            <X size={16} />
          </button>
        </div>

        {!provisionedAccount && (
          <div className="px-6 py-3 border-b flex gap-1" style={{ borderColor: '#F5F3F1' }}>
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => { if (i <= step) setStep(i); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-salex-md text-[11px] font-semibold transition-all ${
                  i === step ? 'bg-[#03031F] text-white' : i < step ? 'bg-[#E8F5EF] text-[#12A36D]' : 'bg-[#F5F3F1] text-[#A8A6B0]'
                }`}
              >
                {i < step ? <Check size={12} /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1" style={{ minHeight: 320 }}>
          {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

          {provisionedAccount && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E8F5EF', color: '#12A36D' }}>
                  <Check size={20} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: '#03031F' }}>Merchant account created</p>
                  <p className="text-[12px]" style={{ color: '#6F6D7A' }}>{provisionedAccount.businessName}</p>
                </div>
              </div>

              <div className="rounded-salex-md border p-4 space-y-3" style={{ borderColor: '#E5E4E3', background: '#FAFAF9' }}>
                <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#03031F' }}>
                  <KeyRound size={14} />
                  First login credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide" style={{ color: '#A8A6B0' }}>Phone</p>
                    <p className="text-[14px] font-semibold" style={{ color: '#03031F' }}>{provisionedAccount.phone}</p>
                    <p className="text-[11px] mt-1" style={{ color: '#A8A6B0' }}>Salon app: enter {getIndiaLocalPhone(provisionedAccount.phone)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide" style={{ color: '#A8A6B0' }}>Temporary Password</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold font-mono" style={{ color: '#03031F' }}>{provisionedAccount.temporaryPassword}</p>
                      <button
                        className="w-7 h-7 flex items-center justify-center rounded-salex-md hover:bg-[#F5F3F1]"
                        style={{ color: '#6F6D7A' }}
                        onClick={() => navigator.clipboard?.writeText(provisionedAccount.temporaryPassword)}
                        title="Copy temporary password"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                {provisionedAccount.routingCode && (
                  <p className="text-[12px]" style={{ color: '#6F6D7A' }}>Routing code: <span className="font-semibold">{provisionedAccount.routingCode}</span></p>
                )}
                <p className="text-[11px]" style={{ color: '#A8A6B0' }}>The merchant can use these credentials in the mobile app. They will be asked to set a new password after first login.</p>
              </div>
            </div>
          )}

          {/* Step 0: Owner Access */}
          {!provisionedAccount && step === 0 && (
            <div className="space-y-4">
              <Input
                label="Owner Phone Number"
                value={form.ownerPhone}
                onChange={(e) => update({ ownerPhone: e.target.value })}
                placeholder="9876543210 or +919876543210"
                helperText="Required. 10-digit India numbers are converted to +91 format."
                error={form.ownerPhone.length > 3 && !isValidE164(form.ownerPhone) ? 'Enter a valid phone number, e.g. 9876543210 or +919876543210' : undefined}
              />
              <Input
                label="Temporary Password"
                type="password"
                value={form.temporaryPassword}
                onChange={(e) => update({ temporaryPassword: e.target.value })}
                placeholder="Auto-generated if blank"
                helperText="Optional. Owner must change this on first login."
                error={form.temporaryPassword.length > 0 && form.temporaryPassword.length < 8 ? 'Minimum 8 characters' : undefined}
              />
            </div>
          )}

          {/* Step 1: Business Identity */}
          {!provisionedAccount && step === 1 && (
            <div className="space-y-4">
              <Input
                label="Business Name"
                value={form.businessName}
                onChange={(e) => update({ businessName: e.target.value })}
                placeholder="Auto-generated if blank"
                helperText="Optional. Merchant can rename it later."
              />
              <Select
                label="Business Type"
                value={form.category}
                onChange={(e) => update({ category: e.target.value, services: [] })}
                options={CATEGORY_OPTIONS}
              />
              <Input
                label="Business Phone"
                value={form.businessPhone}
                onChange={(e) => update({ businessPhone: e.target.value })}
                placeholder="Defaults to owner phone"
                helperText="Optional. Leave blank to reuse owner phone."
                error={form.businessPhone.trim().length > 0 && !isValidE164(form.businessPhone) ? 'Enter a valid phone number, e.g. 9876543210 or +919876543210' : undefined}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Routing Code"
                  value={form.routingCode}
                  onChange={(e) => update({ routingCode: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="Auto-generated"
                  helperText="4 digits. Leave blank to auto-generate."
                />
                <Select
                  label="Plan"
                  value={form.plan}
                  onChange={(e) => update({ plan: e.target.value })}
                  options={[{ value: 'BASIC', label: 'Basic' }, { value: 'PRO', label: 'Pro' }, { value: 'CUSTOM', label: 'Custom' }]}
                />
              </div>
            </div>
          )}

          {/* Step 2: Services */}
          {!provisionedAccount && step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-semibold" style={{ color: '#03031F' }}>{vertical.terminology.servicePlural}</p>
                <Button size="xs" variant="ghost" onClick={loadDefaults} leftIcon={<Sparkles size={12} />}>Load Defaults</Button>
              </div>
              {form.services.map((svc, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <Input
                    label={i === 0 ? 'Name' : undefined}
                    value={svc.name}
                    onChange={(e) => { const s = [...form.services]; s[i] = { ...s[i], name: e.target.value }; update({ services: s }); }}
                    placeholder="Service name"
                    className="flex-1"
                  />
                  <Input
                    label={i === 0 ? 'Price' : undefined}
                    value={svc.price}
                    onChange={(e) => { const s = [...form.services]; s[i] = { ...s[i], price: e.target.value }; update({ services: s }); }}
                    placeholder="₹"
                    className="w-20"
                    type="number"
                  />
                  <Input
                    label={i === 0 ? 'Min' : undefined}
                    value={svc.durationMinutes}
                    onChange={(e) => { const s = [...form.services]; s[i] = { ...s[i], durationMinutes: e.target.value }; update({ services: s }); }}
                    placeholder="30"
                    className="w-16"
                    type="number"
                  />
                  <button onClick={() => update({ services: form.services.filter((_, j) => j !== i) })} className="p-2 text-[#C62020] hover:bg-red-50 rounded-salex-md mb-0.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => update({ services: [...form.services, { name: '', price: '', durationMinutes: '30' }] })} leftIcon={<Plus size={14} />}>
                Add {vertical.terminology.service}
              </Button>
              <p className="text-[11px]" style={{ color: '#A8A6B0' }}>Optional. Can be added later by the merchant.</p>
            </div>
          )}

          {/* Step 3: Resources & Staff */}
          {!provisionedAccount && step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-[13px] font-semibold mb-2" style={{ color: '#03031F' }}>{vertical.terminology.resourcePlural}</p>
                {form.resources.map((r, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <Input
                      value={r.name}
                      onChange={(e) => { const rs = [...form.resources]; rs[i] = { name: e.target.value }; update({ resources: rs }); }}
                      placeholder={`${vertical.terminology.resource} ${i + 1}`}
                      className="flex-1"
                    />
                    <button onClick={() => update({ resources: form.resources.filter((_, j) => j !== i) })} className="p-2 text-[#C62020] hover:bg-red-50 rounded-salex-md">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => update({ resources: [...form.resources, { name: '' }] })} leftIcon={<Plus size={14} />}>
                  Add {vertical.terminology.resource}
                </Button>
              </div>
              <div>
                <p className="text-[13px] font-semibold mb-2" style={{ color: '#03031F' }}>{vertical.terminology.staffPlural}</p>
                {form.staff.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <Input
                      value={s.name}
                      onChange={(e) => { const st = [...form.staff]; st[i] = { ...st[i], name: e.target.value }; update({ staff: st }); }}
                      placeholder="Name"
                      className="flex-1"
                    />
                    <Input
                      value={s.phone}
                      onChange={(e) => { const st = [...form.staff]; st[i] = { ...st[i], phone: e.target.value }; update({ staff: st }); }}
                      placeholder="Phone (optional)"
                      className="w-36"
                    />
                    <button onClick={() => update({ staff: form.staff.filter((_, j) => j !== i) })} className="p-2 text-[#C62020] hover:bg-red-50 rounded-salex-md">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => update({ staff: [...form.staff, { name: '', phone: '' }] })} leftIcon={<Plus size={14} />}>
                  Add {vertical.terminology.staff}
                </Button>
              </div>
              <p className="text-[11px]" style={{ color: '#A8A6B0' }}>Optional. Can be configured later.</p>
            </div>
          )}

          {/* Step 4: Hours & Review */}
          {!provisionedAccount && step === 4 && (
            <div className="space-y-4">
              <p className="text-[13px] font-semibold" style={{ color: '#03031F' }}>Business Hours</p>
              <div className="space-y-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="w-20 text-[12px] font-medium capitalize" style={{ color: '#6F6D7A' }}>{day}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!form.hours[day]?.closed}
                        onChange={(e) => {
                          const h = { ...form.hours };
                          h[day] = { ...h[day], closed: !e.target.checked };
                          update({ hours: h });
                        }}
                        className="rounded"
                      />
                      <span className="text-[11px]" style={{ color: '#A8A6B0' }}>Open</span>
                    </label>
                    {!form.hours[day]?.closed && (
                      <>
                        <input
                          type="time"
                          value={form.hours[day]?.open || '09:00'}
                          onChange={(e) => { const h = { ...form.hours }; h[day] = { ...h[day], open: e.target.value }; update({ hours: h }); }}
                          className="text-[12px] border rounded-salex-md px-2 py-1"
                          style={{ borderColor: '#C9C7CF' }}
                        />
                        <span className="text-[11px]" style={{ color: '#A8A6B0' }}>to</span>
                        <input
                          type="time"
                          value={form.hours[day]?.close || '20:00'}
                          onChange={(e) => { const h = { ...form.hours }; h[day] = { ...h[day], close: e.target.value }; update({ hours: h }); }}
                          className="text-[12px] border rounded-salex-md px-2 py-1"
                          style={{ borderColor: '#C9C7CF' }}
                        />
                      </>
                    )}
                    {form.hours[day]?.closed && <span className="text-[11px] italic" style={{ color: '#A8A6B0' }}>Closed</span>}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 rounded-salex-md" style={{ background: '#F5F3F1' }}>
                <p className="text-[12px] font-semibold mb-2" style={{ color: '#03031F' }}>Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]" style={{ color: '#6F6D7A' }}>
                  <span>Owner: {form.ownerPhone}</span>
                  <span>Business: {form.businessName || '—'}</span>
                  <span>Category: {form.category}</span>
                  <span>Plan: {form.plan} (Trial)</span>
                  <span>{vertical.terminology.servicePlural}: {form.services.length}</span>
                  <span>{vertical.terminology.resourcePlural}: {form.resources.length}</span>
                  <span>{vertical.terminology.staffPlural}: {form.staff.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: '#E5E4E3', background: '#FAFAF9' }}>
          {provisionedAccount ? (
            <>
              <div />
              <Button variant="primary" size="sm" onClick={handleClose} leftIcon={<Check size={14} />}>
                Done
              </Button>
            </>
          ) : (
            <>
              <div>
                {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} leftIcon={<ChevronLeft size={14} />}>
                Back
              </Button>
                )}
              </div>
              <div className="flex gap-2">
            {step >= 1 && canSubmit && (
              <Button variant="outline" size="sm" onClick={handleSubmit} isLoading={submitting}>
                Create account now
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 0 ? !isStep0Valid : step === 1 ? !isStep1Valid : false}
                rightIcon={<ChevronRight size={14} />}
              >
                {step >= 1 ? 'Continue setup' : 'Next'}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={submitting} disabled={!canSubmit} leftIcon={<Check size={14} />}>
                Create Business
              </Button>
            )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
