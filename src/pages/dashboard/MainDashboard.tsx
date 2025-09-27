/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { StatsCard } from '../../components/StatsCard';
import {
    Package,
    Truck,
    Warehouse,
    DollarSign,
    Users,
    ShoppingCart,
    Target
} from 'lucide-react';

export const MainDashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching stats
        const fetchStats = async () => {
            try {
                // This would normally be an API call
                setStats({
                    totalRevenue: 2450000,
                    totalOrders: 156,
                    activeCustomers: 89,
                    completedDeliveries: 142,
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getWelcomeMessage = () => {
        const role = user?.role;
        switch (role) {
            case UserRole.DISTRIBUTION_ADMIN:
            case UserRole.DISTRIBUTION_SALES_REP:
                return "Manage distribution orders and track your sales targets.";
            case UserRole.TRANSPORT_ADMIN:
            case UserRole.TRANSPORT_STAFF:
                return "Oversee transport operations and fleet management.";
            case UserRole.WAREHOUSE_ADMIN:
            case UserRole.WAREHOUSE_SALES_OFFICER:
            case UserRole.CASHIER:
                return "Handle warehouse operations and direct sales.";
            case UserRole.SUPER_ADMIN:
                return "Full system access - monitor all business operations.";
            default:
                return "Welcome to Premium G Enterprise Management System.";
        }
    };

    const getModuleLinks = () => {
        const role = user?.role;
        const links = [];

        if ([UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(role as UserRole)) {
            links.push({
                name: 'Distribution',
                href: '/distribution',
                description: 'Manage B2B orders and track sales targets',
                icon: Package,
                color: 'blue'
            });
        }

        if ([UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.TRANSPORT_STAFF].includes(role as UserRole)) {
            links.push({
                name: 'Transport',
                href: '/transport',
                description: 'Fleet management and trip operations',
                icon: Truck,
                color: 'green'
            });
        }

        if ([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER, UserRole.CASHIER].includes(role as UserRole)) {
            links.push({
                name: 'Warehouse',
                href: '/warehouse',
                description: 'Inventory and direct sales management',
                icon: Warehouse,
                color: 'purple'
            });
        }

        return links;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Welcome back, {user?.username}!
                </h1>
                <p className="mt-2 max-w-4xl text-sm text-gray-500">
                    {getWelcomeMessage()}
                </p>
            </div>

            {/* Overview Stats */}
            {user?.role === UserRole.SUPER_ADMIN && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Revenue"
                        value={`₦${stats?.totalRevenue?.toLocaleString() || '0'}`}
                        icon={DollarSign}
                        color="green"
                    />
                    <StatsCard
                        title="Total Orders"
                        value={stats?.totalOrders || 0}
                        icon={ShoppingCart}
                        color="blue"
                    />
                    <StatsCard
                        title="Active Customers"
                        value={stats?.activeCustomers || 0}
                        icon={Users}
                        color="purple"
                    />
                    <StatsCard
                        title="Completed Deliveries"
                        value={stats?.completedDeliveries || 0}
                        icon={Target}
                        color="yellow"
                    />
                </div>
            )}

            {/* Module Access Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {getModuleLinks().map((module) => (
                    <a
                        key={module.name}
                        href={module.href}
                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                        <div>
                            <span className={`rounded-lg inline-flex p-3 ring-4 ring-white ${module.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                                module.color === 'green' ? 'bg-green-50 text-green-700' :
                                    'bg-purple-50 text-purple-700'
                                }`}>
                                <module.icon className="h-6 w-6" />
                            </span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-lg font-medium">
                                <span className="absolute inset-0" aria-hidden="true" />
                                {module.name}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {module.description}
                            </p>
                        </div>
                        <span
                            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
                            aria-hidden="true"
                        >
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="m11.293 17.293 1.414 1.414L19.414 12l-6.707-6.707-1.414 1.414L15.586 11H6v2h9.586l-4.293 4.293z" />
                            </svg>
                        </span>
                    </a>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {getModuleLinks().map((module) => (
                        <a
                            key={`${module.name}-action`}
                            href={`${module.href}/dashboard`}
                            className="flex items-center p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <module.icon className="h-5 w-5 mr-3 text-gray-400" />
                            {module.name} Dashboard
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};