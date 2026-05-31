import React, { useState } from 'react';
import {
  X, LogOut, Home, Users, CreditCard,
  Activity, FileText, GitBranch,
  ChevronRight, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../salex_logo_bg_remove.png';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: Home,          label: 'Dashboard',     href: '/' },
  { icon: Users,         label: 'Businesses',    href: '/businesses' },
  { icon: CreditCard,    label: 'Payments',      href: '/payments' },
  { icon: GitBranch,     label: 'Flows',         href: '/flows' },
  { icon: Activity,      label: 'System Health', href: '/system-health' },
  { icon: FileText,      label: 'Audit Logs',    href: '/audit-logs' },
];

const PAGE_TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/businesses':    'Businesses',
  '/payments':      'Payments',
  '/flows':         'Flows',
  '/system-health': 'System Health',
  '/audit-logs':    'Audit Logs',
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Compute page title
  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.startsWith('/businesses/') ? 'Business Detail' :
     location.pathname.startsWith('/flows/') ? 'Flow Editor' : 'Admin');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FCFCFA' }}>
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`${
          collapsed ? 'w-[68px]' : 'w-[220px]'
        } flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col`}
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E5E4E3',
        }}
      >
        {/* Logo zone */}
        <div
          className={`flex items-center h-[60px] px-4 border-b`}
          style={{ borderColor: '#E5E4E3' }}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors mx-auto"
              title="Expand sidebar"
            >
              <img src={logoImg} alt="Salex" className="w-7 h-7 object-contain" />
            </button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <img src={logoImg} alt="Salex" className="w-7 h-7 object-contain" />
                <span
                  className="font-sans font-bold tracking-tight text-base"
                  style={{ color: '#03031F' }}
                >
                  SALEX
                </span>
                <span
                  className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: '#F5F3F1', color: '#6F6D7A' }}
                >
                  Admin
                </span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-50 transition-colors"
                style={{ color: '#A8A6B0' }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {/* Section label */}
          {!collapsed && (
            <p
              className="section-label px-3 pb-2"
              style={{ color: '#C9C7CF' }}
            >
              Navigation
            </p>
          )}

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                }}
                title={collapsed ? item.label : undefined}
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-salex-md transition-all duration-150 ${
                  active ? 'active' : ''
                }`}
                style={{
                  background: active ? '#F5F3F1' : 'transparent',
                  color: active ? '#03031F' : '#6F6D7A',
                  fontWeight: active ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                <item.icon
                  size={16}
                  className="flex-shrink-0"
                  style={{ color: active ? '#03031F' : '#A8A6B0' }}
                />
                {!collapsed && (
                  <span className="text-salex-sm font-sans truncate">{item.label}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div
          className="px-2 py-4 border-t space-y-1"
          style={{ borderColor: '#E5E4E3' }}
        >
          {!collapsed && user && (
            <div className="px-3 py-2.5 rounded-salex-md mb-1" style={{ background: '#F5F3F1' }}>
              <p
                className="font-mono text-[9px] uppercase tracking-widest"
                style={{ color: '#A8A6B0' }}
              >
                Logged in as
              </p>
              <p
                className="text-salex-sm font-semibold truncate mt-0.5"
                style={{ color: '#03031F' }}
              >
                {user?.name || user?.email}
              </p>
              <p
                className="font-mono text-[9px] uppercase tracking-wide mt-0.5"
                style={{ color: '#12A36D' }}
              >
                {user?.role}
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-salex-md transition-colors hover:bg-red-50 group"
          >
            <LogOut size={16} className="flex-shrink-0 group-hover:text-red-500 transition-colors" style={{ color: '#A8A6B0' }} />
            {!collapsed && (
              <span className="text-salex-sm font-sans group-hover:text-red-500 transition-colors" style={{ color: '#6F6D7A' }}>
                Sign out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between h-[60px] px-6"
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E4E3',
          }}
        >
          {/* Page title */}
          <div className="flex items-center gap-2" style={{ color: '#A8A6B0' }}>
            <span className="text-salex-xs font-mono uppercase tracking-widest">Admin</span>
            <ChevronRight size={12} />
            <span
              className="text-salex-sm font-semibold"
              style={{ color: '#03031F' }}
            >
              {pageTitle}
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-salex-md hover:bg-gray-50 transition-colors relative"
              style={{ color: '#A8A6B0' }}
            >
              <Bell size={16} />
            </button>

            {/* Avatar / user chip */}
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-salex-lg"
              style={{ background: '#F5F3F1' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: '#03031F', color: '#FFFFFF' }}
              >
                {(user?.name || user?.email || 'A')[0].toUpperCase()}
              </div>
              <span className="text-salex-sm font-medium hidden sm:block" style={{ color: '#03031F' }}>
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
