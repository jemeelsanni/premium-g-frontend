/* eslint-disable @typescript-eslint/no-unused-vars */
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

    const { data: targetData } = useQuery({
        queryKey: ['current-target'],
        queryFn: () => distributionService.getCurrentTarget(),
        retry: 1,
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

    // ✅ FIXED: Extract data correctly from nested response structure
    // Backend returns: { success: true, data: { totalRevenue, totalOrders, totalPacks, activeCustomers, recentOrders, ... } }
    // After BaseApiService processes it, we get: { data: { totalRevenue, totalOrders, ... } }
    const stats = statsResponse?.data || statsResponse || {};
    const recentOrders = (stats.recentOrders || recentOrdersResponse?.data?.orders || []).map((order: any) => ({
        ...order,
        amount: typeof order.amount === 'number' ? order.amount : parseFloat(order.amount || 0),
        createdAt: order.createdAt || new Date().toISOString()
    }));

    console.log('Dashboard Frontend DEBUG:', {
        statsResponse,
        stats,
        recentOrders,
        sampleOrder: recentOrders[0]
    });

    const targetSummary = targetData?.summary;

    const statCards = [
        {
            title: 'Total Revenue',
            value: `₦${(stats.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'blue',
            change: '+12.5%',
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders || 0,
            icon: Package,
            color: 'green',
            change: '+8.2%',
        },
        {
            title: 'Total Packs',
            value: (stats.totalPacks || 0).toLocaleString(),
            icon: TrendingUp,
            color: 'purple',
            change: '+15.3%',
        },
        {
            title: 'Active Customers',
            value: stats.activeCustomers || 0,
            icon: Users,
            color: 'orange',
            change: '+3.1%',
        },
    ];

    const orderColumns = [
        { key: 'orderNumber', title: 'ORDER #' },
        { key: 'customer', title: 'CUSTOMER' },
        {
            key: 'amount',
            title: 'AMOUNT',
            render: (row: any) => {
                const amount = typeof row.amount === 'number' ? row.amount : parseFloat(row.amount || 0);
                return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        },
        { key: 'status', title: 'STATUS' },
        {
            key: 'createdAt',
            title: 'DATE',
            render: (row: any) => {
                try {
                    const date = new Date(row.createdAt);
                    if (isNaN(date.getTime())) {
                        return 'Invalid Date';
                    }
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    return 'Invalid Date';
                }
            }
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Distribution Dashboard</h1>
                    <p className="text-gray-600">Manage your B2B distribution operations and track performance</p>
                </div>
                <Link to="/distribution/orders/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                    <div key={card.title} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                                <p className="text-sm text-green-600 mt-1">{card.change}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-${card.color}-50`}>
                                <card.icon className={`h-6 w-6 text-${card.color}-600`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Target Performance */}
            {targetSummary && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <Target className="h-5 w-5 mr-2" />
                            Monthly Target Performance
                        </h2>
                        <Link to="/distribution/targets">
                            <Button variant="outline" size="sm">
                                View Details
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Target</p>
                            <p className="text-xl font-bold">{targetSummary.totalTarget.toLocaleString()} packs</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Actual</p>
                            <p className="text-xl font-bold">{targetSummary.totalActual.toLocaleString()} packs</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Achievement</p>
                            <p className="text-xl font-bold">{targetSummary.percentageAchieved.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Remaining</p>
                            <p className="text-xl font-bold">{targetSummary.remainingTarget.toLocaleString()} packs</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/distribution/orders/create" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold mb-1">Create New Order</h3>
                            <p className="text-sm text-gray-600 mb-3">Start a new distribution order for your customers</p>
                            <div className="flex items-center text-blue-600 text-sm font-medium">
                                Get Started <ArrowRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/distribution/customers" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold mb-1">Manage Customers</h3>
                            <p className="text-sm text-gray-600 mb-3">View and manage your customer database</p>
                            <div className="flex items-center text-purple-600 text-sm font-medium">
                                View All <ArrowRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </Link>

                <Link to="/distribution/targets" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold mb-1">View Targets</h3>
                            <p className="text-sm text-gray-600 mb-3">Track monthly targets and performance</p>
                            <div className="flex items-center text-green-600 text-sm font-medium">
                                View Details <ArrowRight className="h-4 w-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Recent Orders</h2>
                        <Link to="/distribution/orders">
                            <Button variant="outline" size="sm">
                                View all orders
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="p-6">
                    {recentOrders && recentOrders.length > 0 ? (
                        <Table columns={orderColumns} data={recentOrders} />
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No recent orders found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};