import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './pages/auth/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { DistributionRoutes } from './pages/distribution/DistributionRoutes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
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

          {/* Distribution Routes */}
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

          {/* Transport Routes */}
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
                  <div>Transport Module - Coming Soon</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Warehouse Routes */}
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
                  <div>Warehouse Module - Coming Soon</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <DashboardLayout>
                  <div>Admin Module - Coming Soon</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<div className="p-8">404 - Page not found</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;