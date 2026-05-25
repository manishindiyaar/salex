import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Badge, Button, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';
import { RefreshCw } from 'lucide-react';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency?: number;
  message?: string;
  lastChecked?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  uptime?: number;
  version?: string;
}

interface PlatformStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  weeklyBookings: number;
}

const STATUS_COLORS = {
  healthy:  { dot: '#12A36D', badge: 'success' as const, label: 'Healthy'  },
  degraded: { dot: '#9C7A4A', badge: 'warning' as const, label: 'Degraded' },
  down:     { dot: '#C62020', badge: 'error'   as const, label: 'Down'     },
  unknown:  { dot: '#A8A6B0', badge: 'muted'   as const, label: 'Unknown'  },
};

const StatusDot = ({ status }: { status: string }) => {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS]?.dot ?? '#A8A6B0';
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: color }}
    />
  );
};

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth]   = useState<SystemHealth | null>(null);
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => { fetchHealthData(); }, []);

  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [healthRes, statsRes] = await Promise.all([
        apiClient.getSystemHealth(),
        apiClient.getPlatformStats(),
      ]);

      const healthData = healthRes.data;
      if (healthData) {
        const servicesArray: ServiceHealth[] = [];
        if (healthData.services) {
          Object.entries(healthData.services).forEach(([key, serviceData]: [string, any]) => {
            if (Array.isArray(serviceData)) {
              serviceData.forEach((service: any) => {
                servicesArray.push({
                  name: service.service || key,
                  status: service.status || 'unknown',
                  latency: service.responseTime ? parseInt(service.responseTime) : undefined,
                  message: service.error || service.message,
                  lastChecked: service.timestamp,
                });
              });
            } else {
              servicesArray.push({
                name: serviceData.service || key,
                status: serviceData.status || 'unknown',
                latency: serviceData.responseTime ? parseInt(serviceData.responseTime) : undefined,
                message: serviceData.error || serviceData.message,
                lastChecked: serviceData.timestamp,
              });
            }
          });
        }
        setHealth({
          overall: healthData.overall?.status || 'unknown',
          services: servicesArray,
          uptime: healthData.overall?.uptime,
          version: healthData.version,
        });
      }

      const statsData = statsRes.data;
      if (statsData) {
        setStats({
          totalBusinesses:  statsData.businesses?.total  || 0,
          activeBusinesses: statsData.businesses?.active || 0,
          totalBookings:    statsData.bookings?.total    || 0,
          todayBookings:    statsData.bookings?.recent   || 0,
          weeklyBookings:   statsData.bookings?.weekly   || 0,
          totalRevenue:     statsData.revenue?.total?.amount || 0,
        });
      }

      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch health data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

  if (isLoading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  const overallInfo = STATUS_COLORS[health?.overall as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.unknown;

  return (
    <div className="space-y-5">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: '#A8A6B0' }}>
            System
          </p>
          <h1 className="font-serif text-[28px] leading-tight" style={{ color: '#03031F', fontWeight: 400 }}>
            System Health
          </h1>
          <p className="text-[12px] mt-0.5" style={{ color: '#A8A6B0' }}>
            Last checked: {lastRefresh.toLocaleTimeString('en-IN')}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetchHealthData}
          isLoading={isLoading}
          leftIcon={<RefreshCw size={14} />}
        >
          Refresh
        </Button>
      </div>

      {/* Overall status banner */}
      {health && (
        <div
          className="flex items-center justify-between p-5 rounded-salex-lg border"
          style={{
            background: '#FFFFFF',
            borderColor: '#E5E4E3',
            boxShadow: '0 1px 3px rgba(3,3,31,0.05)',
          }}
        >
          <div className="flex items-center gap-3">
            <StatusDot status={health.overall} />
            <div>
              <p className="font-semibold text-[15px]" style={{ color: '#03031F' }}>System Status</p>
              <p className="text-[12px]" style={{ color: '#6F6D7A' }}>All services operational status</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge label={overallInfo.label} variant={overallInfo.badge === 'muted' ? 'default' : overallInfo.badge} dot />
            {health.version && <Badge label={`v${health.version}`} variant="default" />}
            {health.uptime && (
              <span className="font-mono text-[11px]" style={{ color: '#6F6D7A' }}>
                Uptime: <strong style={{ color: '#03031F' }}>{formatUptime(health.uptime)}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Platform stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Businesses',  value: stats.totalBusinesses,  color: '#03031F' },
            { label: 'Active Businesses', value: stats.activeBusinesses, color: '#12A36D' },
            { label: 'Total Bookings',    value: stats.totalBookings,    color: '#03031F' },
            { label: "Today's Bookings",  value: stats.todayBookings,    color: '#03031F' },
            { label: 'Weekly Bookings',   value: stats.weeklyBookings,   color: '#03031F' },
            { label: 'Total Revenue',     value: fmt(stats.totalRevenue), color: '#12A36D' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-salex-lg border p-4"
              style={{ borderColor: '#E5E4E3', boxShadow: '0 1px 3px rgba(3,3,31,0.05)' }}
            >
              <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#A8A6B0' }}>{s.label}</p>
              <p className="mt-1.5 font-bold text-[20px] leading-none" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Service health grid */}
      {health?.services && health.services.length > 0 && (
        <Card>
          <CardHeader title="Service Health" subtitle="Individual service status and latency" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {health.services.map((service, idx) => {
                const si = STATUS_COLORS[service.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.unknown;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-salex-md border"
                    style={{ background: '#FAFAF9', borderColor: '#E5E4E3' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusDot status={service.status} />
                        <span className="font-semibold text-[13px]" style={{ color: '#03031F' }}>{service.name}</span>
                      </div>
                      <Badge label={si.label} variant={si.badge === 'muted' ? 'default' : si.badge} size="sm" />
                    </div>
                    <p className="font-mono text-[11px]" style={{ color: '#A8A6B0' }}>
                      {service.latency ? `${service.latency}ms latency` : 'Latency N/A'}
                    </p>
                    {service.message && (
                      <p className="mt-1 text-[11px]" style={{ color: '#6F6D7A' }}>{service.message}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => window.location.href = '/audit-logs'}>View Audit Logs</Button>
            <Button variant="secondary" onClick={fetchHealthData} leftIcon={<RefreshCw size={14} />}>Force Health Check</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
