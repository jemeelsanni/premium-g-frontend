/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Users,
    Package,
    MapPin,
    Activity,
    Settings,
    DollarSign,
    ShoppingCart,
    Truck,
    Warehouse,
    AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

export const AdminDashboard: React.FC = () => {
    const { data: statsData, isLoading, error } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () => adminService.getSystemStats(),
    });

    const stats = statsData?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Failed to load dashboard data</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.systemStats?.totalUsers || 0,
            icon: Users,
            color: 'blue',
            link: '/admin/users',
        },
        {
            title: 'Distribution Orders',
            value: stats?.systemStats?.totalDistributionOrders || 0,
            icon: ShoppingCart,
            color: 'green',
            link: '/distribution',
        },
        {
            title: 'Transport Orders',
            value: stats?.systemStats?.totalTransportOrders || 0,
            icon: Truck,
            color: 'purple',
            link: '/transport',
        },
        {
            title: 'Warehouse Sales',
            value: stats?.systemStats?.totalWarehouseSales || 0,
            icon: Warehouse,
            color: 'orange',
            link: '/warehouse',
        },
    ];

    const revenueCards = [
        {
            title: 'Distribution Revenue',
            value: formatCurrency(stats?.businessStats?.distributionRevenue || 0),
            color: 'green',
        },
        {
            title: 'Transport Revenue',
            value: formatCurrency(stats?.businessStats?.transportRevenue || 0),
            color: 'purple',
        },
        {
            title: 'Warehouse Revenue',
            value: formatCurrency(stats?.businessStats?.warehouseRevenue || 0),
            color: 'orange',
        },
        {
            title: 'Total Revenue',
            value: formatCurrency(stats?.businessStats?.totalRevenue || 0),
            color: 'blue',
        },
    ];

    const quickActions = [
        {
            title: 'Manage Users',
            description: 'Create and manage system users',
            icon: Users,
            link: '/admin/users',
            color: 'blue',
        },
        {
            title: 'Manage Products',
            description: 'Add and update product catalog',
            icon: Package,
            link: '/admin/products',
            color: 'green',
        },
        {
            title: 'Manage Locations',
            description: 'Configure delivery locations',
            icon: MapPin,
            link: '/admin/locations',
            color: 'purple',
        },
        {
            title: 'View Audit Trail',
            description: 'System activity and logs',
            icon: Activity,
            link: '/admin/audit',
            color: 'orange',
        },
        {
            title: 'System Config',
            description: 'Configure system settings',
            icon: Settings,
            link: '/admin/config',
            color: 'red',
        },
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600',
            red: 'bg-red-50 text-red-600',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-2 text-sm text-gray-600">
                    System overview and management
                </p>
            </div>

            {/* System Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.title}
                                to={card.link}
                                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 rounded-md p-3 ${getColorClasses(card.color)}`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    {card.title}
                                                </dt>
                                                <dd className="text-2xl font-bold text-gray-900">
                                                    {card.value}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Revenue Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue Overview
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {revenueCards.map((card) => (
                        <div
                            key={card.title}
                            className="bg-white overflow-hidden shadow rounded-lg"
                        >
                            <div className="p-5">
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    {card.title}
                                </dt>
                                <dd className={`mt-1 text-2xl font-bold ${card.color === 'blue' ? 'text-blue-600' :
                                    card.color === 'green' ? 'text-green-600' :
                                        card.color === 'purple' ? 'text-purple-600' :
                                            'text-orange-600'
                                    }`}>
                                    {card.value}
                                </dd>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Distribution */}
            {stats?.userStats && stats.userStats.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Users by Role
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stats.userStats.map((roleStat: any) => (
                            <div
                                key={roleStat.role}
                                className="border border-gray-200 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">
                                        {roleStat.role.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {roleStat._count.role}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.title}
                                to={action.link}
                                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className={`inline-flex rounded-md p-3 ${getColorClasses(action.color)}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                                        {action.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {action.description}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            {stats?.recentActivity && stats.recentActivity.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Activity className="h-5 w-5 mr-2" />
                            Recent System Activity
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {stats.recentActivity.slice(0, 10).map((activity: any) => (
                            <div key={activity.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.user?.username || 'System'} - {activity.action} {activity.entity}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${activity.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                        activity.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                            activity.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {activity.action}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200">
                        <Link
                            to="/admin/audit"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            View all activity →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};