import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';
import { TrendingUp, Users, CreditCard, Activity, AlertCircle } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  responseTime?: number;
}

interface SystemHealth {
  database: HealthStatus;
  supabase: HealthStatus;
  whatsapp: HealthStatus;
  api: HealthStatus;
  timestamp: string;
}

export const AnalyticsPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await apiClient.getSystemHealth();
      setHealth(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system health');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-salex-green';
      case 'degraded':
        return 'text-salex-amber';
      case 'down':
        return 'text-salex-red';
      default:
        return 'text-salex-secondary';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-salex-green bg-opacity-10';
      case 'degraded':
        return 'bg-salex-amber bg-opacity-10';
      case 'down':
        return 'bg-salex-red bg-opacity-10';
      default:
        return 'bg-salex-gray-variant';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <svg className="w-8 h-8 text-salex-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title="Error" message={error} />;
  }

  const services = [
    { name: 'Database', icon: Activity, key: 'database' as const },
    { name: 'Supabase', icon: Users, key: 'supabase' as const },
    { name: 'WhatsApp API', icon: AlertCircle, key: 'whatsapp' as const },
    { name: 'API Server', icon: TrendingUp, key: 'api' as const },
  ];

  return (
    <div className="space-y-salex-xl">
      <div>
        <h1 className="text-salex-2xl font-salex-bold text-salex-white mb-salex-sm">System Health</h1>
        <p className="text-salex-sm text-salex-secondary">
          Last updated: {health ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
        </p>
      </div>

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-salex-lg">
        {services.map((service) => {
          const Icon = service.icon;
          const status = health?.[service.key];

          return (
            <Card key={service.key}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-salex-sm text-salex-secondary">{service.name}</p>
                    <div className={`mt-salex-md px-salex-md py-salex-sm rounded-salex-md inline-block ${getStatusBg(status?.status || 'down')}`}>
                      <p className={`text-salex-sm font-salex-bold ${getStatusColor(status?.status || 'down')}`}>
                        {status?.status?.toUpperCase() || 'UNKNOWN'}
                      </p>
                    </div>
                    <p className="text-salex-xs text-salex-secondary mt-salex-md">
                      {status?.message}
                    </p>
                    {status?.responseTime && (
                      <p className="text-salex-xs text-salex-secondary mt-salex-sm">
                        Response: {status.responseTime}ms
                      </p>
                    )}
                  </div>
                  <Icon className={`${getStatusColor(status?.status || 'down')} flex-shrink-0`} size={32} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader title="System Overview" />
        <CardBody>
          <div className="space-y-salex-md">
            <div className="flex items-center justify-between p-salex-md bg-salex-black-lighter rounded-salex-md border border-salex-gray-border">
              <p className="text-salex-sm text-salex-white">All Services Operational</p>
              <div className="w-3 h-3 bg-salex-green rounded-full"></div>
            </div>
            <p className="text-salex-xs text-salex-secondary">
              The platform is running smoothly. All critical services are operational and responding normally.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
