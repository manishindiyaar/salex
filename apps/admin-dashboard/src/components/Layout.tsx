import React, { useState } from 'react';
import { Menu, X, LogOut, Home, Users, CreditCard, Settings, BarChart3, Activity, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Businesses', href: '/businesses' },
    { icon: CreditCard, label: 'Payments', href: '/payments' },
    { icon: Settings, label: 'Templates', href: '/templates' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Activity, label: 'System Health', href: '/system-health' },
    { icon: FileText, label: 'Audit Logs', href: '/audit-logs' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-salex-black">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-salex-black-light border-r border-salex-gray-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-salex-lg border-b border-salex-gray-border flex items-center justify-between">
          {sidebarOpen && <h1 className="text-salex-xl font-salex-bold text-salex-green">SALEX</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-salex-sm hover:bg-salex-black-lighter rounded-salex-md transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-salex-md space-y-salex-sm">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-salex-md px-salex-md py-salex-md rounded-salex-md transition-colors ${
                isActive(item.href)
                  ? 'bg-salex-green/10 text-salex-green'
                  : 'text-salex-secondary hover:bg-salex-black-lighter hover:text-salex-green'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-salex-sm font-salex-medium">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-salex-md border-t border-salex-gray-border space-y-salex-md">
          {sidebarOpen && (
            <div className="px-salex-md py-salex-sm bg-salex-black-lighter rounded-salex-md">
              <p className="text-salex-xs text-salex-secondary">Logged in as</p>
              <p className="text-salex-sm font-salex-bold text-salex-white truncate">{user?.email}</p>
              <p className="text-salex-xs text-salex-green">{user?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-salex-md px-salex-md py-salex-md rounded-salex-md hover:bg-salex-red hover:bg-opacity-20 transition-colors text-salex-secondary hover:text-salex-red"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-salex-sm font-salex-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-salex-black-light border-b border-salex-gray-border px-salex-xl py-salex-lg sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-salex-2xl font-salex-bold text-salex-white">Admin Dashboard</h2>
            <div className="flex items-center gap-salex-lg">
              <div className="text-right">
                <p className="text-salex-sm text-salex-secondary">Welcome back</p>
                <p className="text-salex-base font-salex-bold text-salex-white">{user?.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-salex-xl">{children}</div>
      </main>
    </div>
  );
};
