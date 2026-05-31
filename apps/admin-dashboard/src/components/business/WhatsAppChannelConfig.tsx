/**
 * WhatsApp Channel Configuration Component
 *
 * Manages the full lifecycle of a dedicated WhatsApp channel:
 * - NO_CHANNEL: Shows shared mode indicator + configure button
 * - PENDING: Shows config summary + test connection button
 * - CONNECTED: Shows health info + disconnect button
 * - DISABLED/FAILED: Shows reconnect option
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Badge, Button, Card, CardBody, CardHeader } from '@/components';
import {
  adminWhatsAppChannelApi,
  WhatsAppChannelData,
  UpsertChannelPayload,
  TestConnectionResult,
} from '@/api/adminWhatsAppChannel';
import { RefreshCw, CheckCircle, XCircle, Copy, Wifi, WifiOff } from 'lucide-react';

interface Props {
  businessId: string;
}

type ViewState = 'loading' | 'shared' | 'form' | 'pending' | 'connected' | 'disabled' | 'failed';

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F0EFEE' }}>
    <span className="text-[13px]" style={{ color: '#6F6D7A' }}>{label}</span>
    <span className="text-[13px] font-semibold text-right" style={{ color: '#03031F' }}>{value || '—'}</span>
  </div>
);

export const WhatsAppChannelConfig: React.FC<Props> = ({ businessId }) => {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [channel, setChannel] = useState<WhatsAppChannelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpsertChannelPayload>({
    phoneNumberId: '',
    displayPhoneNumber: '',
    wabaId: '',
    accessToken: '',
    appSecret: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  // Action states
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchChannel = useCallback(async () => {
    try {
      setError(null);
      const response = await adminWhatsAppChannelApi.getChannel(businessId);
      const { mode, channel: ch } = response.data;

      setChannel(ch);

      if (mode === 'SHARED' || !ch) {
        setViewState('shared');
      } else {
        switch (ch.status) {
          case 'CONNECTED':
            setViewState('connected');
            break;
          case 'DISABLED':
            setViewState('disabled');
            break;
          case 'FAILED':
            setViewState('failed');
            break;
          default:
            setViewState('pending');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load channel configuration');
      setViewState('shared');
    }
  }, [businessId]);

  useEffect(() => {
    void fetchChannel();
  }, [fetchChannel]);

  const handleFormChange = (field: keyof UpsertChannelPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = async () => {
    setFormSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const ch = await adminWhatsAppChannelApi.upsertChannel(businessId, formData);
      setChannel(ch);
      setViewState('pending');
      setTestResult(null);
      setSuccessMsg('Channel configured successfully. Test the connection to proceed.');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save channel configuration');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const result = await adminWhatsAppChannelApi.testConnection(businessId);
      setTestResult(result);
      if (result.success) {
        setSuccessMsg(`Connection verified: ${result.verifiedName || result.displayPhoneNumber}`);
      }
      // Refresh channel data to get updated lastTestedAt
      await fetchChannel();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Test connection failed');
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await adminWhatsAppChannelApi.connect(businessId);
      setSuccessMsg('Channel connected and active');
      await fetchChannel();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to connect channel');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      await adminWhatsAppChannelApi.disconnect(businessId);
      setSuccessMsg('Channel disconnected');
      await fetchChannel();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to disconnect channel');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/v1/webhooks/whatsapp`;
    navigator.clipboard.writeText(webhookUrl);
    setSuccessMsg('Webhook URL copied to clipboard');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleStartConfigure = () => {
    // Pre-fill form with existing channel data if available
    if (channel) {
      setFormData({
        phoneNumberId: channel.phoneNumberId || '',
        displayPhoneNumber: channel.displayPhoneNumber || '',
        wabaId: channel.wabaId || '',
        accessToken: '',
        appSecret: '',
      });
    }
    setViewState('form');
  };

  const fmtDT = (d?: string | null) => d ? new Date(d).toLocaleString('en-IN') : '—';

  if (viewState === 'loading') {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}
      {successMsg && <Alert type="success" title="Success" message={successMsg} onClose={() => setSuccessMsg(null)} />}

      {/* SHARED MODE — No dedicated channel */}
      {viewState === 'shared' && (
        <Card>
          <CardHeader title="WhatsApp Channel" subtitle="Channel routing configuration" />
          <CardBody>
            <div className="text-center py-6 space-y-4">
              <Badge label="Shared (via routing code)" variant="info" />
              <p className="text-[13px]" style={{ color: '#6F6D7A' }}>
                This business uses the shared platform WhatsApp number with routing codes.
              </p>
              <Button variant="primary" onClick={handleStartConfigure}>
                Configure Dedicated Channel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* FORM — Configure credentials */}
      {viewState === 'form' && (
        <Card>
          <CardHeader title="Configure Dedicated Channel" subtitle="Enter Meta WhatsApp Business API credentials" />
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6F6D7A' }}>
                  Phone Number ID *
                </label>
                <input
                  type="text"
                  value={formData.phoneNumberId}
                  onChange={(e) => handleFormChange('phoneNumberId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-[13px]"
                  style={{ borderColor: '#E5E4E3' }}
                  placeholder="e.g. 1125541367309190"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6F6D7A' }}>
                  Display Phone Number *
                </label>
                <input
                  type="text"
                  value={formData.displayPhoneNumber}
                  onChange={(e) => handleFormChange('displayPhoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-[13px]"
                  style={{ borderColor: '#E5E4E3' }}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6F6D7A' }}>
                  WABA ID *
                </label>
                <input
                  type="text"
                  value={formData.wabaId}
                  onChange={(e) => handleFormChange('wabaId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-[13px]"
                  style={{ borderColor: '#E5E4E3' }}
                  placeholder="WhatsApp Business Account ID"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6F6D7A' }}>
                  Access Token *
                </label>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => handleFormChange('accessToken', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-[13px]"
                  style={{ borderColor: '#E5E4E3' }}
                  placeholder="Permanent access token from Meta"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6F6D7A' }}>
                  App Secret *
                </label>
                <input
                  type="password"
                  value={formData.appSecret}
                  onChange={(e) => handleFormChange('appSecret', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-[13px]"
                  style={{ borderColor: '#E5E4E3' }}
                  placeholder="App secret for webhook signature verification"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleSubmitForm}
                  isLoading={formSubmitting}
                  disabled={!formData.phoneNumberId || !formData.displayPhoneNumber || !formData.wabaId || !formData.accessToken || !formData.appSecret}
                >
                  Save Configuration
                </Button>
                <Button variant="secondary" onClick={() => channel ? fetchChannel() : setViewState('shared')}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* PENDING — Configured but not connected */}
      {viewState === 'pending' && channel && (
        <Card>
          <CardHeader
            title="WhatsApp Channel"
            subtitle="Dedicated channel — pending connection"
            action={<Badge label="PENDING" variant="warning" />}
          />
          <CardBody>
            <div className="space-y-3">
              <InfoRow label="Phone Number ID" value={channel.phoneNumberId} />
              <InfoRow label="Display Number" value={channel.displayPhoneNumber} />
              <InfoRow label="WABA ID" value={channel.wabaId || '—'} />
              <InfoRow label="Last Tested" value={fmtDT(channel.lastTestedAt)} />

              {/* Webhook URL */}
              <div className="mt-4 p-3 rounded-md" style={{ background: '#F5F3F1', border: '1px solid #E5E4E3' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#6F6D7A' }}>
                  Webhook URL (configure in Meta Dashboard)
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-[12px] flex-1 break-all" style={{ color: '#03031F' }}>
                    {window.location.origin}/v1/webhooks/whatsapp
                  </code>
                  <Button variant="ghost" size="xs" onClick={handleCopyWebhookUrl}>
                    <Copy size={12} />
                  </Button>
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`p-3 rounded-md mt-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                    <span className="text-[13px] font-semibold">
                      {testResult.success ? `Verified: ${testResult.verifiedName}` : `Failed: ${testResult.error}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <Button
                  variant="secondary"
                  onClick={handleTestConnection}
                  isLoading={testing}
                  leftIcon={<RefreshCw size={14} />}
                >
                  Test Connection
                </Button>
                {testResult?.success && (
                  <Button
                    variant="primary"
                    onClick={handleConnect}
                    isLoading={connecting}
                    leftIcon={<Wifi size={14} />}
                  >
                    Connect
                  </Button>
                )}
                <Button variant="ghost" onClick={handleStartConfigure}>
                  Edit Config
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* CONNECTED — Active */}
      {viewState === 'connected' && channel && (
        <Card>
          <CardHeader
            title="WhatsApp Channel"
            subtitle="Dedicated channel — active"
            action={<Badge label="CONNECTED" variant="success" dot />}
          />
          <CardBody>
            <div className="space-y-3">
              <InfoRow label="Phone Number ID" value={channel.phoneNumberId} />
              <InfoRow label="Display Number" value={channel.displayPhoneNumber} />
              <InfoRow label="WABA ID" value={channel.wabaId || '—'} />
              <InfoRow label="Last Tested" value={fmtDT(channel.lastTestedAt)} />
              <InfoRow label="Last Inbound" value={fmtDT(channel.lastInboundAt)} />
              <InfoRow label="Last Outbound" value={fmtDT(channel.lastOutboundAt)} />

              <div className="flex gap-3 pt-3">
                <Button
                  variant="danger"
                  onClick={handleDisconnect}
                  isLoading={disconnecting}
                  leftIcon={<WifiOff size={14} />}
                >
                  Disconnect
                </Button>
                <Button variant="ghost" onClick={handleStartConfigure}>
                  Update Credentials
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* DISABLED / FAILED — Reconnect option */}
      {(viewState === 'disabled' || viewState === 'failed') && channel && (
        <Card>
          <CardHeader
            title="WhatsApp Channel"
            subtitle={`Dedicated channel — ${channel.status.toLowerCase()}`}
            action={<Badge label={channel.status} variant={viewState === 'failed' ? 'error' : 'warning'} />}
          />
          <CardBody>
            <div className="space-y-3">
              <InfoRow label="Phone Number ID" value={channel.phoneNumberId} />
              <InfoRow label="Display Number" value={channel.displayPhoneNumber} />
              <InfoRow label="WABA ID" value={channel.wabaId || '—'} />
              <InfoRow label="Last Tested" value={fmtDT(channel.lastTestedAt)} />

              <div className="flex gap-3 pt-3">
                <Button
                  variant="primary"
                  onClick={handleTestConnection}
                  isLoading={testing}
                  leftIcon={<RefreshCw size={14} />}
                >
                  Test & Reconnect
                </Button>
                <Button variant="ghost" onClick={handleStartConfigure}>
                  Update Credentials
                </Button>
              </div>

              {testResult?.success && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={handleConnect}
                    isLoading={connecting}
                    leftIcon={<Wifi size={14} />}
                  >
                    Connect
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
