import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Layout Components
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Unauthorized } from './pages/auth/Unauthorized';

// Module Routes
import { DistributionRoutes } from './pages/distribution/DistributionRoutes';
import { TransportRoutes } from './pages/transport/TransportRoutes';
import { WarehouseRoutes } from './pages/warehouse/WarehouseRoutes';

import { AdminRoutes } from './pages/admin/AdminRoutes';


// Dashboard
import { MainDashboard } from './pages/dashboard/MainDashboard';

// Store
import { useAuthStore } from './store/authStore';
import { UserRole } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MainDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Distribution Module Routes */}
          <Route
            path="/distribution/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.SUPER_ADMIN,
                  UserRole.DISTRIBUTION_ADMIN,
                  UserRole.DISTRIBUTION_SALES_REP
                ]}
              >
                <DashboardLayout>
                  <DistributionRoutes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Transport Module Routes */}
          <Route
            path="/transport/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.SUPER_ADMIN,
                  UserRole.TRANSPORT_ADMIN,
                  UserRole.TRANSPORT_STAFF
                ]}
              >
                <DashboardLayout>
                  <TransportRoutes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Warehouse Module Routes */}
          <Route
            path="/warehouse/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.SUPER_ADMIN,
                  UserRole.WAREHOUSE_ADMIN,
                  UserRole.WAREHOUSE_SALES_OFFICER,
                  UserRole.CASHIER
                ]}
              >
                <DashboardLayout>
                  <WarehouseRoutes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.SUPER_ADMIN]}
              >
                <DashboardLayout>
                  <AdminRoutes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Targets & Admin Routes */}
          <Route
            path="/targets"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.SUPER_ADMIN,
                  UserRole.DISTRIBUTION_ADMIN
                ]}
              >
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Targets & Performance</h1>
                    <p className="text-gray-600 mt-2">Coming soon...</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* React Hot Toast component for notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10B981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;