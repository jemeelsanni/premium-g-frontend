import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/auth/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { DistributionRoutes } from './pages/distribution/DistributionRoutes';
import { TransportRoutes } from './pages/transport/TransportRoutes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
      <p className="text-xl text-gray-600">Access Denied</p>
      <p className="text-sm text-gray-500 mt-2">You don't have permission to access this resource.</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

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
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Warehouse Module</h2>
                    <p className="text-gray-600 mt-2">Coming Soon</p>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;