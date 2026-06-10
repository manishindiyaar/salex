import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components';
import {
  LoginPage,
  DashboardPage,
  BusinessesPage,
  BusinessDetailPage,
  PaymentsPage,
  AnalyticsPage,
  SystemHealthPage,
  AuditLogPage,
} from '@/pages';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#FCFCFA' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  const { fetchMe } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Prevent double fetch in StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    fetchMe().finally(() => setInitialized(true));
  }, []);

  // Show loading until initial auth check is done
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#FCFCFA' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <p
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: '#C9C7CF', fontFamily: '"Space Mono", monospace' }}
          >
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/businesses"
          element={
            <ProtectedRoute>
              <BusinessesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/businesses/:id"
          element={
            <ProtectedRoute>
              <BusinessDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-health"
          element={
            <ProtectedRoute>
              <SystemHealthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
