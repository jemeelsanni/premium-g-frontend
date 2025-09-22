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
    BarChart3
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
        // Explicitly use UserRole to satisfy TypeScript
        const allRoles = [
            'SUPER_ADMIN',
            'DISTRIBUTION_ADMIN',
            'DISTRIBUTION_SALES_REP',
            'TRANSPORT_ADMIN',
            'TRANSPORT_STAFF',
            'WAREHOUSE_ADMIN',
            'WAREHOUSE_SALES_OFFICER',
            'CASHIER'
        ] as UserRole[];
        const items = [
            {
                name: 'Dashboard',
                href: '/dashboard',
                icon: LayoutDashboard,
                roles: allRoles,
            },
        ];

        // Distribution Module
        if (user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role)) {
            items.push({
                name: 'Distribution',
                href: '/distribution',
                icon: Package,
                roles: [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP],
            });
        }

        // Transport Module
        if (user?.role && [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.TRANSPORT_STAFF].includes(user.role)) {
            items.push({
                name: 'Transport',
                href: '/transport',
                icon: Truck,
                roles: [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.TRANSPORT_STAFF],
            });
        }

        // Warehouse Module
        if (user?.role && [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER, UserRole.CASHIER].includes(user.role)) {
            items.push({
                name: 'Warehouse',
                href: '/warehouse',
                icon: Warehouse,
                roles: [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER, UserRole.CASHIER],
            });
        }

        // Targets & Performance
        if (user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN].includes(user.role)) {
            items.push({
                name: 'Targets',
                href: '/targets',
                icon: Target,
                roles: [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN],
            });
        }

        // Expenses
        if (user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.WAREHOUSE_ADMIN].includes(user.role)) {
            items.push({
                name: 'Expenses',
                href: '/expenses',
                icon: DollarSign,
                roles: [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.WAREHOUSE_ADMIN],
            });
        }

        // Analytics
        if (user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.WAREHOUSE_ADMIN].includes(user.role)) {
            items.push({
                name: 'Analytics',
                href: '/analytics',
                icon: BarChart3,
                roles: [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.WAREHOUSE_ADMIN],
            });
        }

        // Admin Module
        if (user?.role === UserRole.SUPER_ADMIN) {
            items.push({
                name: 'Admin',
                href: '/admin',
                icon: Settings,
                roles: [UserRole.SUPER_ADMIN],
            });
        }

        return items;
    };

    const navigationItems = getNavigationItems();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-4 border-b">
                        <h1 className="text-xl font-bold text-indigo-600">Premium G</h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {navigationItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                  `}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t p-4">
                        <div className="flex items-center mb-3">
                            <div className="flex-shrink-0">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                                <p className="text-xs text-gray-500">{user?.role.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex h-16 bg-white border-b shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="px-4 text-gray-500 lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center justify-between flex-1 px-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {navigationItems.find(item => location.pathname.startsWith(item.href))?.name || 'Dashboard'}
                        </h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">{user?.email}</span>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};