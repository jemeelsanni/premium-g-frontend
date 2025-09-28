/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/DistributionDashboard.tsx
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
    AlertCircle
} from 'lucide-react';
import { distributionApi } from '../../api/distribution.api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
// FIXED: Import from correct location
import { DistributionOrder } from '../../types'; // This should be from types/index.ts

export const DistributionDashboard: React.FC = () => {
    const { data: statsResponse, isLoading, error } = useQuery({
        queryKey: ['distribution-dashboard'],
        queryFn: () => distributionApi.getDashboardStats(),
    });

    const { data: recentOrdersResponse } = useQuery({
        queryKey: ['distribution-orders'],
        queryFn: () => distributionApi.getOrders({ limit: 5 }),
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

    // Extract data from ApiResponse wrapper
    const stats = statsResponse?.success ? statsResponse.data : null;
    const recentOrders = recentOrdersResponse?.data || [];

    const statCards = [
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: Package,
            color: 'blue',
            change: '+12%'
        },
        {
            title: 'Total Revenue',
            value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'green',
            change: '+8%'
        },
        {
            title: 'Top Customers',
            value: stats?.topCustomers?.length || 0,
            icon: Users,
            color: 'purple',
            change: '+5%'
        },
        {
            title: 'Monthly Progress',
            value: `${stats?.monthlyProgress || 0}%`,
            icon: TrendingUp,
            color: 'orange',
            change: `+${stats?.weeklyProgress || 0}%`
        }
    ];

    // FIXED: Update column keys to match the correct DistributionOrder type
    const orderColumns = [
        {
            key: 'orderNo', // Changed from 'orderNumber' to 'orderNo'
            title: 'Order #',
            render: (value: string, record: DistributionOrder) => (
                <Link
                    to={`/distribution/orders/${record.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {value || `ORD-${record.id.slice(-6)}`} {/* Fallback if orderNo is null */}
                </Link>
            )
        },
        {
            key: 'customer',
            title: 'Customer',
            render: (value: any) => value?.name || 'N/A'
        },
        {
            key: 'totalAmount', // Changed from 'finalAmount' to 'totalAmount'
            title: 'Amount',
            render: (value: number) => `₦${value?.toLocaleString() || 0}`
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value === 'DELIVERED' ? 'bg-green-100 text-green-800' :
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
                    <Link to="/distribution/customers">
                        <Button variant="outline">
                            Manage Customers
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

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                            to="/targets"
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
                        data={recentOrders}
                        columns={orderColumns}
                        loading={!recentOrdersResponse}
                        emptyMessage="No recent orders found"
                    />
                </div>
            </div>
        </div>
    );
};