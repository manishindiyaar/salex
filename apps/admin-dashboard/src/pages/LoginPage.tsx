import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Alert } from '@/components';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import logoImg from '../salex_logo_bg_remove.png';

export const LoginPage: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!email)    newErrors.email    = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    try {
      await login(email, password);
      navigate('/');
    } catch (_) {
      // error state handled by store
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#FCFCFA' }}
    >
      {/* ── Left Panel — Brand ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 px-12 py-16"
        style={{ background: '#03031F' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Salex" className="w-8 h-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="font-sans font-bold text-white tracking-tight text-lg">SALEX</span>
        </div>

        {/* Brand copy */}
        <div className="space-y-5">
          <h1
            className="font-serif text-[38px] leading-[1.1] text-white"
            style={{ fontWeight: 400 }}
          >
            Manage every salon,<br />
            <em style={{ color: '#12A36D' }}>everywhere.</em>
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            The admin command centre for Salex's platform of salon businesses.
          </p>

          {/* Decorative stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Active salons',   value: '—' },
              { label: 'Monthly revenue', value: '—' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-salex-md px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {s.label}
                </p>
                <p
                  className="mt-1 font-sans font-bold text-[22px] text-white leading-none"
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2025 SALEX · ADMIN PORTAL
        </p>
      </div>

      {/* ── Right Panel — Login Form ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src={logoImg} alt="Salex" className="w-7 h-7 object-contain" />
            <span className="font-sans font-bold text-[#03031F] tracking-tight">SALEX</span>
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ml-1"
              style={{ background: '#F5F3F1', color: '#6F6D7A' }}
            >
              Admin
            </span>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h2
              className="font-serif text-[32px] leading-tight"
              style={{ color: '#03031F', fontWeight: 400 }}
            >
              Welcome back
            </h2>
            <p className="mt-1.5 text-[14px]" style={{ color: '#A8A6B0' }}>
              Sign in to your admin account
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <Alert
              type="error"
              title="Authentication failed"
              message={error}
              className="mb-6"
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              id="admin-email"
              placeholder="admin@salex.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
              leftIcon={<Mail size={15} />}
            />

            <Input
              label="Password"
              type="password"
              id="admin-password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
              leftIcon={<Lock size={15} />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              rightIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};
