import React, { useEffect, useState } from 'react';
import { StatCard, Card, CardHeader, CardBody, Alert, Badge } from '@/components';
import { apiClient } from '@/services/apiClient';
import { Users, CreditCard, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

function formatINR(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000)   return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.getPlatformStats();
        setStats(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p
            className="font-mono text-[10px] uppercase tracking-widest animate-pulse-soft"
            style={{ color: '#A8A6B0' }}
          >
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title="Error loading dashboard" message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="font-mono text-[10px] uppercase tracking-widest mb-1"
            style={{ color: '#A8A6B0' }}
          >
            Overview
          </p>
          <h1
            className="font-serif text-[30px] leading-tight"
            style={{ color: '#03031F', fontWeight: 400 }}
          >
            Platform Dashboard
          </h1>
        </div>
        <p className="text-[12px]" style={{ color: '#A8A6B0' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <div className="animate-fade-in">
          <StatCard
            label="Total Businesses"
            value={stats?.businesses?.total ?? 0}
            subtext={`${stats?.businesses?.active ?? 0} active · ${stats?.businesses?.inactive ?? 0} inactive`}
            icon={<Users size={18} />}
            accentColor="#12A36D"
          />
        </div>
        <div className="animate-fade-in">
          <StatCard
            label="Total Revenue"
            value={formatINR(stats?.revenue?.total?.amount ?? 0)}
            subtext={`${stats?.revenue?.total?.payments ?? 0} payments`}
            icon={<CreditCard size={18} />}
            accentColor="#0088CC"
          />
        </div>
        <div className="animate-fade-in">
          <StatCard
            label="Total Bookings"
            value={(stats?.bookings?.total ?? 0).toLocaleString()}
            subtext={`${stats?.bookings?.weekly ?? 0} this week`}
            icon={<Calendar size={18} />}
            accentColor="#9C7A4A"
          />
        </div>
        <div className="animate-fade-in">
          <StatCard
            label="Weekly Revenue"
            value={formatINR(stats?.revenue?.weekly?.amount ?? 0)}
            subtext={`${stats?.revenue?.weekly?.payments ?? 0} payments this week`}
            icon={<TrendingUp size={18} />}
            accentColor="#C62020"
          />
        </div>
      </div>

      {/* ── Body Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Signups — wider */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader
              title="Recent Business Signups"
              subtitle="Newest businesses on the platform"
              action={
                <button
                  onClick={() => navigate('/businesses')}
                  className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                  style={{ color: '#12A36D' }}
                >
                  View all <ArrowRight size={12} />
                </button>
              }
            />
            <CardBody noPadding>
              {stats?.recentActivity?.recentBusinesses?.length ? (
                <div>
                  {stats.recentActivity.recentBusinesses.map((biz, idx) => (
                    <div
                      key={biz.id}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer"
                      style={{
                        borderBottom: idx < (stats.recentActivity.recentBusinesses.length - 1)
                          ? '1px solid #F0EFEE'
                          : undefined,
                      }}
                      onClick={() => navigate(`/businesses/${biz.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAF9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div
                          className="w-8 h-8 rounded-salex-md flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                          style={{ background: '#F5F3F1', color: '#03031F' }}
                        >
                          {biz.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[13px]" style={{ color: '#03031F' }}>
                            {biz.name}
                          </p>
                          <p className="text-[11px]" style={{ color: '#A8A6B0' }}>
                            New signup
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge label="New" variant="success" dot />
                        <span className="text-[11px] font-mono" style={{ color: '#A8A6B0' }}>
                          {timeAgo(biz.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="font-serif text-[18px]" style={{ color: '#C9C7CF' }}>
                    No recent signups
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Quick stats — narrower */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue breakdown */}
          <Card>
            <CardHeader title="Revenue Breakdown" />
            <CardBody>
              <div className="space-y-4">
                {[
                  { label: 'Today',     amount: stats?.revenue?.recent?.amount ?? 0,  color: '#12A36D' },
                  { label: 'This week', amount: stats?.revenue?.weekly?.amount ?? 0,  color: '#0088CC' },
                  { label: 'All time',  amount: stats?.revenue?.total?.amount ?? 0,   color: '#03031F' },
                ].map((r) => {
                  const max = stats?.revenue?.total?.amount ?? 1;
                  const pct = Math.round((r.amount / max) * 100);
                  return (
                    <div key={r.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12px]" style={{ color: '#6F6D7A' }}>{r.label}</span>
                        <span className="font-mono text-[12px] font-bold" style={{ color: '#03031F' }}>
                          {formatINR(r.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#F5F3F1' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: r.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody>
              <div className="space-y-2">
                {[
                  { label: 'View all businesses', href: '/businesses', color: '#12A36D' },
                  { label: 'Payment records',     href: '/payments',   color: '#0088CC' },
                  { label: 'System health',       href: '/system-health', color: '#9C7A4A' },
                  { label: 'Audit logs',          href: '/audit-logs', color: '#C62020' },
                ].map((a) => (
                  <button
                    key={a.href}
                    onClick={() => navigate(a.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-salex-md transition-colors text-left"
                    style={{ background: '#F5F3F1' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#EEEDEC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F3F1')}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: a.color }}
                      />
                      <span className="text-[13px] font-medium" style={{ color: '#03031F' }}>
                        {a.label}
                      </span>
                    </div>
                    <ArrowRight size={12} style={{ color: '#A8A6B0' }} />
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
