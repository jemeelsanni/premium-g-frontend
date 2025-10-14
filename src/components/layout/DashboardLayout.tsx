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
    // Target,
    // DollarSign,
    // BarChart3
} from 'lucide-react';

interface DashboardLayoutProps {
    children: ReactNode;
}

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: UserRole[];
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

    // Helper function to check if user has access to navigation item
    const hasAccess = (roles: UserRole[]): boolean => {
        return user?.role ? roles.includes(user.role) : false;
    };

    // Navigation items configuration
    const navigationItems: NavigationItem[] = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            roles: Object.values(UserRole), // All roles have access to dashboard
        },
        {
            name: 'Distribution',
            href: '/distribution',
            icon: Package,
            roles: [
                UserRole.SUPER_ADMIN,
                UserRole.DISTRIBUTION_ADMIN,
                UserRole.DISTRIBUTION_SALES_REP
            ],
        },
        {
            name: 'Transport',
            href: '/transport',
            icon: Truck,
            roles: [
                UserRole.SUPER_ADMIN,
                UserRole.TRANSPORT_ADMIN,
                UserRole.TRANSPORT_STAFF
            ],
        },
        // {
        //     name: 'Trucks',
        //     href: '/transport/trucks',
        //     icon: Truck,
        //     roles: [
        //         UserRole.SUPER_ADMIN,
        //         UserRole.TRANSPORT_ADMIN
        //     ],
        // },
        {
            name: 'Warehouse',
            href: '/warehouse',
            icon: Warehouse,
            roles: [
                UserRole.SUPER_ADMIN,
                UserRole.WAREHOUSE_ADMIN,
                UserRole.WAREHOUSE_SALES_OFFICER,
                UserRole.CASHIER
            ],
        },
        // {
        //     name: 'Targets',
        //     href: '/targets',
        //     icon: Target,
        //     roles: [
        //         UserRole.SUPER_ADMIN,
        //         UserRole.DISTRIBUTION_ADMIN
        //     ],
        // },
        // {
        //     name: 'Expenses',
        //     href: '/expenses',
        //     icon: DollarSign,
        //     roles: [
        //         UserRole.SUPER_ADMIN,
        //         UserRole.DISTRIBUTION_ADMIN,
        //         UserRole.TRANSPORT_ADMIN,
        //         UserRole.WAREHOUSE_ADMIN
        //     ],
        // },
        // {
        //     name: 'Analytics',
        //     href: '/analytics',
        //     icon: BarChart3,
        //     roles: [
        //         UserRole.SUPER_ADMIN,
        //         UserRole.DISTRIBUTION_ADMIN,
        //         UserRole.TRANSPORT_ADMIN,
        //         UserRole.WAREHOUSE_ADMIN
        //     ],
        // },
        {
            name: 'Admin',
            href: '/admin',
            icon: Settings,
            roles: [UserRole.SUPER_ADMIN],
        },
    ];

    // Filter navigation items based on user role
    const accessibleNavItems = navigationItems.filter(item => hasAccess(item.roles));

    // Format role name for display
    const formatRoleName = (role: UserRole): string => {
        return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get current page name
    const getCurrentPageName = (): string => {
        const currentItem = accessibleNavItems.find(item =>
            location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
        );
        return currentItem?.name || 'Dashboard';
    };

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
                        <Link to="/dashboard" className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">Premium G</h1>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
                            aria-label="Close sidebar"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {accessibleNavItems.map((item) => {
                            const isActive = location.pathname === item.href ||
                                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`
                                        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                                        ${isActive
                                            ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'
                                            }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="border-t p-4">
                        <div className="flex items-center mb-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-indigo-600" />
                                </div>
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {user?.username}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.role ? formatRoleName(user.role) : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
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
                        className="px-4 text-gray-500 hover:text-gray-700 lg:hidden"
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center justify-between flex-1 px-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {getCurrentPageName()}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Welcome back, {user?.username}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:block">
                                <span className="text-sm text-gray-500">{user?.email}</span>
                            </div>
                            <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-indigo-600" />
                            </div>
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