import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Alert } from '@/components';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    if (!password) setErrors((prev) => ({ ...prev, password: 'Password is required' }));

    if (!email || !password) return;

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen bg-salex-black flex items-center justify-center p-salex-lg">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-salex-xl">
          <h1 className="text-salex-2xl font-salex-bold text-salex-green mb-salex-sm">SALEX</h1>
          <p className="text-salex-base text-salex-secondary">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-salex-black-light border border-salex-gray-border rounded-salex-lg p-salex-xl">
          <h2 className="text-salex-xl font-salex-bold text-salex-white mb-salex-lg">Login</h2>

          {error && (
            <Alert
              type="error"
              title="Login Failed"
              message={error}
              className="mb-salex-lg"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-salex-lg">
            <Input
              label="Email"
              type="email"
              placeholder="admin@salex.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <p className="text-salex-sm text-salex-secondary text-center mt-salex-lg">
            Demo credentials available in .env
          </p>
        </div>
      </div>
    </div>
  );
};
