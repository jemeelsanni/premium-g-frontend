/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Package,
    Users,
    TrendingUp,
    DollarSign,
    Plus,
    ArrowRight,
    AlertCircle,
    Target,
    Calendar
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';

export const DistributionDashboard: React.FC = () => {
    const { data: statsResponse, isLoading, error } = useQuery({
        queryKey: ['distribution-dashboard'],
        queryFn: () => distributionService.getDashboardStats(),
    });

    const { data: recentOrdersResponse } = useQuery({
        queryKey: ['distribution-orders-recent'],
        queryFn: () => distributionService.getOrders({ page: 1, limit: 5 }),
    });

    // ✅ NEW: Fetch current month's target performance
    const { data: targetData } = useQuery({
        queryKey: ['current-target'],
        queryFn: () => distributionService.getCurrentTarget(),
        retry: 1, // Don't retry too much if no target is set
    });

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

    const stats = statsResponse?.data || {};
    const recentOrders = recentOrdersResponse?.data?.orders || [];

    // Extract target summary
    const targetSummary = targetData?.summary;
    const weeklyPerformances = targetData?.target?.weeklyPerformances || [];

    const statCards = [
        {
            title: 'Total Revenue',
            value: `₦${(stats.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'blue',
            change: '+12.5%'
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders || 0,
            icon: Package,
            color: 'green',
            change: '+8.2%'
        },
        {
            title: 'Total Packs',
            value: (stats.totalPacks || 0).toLocaleString(),
            icon: TrendingUp,
            color: 'purple',
            change: '+15.3%'
        },
        {
            title: 'Active Customers',
            value: stats.activeCustomers || 0,
            icon: Users,
            color: 'orange',
            change: '+3.1%'
        }
    ];

    const orderColumns = [
        { key: 'orderNumber', title: 'Order #' },
        { key: 'customerName', title: 'Customer' },
        {
            key: 'totalAmount',
            title: 'Amount',
            render: (value: number) => `₦${value?.toLocaleString() || '0'}`
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${value === 'COMPLETED' || value === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        value === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                            value === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                    }`}>
                    {value}
                </span>
            )
        },
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => new Date(value).toLocaleDateString()
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Distribution Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your B2B distribution operations and track performance
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Link to="/distribution/orders/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <stat.icon className={`h-8 w-8 text-${stat.color}-600`} />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {stat.title}
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {stat.value}
                                            </div>
                                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                                {stat.change}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ✅ NEW: Monthly Target Performance Card */}
            {targetSummary && (
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Target className="h-6 w-6 text-indigo-600" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Monthly Target Performance
                                </h3>
                            </div>
                            <Link
                                to="/distribution/targets"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View All Targets
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        {/* Overall Progress */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    Overall Progress
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {targetSummary.percentageAchieved.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full ${targetSummary.percentageAchieved >= 100 ? 'bg-green-600' :
                                            targetSummary.percentageAchieved >= 75 ? 'bg-blue-600' :
                                                targetSummary.percentageAchieved >= 50 ? 'bg-yellow-600' :
                                                    'bg-red-600'
                                        }`}
                                    style={{ width: `${Math.min(targetSummary.percentageAchieved, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-2 text-sm text-gray-600">
                                <span>{targetSummary.totalActual.toLocaleString()} packs sold</span>
                                <span>{targetSummary.totalTarget.toLocaleString()} target</span>
                            </div>
                        </div>

                        {/* Weekly Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {weeklyPerformances.map((week: any) => (
                                <div key={week.weekNumber} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            Week {week.weekNumber}
                                        </span>
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {week.actualPacks.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            of {week.targetPacks.toLocaleString()}
                                        </div>
                                        <div className={`text-sm font-semibold ${week.percentageAchieved >= 100 ? 'text-green-600' :
                                                week.percentageAchieved >= 75 ? 'text-blue-600' :
                                                    'text-yellow-600'
                                            }`}>
                                            {week.percentageAchieved.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Quick Actions
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Link
                            to="/distribution/orders/create"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                    <Package className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Create New Order
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Start a new distribution order for your customers
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/distribution/customers"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                                    <Users className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Manage Customers
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    View and manage your customer database
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/distribution/targets"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                                    <TrendingUp className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    View Targets
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Track monthly targets and performance
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Orders
                        </h3>
                        <Link
                            to="/distribution/orders"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            View all orders
                        </Link>
                    </div>
                </div>
                <div className="p-6">
                    <Table
                        data={Array.isArray(recentOrders) ? recentOrders : []}
                        columns={orderColumns}
                        loading={!recentOrdersResponse}
                        emptyMessage="No recent orders found"
                    />
                </div>
            </div>
        </div>
    );
};