import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Alert } from '@/components';
import { apiClient } from '@/services/apiClient';

interface Stats {
  businesses: {
    total: number;
    active: number;
    inactive: number;
    recentSignups: number;
  };
  bookings: {
    total: number;
    recent: number;
    weekly: number;
  };
  revenue: {
    total: { amount: number; payments: number };
    recent: { amount: number; payments: number };
    weekly: { amount: number; payments: number };
  };
  customers: {
    total: number;
    recent: number;
    weekly: number;
  };
  recentActivity: {
    recentBusinesses: Array<{ id: string; name: string; createdAt: string }>;
    recentBookings: Array<{ id: string; business: { name: string }; createdAt: string }>;
    recentPayments: Array<{ id: string; amount: number; createdAt: string }>;
  };
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.getPlatformStats();
        // API returns { success, data: { businesses, bookings, revenue, ... } }
        setStats(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  const statCards = [
    {
      icon: '👥',
      label: 'Total Businesses',
      value: stats?.businesses?.total || 0,
      subtext: `${stats?.businesses?.active || 0} active`,
      color: 'text-salex-green',
    },
    {
      icon: '💳',
      label: 'Total Revenue',
      value: `₹${(stats?.revenue?.total?.amount || 0).toLocaleString()}`,
      subtext: 'All time',
      color: 'text-salex-blue',
    },
    {
      icon: '📅',
      label: 'Total Bookings',
      value: stats?.bookings?.total || 0,
      subtext: 'Across all businesses',
      color: 'text-salex-amber',
    },
  ];

  return (
    <div className="space-y-salex-xl">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-salex-lg">
        {statCards.map((stat, idx) => {
          return (
            <Card key={idx}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-salex-sm text-salex-secondary">{stat.label}</p>
                    <p className="text-salex-2xl font-salex-bold text-salex-white mt-salex-md">
                      {stat.value}
                    </p>
                    <p className="text-salex-xs text-salex-secondary mt-salex-sm">{stat.subtext}</p>
                  </div>
                  <span className={`${stat.color} flex-shrink-0 text-2xl`}>{stat.icon}</span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader
          title="Recent Activity"
          subtitle="Latest admin actions and business updates"
        />
        <CardBody>
          {stats?.recentActivity?.recentBusinesses && stats.recentActivity.recentBusinesses.length > 0 ? (
            <div className="space-y-salex-md">
              {stats.recentActivity.recentBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-salex-md bg-salex-black-lighter rounded-salex-md border border-salex-gray-border"
                >
                  <div>
                    <p className="text-salex-sm font-salex-medium text-salex-white">
                      {business.name}
                    </p>
                    <p className="text-salex-xs text-salex-secondary mt-salex-sm">
                      New business registered
                    </p>
                  </div>
                  <p className="text-salex-xs text-salex-secondary">
                    {new Date(business.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-salex-sm text-salex-secondary text-center py-salex-lg">
              No recent activity
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
