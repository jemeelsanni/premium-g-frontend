// src/App.tsx - Updated with complete module routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

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

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

// src/components/layout/DashboardLayout.tsx - Updated with complete navigation
import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  Package,
  Truck,
  Warehouse,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Target,
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart,
  FileText
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: [
          UserRole.SUPER_ADMIN,
          UserRole.DISTRIBUTION_ADMIN,
          UserRole.DISTRIBUTION_SALES_REP,
          UserRole.TRANSPORT_ADMIN,
          UserRole.TRANSPORT_STAFF,
          UserRole.WAREHOUSE_ADMIN,
          UserRole.WAREHOUSE_SALES_OFFICER,
          UserRole.CASHIER
        ],
      },
    ];

    // Distribution Module Navigation
    if (user?.role && [
      UserRole.SUPER_ADMIN,
      UserRole.DISTRIBUTION_ADMIN,
      UserRole.DISTRIBUTION_SALES_REP
    ].includes(user.role)) {
      items.push(
        {
          name: 'Distribution',
          href: '/distribution',
          icon: Package,
          roles: [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP],
          children: [
            { name: 'Dashboard', href: '/distribution/dashboard' },
            { name: 'Orders', href: '/distribution/orders' },
            { name: 'Customers', href: '/distribution/customers' },
            { name: 'Targets', href: '/distribution/targets' },
            { name: 'Analytics', href: '/distribution/analytics' }
          ]
        }
      );
    }

    // Transport Module Navigation
    if (user?.role && [
      UserRole.SUPER_ADMIN,
      UserRole.TRANSPORT_ADMIN,
      UserRole.TRANSPORT_STAFF
    ].includes(user.role)) {
      items.push(
        {
          name: 'Transport',
          href: '/transport',
          icon: Truck,
          roles: [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.TRANSPORT_STAFF],
          children: [
            { name: 'Dashboard', href: '/transport/dashboard' },
            { name: 'Orders', href: '/transport/orders' },
            { name: 'Fleet', href: '/transport/trucks' },
            { name: 'Expenses', href: '/transport/expenses' },
            { name: 'Analytics', href: '/transport/analytics' }
          ]
        }
      );
    }

    // Warehouse Module Navigation
    if (user?.role && [
      UserRole.SUPER_ADMIN,
      UserRole.WAREHOUSE_ADMIN,
      UserRole.WAREHOUSE_SALES_OFFICER,
      UserRole.CASHIER
    ].includes(user.role)) {
      items.push(
        {
          name: 'Warehouse',
          href: '/warehouse',
          icon: Warehouse,
          roles: [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER, UserRole.CASHIER],
          children: [
            { name: 'Dashboard', href: '/warehouse/dashboard' },
            { name: 'Sales', href: '/warehouse/sales' },
            { name: 'Inventory', href: '/warehouse/inventory' },
            { name: 'Customers', href: '/warehouse/customers' },
            { name: 'Discounts', href: '/warehouse/discounts' },
            { name: 'Cash Flow', href: '/warehouse/cash-flow' }
          ]
        }
      );
    }

    return items.filter(item =>
      item.roles.includes(user?.role as UserRole)
    );
  };

  const navigation = getNavigationItems();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl">
          <Sidebar navigation={navigation} isActive={isActive} onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <Sidebar navigation={navigation} isActive={isActive} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-3 text-2xl font-bold text-gray-900 lg:ml-0">
                  Premium G Enterprise
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar Component
interface SidebarProps {
  navigation: any[];
  isActive: (href: string) => boolean;
  onClose?: () => void;
}

const Sidebar = ({ navigation, isActive, onClose }: SidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Package className="h-8 w-8 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">Premium G</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpanded(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${expandedItems.includes(item.href) ? 'rotate-90' : ''
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {expandedItems.includes(item.href) && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children.map((child: any) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${isActive(child.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        onClick={onClose}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};