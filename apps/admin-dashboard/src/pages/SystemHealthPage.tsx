import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Badge, Button, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return <span className="text-salex-green text-lg">✓</span>;
    case 'degraded':
      return <span className="text-yellow-500 text-lg">⚠</span>;
    case 'down':
      return <span className="text-red-500 text-lg">✗</span>;
    default:
      return <span className="text-salex-secondary text-lg">?</span>;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy':
      return <Badge label="Healthy" variant="success" />;
    case 'degraded':
      return <Badge label="Degraded" variant="warning" />;
    case 'down':
      return <Badge label="Down" variant="error" />;
    default:
      return <Badge label="Unknown" variant="info" />;
  }
};

const getServiceIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('database') || lower.includes('postgres')) return <span className="text-salex-secondary text-lg">🗄️</span>;
  if (lower.includes('whatsapp')) return <span className="text-salex-secondary text-lg">💬</span>;
  if (lower.includes('supabase') || lower.includes('cloud')) return <span className="text-salex-secondary text-lg">☁️</span>;
  return <span className="text-salex-secondary text-lg">🖥️</span>;
};

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [healthRes, statsRes] = await Promise.all([
        apiClient.getSystemHealth(),
        apiClient.getPlatformStats(),
      ]);
      
      // Transform API response structure to match frontend expectations
      const healthData = healthRes.data;
      if (healthData) {
        // Convert services object to array format
        const servicesArray: ServiceHealth[] = [];
        if (healthData.services) {
          Object.entries(healthData.services).forEach(([key, serviceData]: [string, any]) => {
            if (Array.isArray(serviceData)) {
              // Handle array of services
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
              // Handle single service object
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
      
      // Transform stats response - extract platform stats from nested structure
      const statsData = statsRes.data;
      if (statsData) {
        setStats({
          totalBusinesses: statsData.businesses?.total || 0,
          activeBusinesses: statsData.businesses?.active || 0,
          totalBookings: statsData.bookings?.total || 0,
          todayBookings: statsData.bookings?.recent || 0,
          weeklyBookings: statsData.bookings?.weekly || 0,
          totalRevenue: statsData.revenue?.total?.amount || 0,
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
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  if (isLoading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <span className="text-salex-green text-2xl">⟳</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-salex-lg">
      {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-salex-2xl font-salex-bold text-salex-white">System Health</h1>
          <p className="text-salex-sm text-salex-secondary">
            Last checked: {lastRefresh.toLocaleTimeString('en-IN')}
          </p>
        </div>
        <Button variant="secondary" onClick={fetchHealthData} isLoading={isLoading}>
          <span className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}>⟳</span>
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      {health && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-salex-md">
                {getStatusIcon(health.overall)}
                <div>
                  <p className="text-salex-lg font-salex-bold text-salex-white">System Status</p>
                  <p className="text-salex-sm text-salex-secondary">All services operational status</p>
                </div>
              </div>
              <div className="flex items-center gap-salex-lg">
                {getStatusBadge(health.overall)}
                {health.version && (
                  <Badge label={`v${health.version}`} variant="info" />
                )}
              </div>
            </div>
            {health.uptime && (
              <div className="mt-salex-md pt-salex-md border-t border-salex-gray-border">
                <p className="text-salex-sm text-salex-secondary">
                  Uptime: <span className="text-salex-white font-salex-medium">{formatUptime(health.uptime)}</span>
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-salex-md">
          <Card>
            <CardBody>
              <p className="text-salex-xs text-salex-secondary">Total Businesses</p>
              <p className="text-salex-xl font-salex-bold text-salex-white">{stats.totalBusinesses || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-salex-xs text-salex-secondary">Active Businesses</p>
              <p className="text-salex-xl font-salex-bold text-salex-green">{stats.activeBusinesses || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-salex-xs text-salex-secondary">Total Bookings</p>
              <p className="text-salex-xl font-salex-bold text-salex-white">{stats.totalBookings || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-salex-xs text-salex-secondary">Today's Bookings</p>
              <p className="text-salex-xl font-salex-bold text-salex-white">{stats.todayBookings || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-salex-xs text-salex-secondary">Weekly Bookings</p>
              <p className="text-salex-xl font-salex-bold text-salex-white">{stats.weeklyBookings || 0}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-salex-xs text-salex-secondary">Total Revenue</p>
              <p className="text-salex-xl font-salex-bold text-salex-green">{formatCurrency(stats.totalRevenue)}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Service Health Grid */}
      {health?.services && health.services.length > 0 && (
        <Card>
          <CardHeader title="Service Health" subtitle="Individual service status" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-salex-md">
              {health.services.map((service, index) => (
                <div
                  key={index}
                  className="p-salex-md bg-salex-black-light rounded-salex-md border border-salex-gray-border"
                >
                  <div className="flex items-center justify-between mb-salex-sm">
                    <div className="flex items-center gap-salex-sm">
                      <span className="text-salex-secondary">{getServiceIcon(service.name)}</span>
                      <span className="text-salex-white font-salex-medium">{service.name}</span>
                    </div>
                    {getStatusIcon(service.status)}
                  </div>
                  <div className="flex items-center justify-between text-salex-xs">
                    <span className="text-salex-secondary">
                      {service.latency ? `${service.latency}ms` : 'N/A'}
                    </span>
                    {getStatusBadge(service.status)}
                  </div>
                  {service.message && (
                    <p className="text-salex-xs text-salex-secondary mt-salex-sm">{service.message}</p>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardBody>
          <div className="flex flex-wrap gap-salex-sm">
            <Button variant="secondary" onClick={() => window.location.href = '/audit-logs'}>
              View Audit Logs
            </Button>
            <Button variant="secondary" onClick={fetchHealthData}>
              Force Health Check
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
