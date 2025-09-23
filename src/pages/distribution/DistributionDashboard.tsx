import { useQuery } from '@tanstack/react-query';
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { distributionApi } from '../../api/distribution.api';
import { Link } from 'react-router-dom';

interface StatusCount {
    status: string;
    _count: {
        status: number;
    };
}

interface TopCustomer {
    customerId: string;
    customer?: {
        name: string;
    };
    _count: {
        customerId: number;
    };
    _sum?: {
        finalAmount: number;
    };
}

interface AnalyticsData {
    totalOrders?: number;
    totalRevenue?: number;
    statusDistribution?: StatusCount[];
    topCustomers?: TopCustomer[];
}

export const DistributionDashboard = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['distribution-analytics'],
        queryFn: () => distributionApi.getAnalytics(),
    });

    // Safely extract analytics data
    const analyticsData: AnalyticsData = data?.data || {};
    const statusDistribution = Array.isArray(analyticsData.statusDistribution)
        ? analyticsData.statusDistribution
        : [];
    const topCustomers = Array.isArray(analyticsData.topCustomers)
        ? analyticsData.topCustomers
        : [];

    const stats = [
        {
            title: 'Total Orders',
            value: String(analyticsData.totalOrders || 0),
            icon: Package,
            color: 'bg-blue-500',
        },
        {
            title: 'Total Revenue',
            value: `₦${Number(analyticsData.totalRevenue || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-green-500',
        },
        {
            title: 'Pending Orders',
            value: String(statusDistribution.find((s) => s.status === 'PENDING')?._count?.status || 0),
            icon: Clock,
            color: 'bg-yellow-500',
        },
        {
            title: 'Completed Orders',
            value: String(statusDistribution.find((s) => s.status === 'DELIVERED')?._count?.status || 0),
            icon: CheckCircle,
            color: 'bg-indigo-500',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error loading dashboard data</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Distribution Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage and track distribution orders</p>
                </div>
                <Link
                    to="/distribution/orders/create"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Create New Order
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/distribution/orders"
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    >
                        <h3 className="font-medium text-gray-900">View All Orders</h3>
                        <p className="text-sm text-gray-600 mt-1">Browse and manage orders</p>
                    </Link>
                    <Link
                        to="/distribution/orders/create"
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    >
                        <h3 className="font-medium text-gray-900">Create Order</h3>
                        <p className="text-sm text-gray-600 mt-1">Add a new distribution order</p>
                    </Link>
                    <Link
                        to="/distribution/analytics"
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                    >
                        <h3 className="font-medium text-gray-900">Analytics</h3>
                        <p className="text-sm text-gray-600 mt-1">View detailed reports</p>
                    </Link>
                </div>
            </div>

            {/* Top Customers */}
            {topCustomers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h2>
                    <div className="space-y-3">
                        {topCustomers.slice(0, 5).map((customer) => (
                            <div key={customer.customerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {customer.customer?.name || 'Unknown Customer'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {customer._count?.customerId || 0} orders
                                    </p>
                                </div>
                                <p className="text-lg font-semibold text-indigo-600">
                                    ₦{Number(customer._sum?.finalAmount || 0).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};