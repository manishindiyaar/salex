import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { adminFlowsApi, ReadinessResult } from '@/api/adminFlows';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ReadinessChecklistProps {
  businessId: string;
  onReadinessChange?: (canPublish: boolean) => void;
}

// ─── All readiness checks (used to show passing items too) ───────────────────

const ALL_CHECKS: Array<{ code: string; label: string }> = [
  { code: 'ONBOARDING_INCOMPLETE', label: 'Onboarding complete' },
  { code: 'BUSINESS_INACTIVE', label: 'Business active' },
  { code: 'NO_ACTIVE_SERVICES', label: 'Active services configured' },
  { code: 'NO_CAPACITY', label: 'Staff or resources available' },
  { code: 'NO_HOURS', label: 'Operating hours defined' },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * ReadinessChecklist panel component.
 *
 * Fetches GET /api/v1/admin/businesses/:businessId/flow-readiness on mount
 * and displays pass/fail for each readiness item with severity indicators.
 * Shows channel mode badge and reports canPublish status to parent via callback.
 *
 * Requirements: 5.3, 5.4
 */
export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({
  businessId,
  onReadinessChange,
}) => {
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchReadiness = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminFlowsApi.getReadiness(businessId);
      setReadiness(result);
      onReadinessChange?.(result.canPublish);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Cannot verify readiness';
      setError(message);
      onReadinessChange?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, onReadinessChange]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  return (
    <div className="border-t" style={{ borderColor: '#F0EFEE' }}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#F5F3F1] transition-colors"
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight size={14} style={{ color: '#6F6D7A' }} />
          ) : (
            <ChevronDown size={14} style={{ color: '#6F6D7A' }} />
          )}
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: '#A8A6B0' }}
          >
            Readiness
          </span>
        </div>
        <div className="flex items-center gap-2">
          {readiness && !isLoading && (
            readiness.canPublish ? (
              <CheckCircle2 size={14} style={{ color: '#12A36D' }} />
            ) : (
              <XCircle size={14} style={{ color: '#C62020' }} />
            )
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchReadiness();
            }}
            className="p-0.5 rounded hover:bg-[#E8E6E3] transition-colors"
            title="Refresh readiness"
          >
            <RefreshCw
              size={12}
              className={isLoading ? 'animate-spin' : ''}
              style={{ color: '#A8A6B0' }}
            />
          </button>
        </div>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-4 pb-3 space-y-3">
          {/* Loading state */}
          {isLoading && !readiness && (
            <div className="flex items-center gap-2 py-2">
              <div className="spinner" style={{ width: 14, height: 14 }} />
              <span className="text-[11px]" style={{ color: '#A8A6B0' }}>
                Checking readiness…
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 py-2 px-2.5 rounded-salex-md bg-[#C6202008] border border-[#C6202020]">
              <AlertTriangle size={12} style={{ color: '#C62020' }} />
              <span className="text-[11px]" style={{ color: '#C62020' }}>
                {error}
              </span>
            </div>
          )}

          {readiness && (
            <>
              {/* Can Publish Status */}
              <div
                className="flex items-center gap-2 px-2.5 py-2 rounded-salex-md"
                style={{
                  background: readiness.canPublish
                    ? 'rgba(18, 163, 109, 0.08)'
                    : 'rgba(198, 32, 32, 0.08)',
                  border: `1px solid ${readiness.canPublish ? 'rgba(18, 163, 109, 0.2)' : 'rgba(198, 32, 32, 0.2)'}`,
                }}
              >
                {readiness.canPublish ? (
                  <CheckCircle2 size={14} style={{ color: '#12A36D' }} />
                ) : (
                  <XCircle size={14} style={{ color: '#C62020' }} />
                )}
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: readiness.canPublish ? '#0E8558' : '#C62020' }}
                >
                  {readiness.canPublish ? 'Ready to publish' : 'Not ready to publish'}
                </span>
              </div>

              {/* Channel Mode Badge */}
              <ChannelModeBadge channelMode={readiness.channelMode} />

              {/* Checklist Items */}
              <div className="space-y-1">
                {ALL_CHECKS.map((check) => {
                  const failedItem = readiness.missing.find(
                    (m) => m.code === check.code
                  );
                  const passed = !failedItem;

                  return (
                    <ChecklistItem
                      key={check.code}
                      label={check.label}
                      passed={passed}
                      severity={failedItem?.severity}
                      message={failedItem?.message}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Checklist Item ──────────────────────────────────────────────────────────

const ChecklistItem: React.FC<{
  label: string;
  passed: boolean;
  severity?: 'blocker' | 'warning';
  message?: string;
}> = ({ label, passed, severity, message }) => {
  return (
    <div
      className="flex items-start gap-2 px-2 py-1.5 rounded-salex-sm"
      title={message}
    >
      {passed ? (
        <CheckCircle2
          size={13}
          className="mt-0.5 flex-shrink-0"
          style={{ color: '#12A36D' }}
        />
      ) : severity === 'warning' ? (
        <AlertTriangle
          size={13}
          className="mt-0.5 flex-shrink-0"
          style={{ color: '#9C7A4A' }}
        />
      ) : (
        <XCircle
          size={13}
          className="mt-0.5 flex-shrink-0"
          style={{ color: '#C62020' }}
        />
      )}
      <span
        className="text-[11px] leading-tight"
        style={{
          color: passed
            ? '#03031F'
            : severity === 'warning'
              ? '#7D5F2F'
              : '#C62020',
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ─── Channel Mode Badge ──────────────────────────────────────────────────────

const ChannelModeBadge: React.FC<{
  channelMode: 'SHARED' | 'DEDICATED' | 'NONE';
}> = ({ channelMode }) => {
  const config = {
    SHARED: {
      label: 'Shared Number',
      bg: 'rgba(0, 136, 204, 0.12)',
      color: '#0077B5',
    },
    DEDICATED: {
      label: 'Dedicated Number',
      bg: 'rgba(18, 163, 109, 0.12)',
      color: '#0E8558',
    },
    NONE: {
      label: 'No Channel',
      bg: 'rgba(156, 122, 74, 0.12)',
      color: '#7D5F2F',
    },
  }[channelMode];

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        {config.label}
      </span>
    </div>
  );
};
