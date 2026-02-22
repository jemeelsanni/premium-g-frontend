/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/TransportDashboard.tsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Truck,
    Package,
    TrendingUp,
    DollarSign,
    Plus,
    ArrowRight,
    AlertCircle,
    ClipboardCheck,
    MapPin,
    Calendar,
} from 'lucide-react';
import { transportService } from '../../services/transportService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
// import { TransportOrder } from '../../types/transport';
import { useAuthStore } from '@/store/authStore';

type FilterType = 'all' | 'month' | 'range';

function getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
}

export const TransportDashboard: React.FC = () => {

    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TRANSPORT_ADMIN';

    const [filterType, setFilterType] = useState<FilterType>('month');
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');

    function buildDateParams() {
        if (filterType === 'all') return {};
        if (filterType === 'month') return getMonthRange();
        if (filterType === 'range' && rangeStart && rangeEnd) {
            return { startDate: rangeStart, endDate: rangeEnd };
        }
        return {};
    }

    const dateParams = buildDateParams();

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['transport-dashboard', filterType, rangeStart, rangeEnd],
        queryFn: () => transportService.getDashboardStats(dateParams),
    });

    const { data: recentOrders } = useQuery({
        queryKey: ['transport-orders', 1, 5],
        queryFn: () => transportService.getOrders({ page: 1, limit: 5 }),
    });

    const { data: pendingExpensesData } = useQuery({
        queryKey: ['transport-expenses-pending-count'],
        queryFn: () => transportService.getExpenses({
            page: 1,
            limit: 1,
            status: 'PENDING'
        }),
        enabled: isAdmin,
    });

    const pendingExpensesCount = pendingExpensesData?.data?.pagination?.total || 0;

    const { data: trucks } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks(),
    });

    // ✅ ADD DEBUG LOGGING
    useEffect(() => {
        if (stats) {
            console.log('📊 Transport Dashboard Stats:', stats);
            console.log('📊 Stats Data:', stats?.data);
        }
        if (recentOrders) {
            console.log('📦 Recent Orders:', recentOrders);
            console.log('📦 Recent Orders Data:', recentOrders?.data);
        }
    }, [stats, recentOrders]);

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
                    <p className="text-sm text-gray-500 mt-2">{String(error)}</p>
                </div>
            </div>
        );
    }

    // ✅ FIX: Extract data correctly from response
    const dashboardData = stats?.data || {};

    console.log('💰 Total Revenue:', dashboardData.totalRevenue);
    console.log('📈 Profit Margin:', dashboardData.profitMargin);

    const statCards = [
        {
            title: 'Active Trips',
            value: dashboardData.activeTrips || 0,
            icon: Truck,
            color: 'blue',
            change: '+15%'
        },
        {
            title: 'Total Revenue',
            value: `₦${(dashboardData.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'green',
            change: '+12%'
        },
        {
            title: 'Fleet Size',
            value: trucks?.length || 0,
            icon: Package,
            color: 'purple',
            change: '+2%'
        },
        {
            title: 'Profit Margin',
            // ✅ FIX: Show profit margin instead of monthly growth
            value: `${(dashboardData.profitMargin || 0).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'orange',
            change: '+3%'
        }
    ];

    // ✅ FIX: Map order columns with correct field names from schema
    const orderColumns = [
        {
            key: 'orderNumber',
            title: 'Order #',
            render: (value: string, record: any) => (
                <Link
                    to={`/transport/orders/${record.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {value}
                </Link>
            )
        },
        {
            key: 'name', // ✅ Changed from 'clientName' to 'name'
            title: 'Client',
            render: (value: string, record: any) => {
                // Handle both field names for backward compatibility
                const clientName = value || record.clientName || 'N/A';
                return <span>{clientName}</span>;
            }
        },
        {
            key: 'pickupLocation',
            title: 'Pickup',
            render: (value: string, record: any) => {
                const location = value || record.location?.name || record.location || 'N/A';
                return (
                    <div className="max-w-32 truncate" title={location}>
                        {location}
                    </div>
                );
            }
        },
        {
            key: 'deliveryLocation',
            title: 'Delivery Location',
            render: (value: string, record: any) => {
                const delivery = value || record.location?.name || 'N/A';
                return (
                    <div className="max-w-32 truncate" title={delivery}>
                        {delivery}
                    </div>
                );
            }
        },
        {
            key: 'totalOrderAmount',
            title: 'Amount',
            render: (value: number, record: any) => {
                const amount = value || record.amount || 0;
                return `₦${Number(amount).toLocaleString()}`;
            }
        },
        {
            key: 'deliveryStatus',
            title: 'Status',
            render: (value: string, record: any) => {
                const status = value || record.status || 'PENDING';
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {status.replace('_', ' ')}
                    </span>
                );
            }
        },
    ];

    // ✅ FIX: Process orders with correct field mappings
    const processedOrders = (recentOrders?.data?.orders || dashboardData.recentOrders || []).map((order: any) => {
        console.log('🔍 Processing order:', order);
        return {
            ...order,
            // Map both old and new field names
            name: order.name || order.clientName || 'Unknown Client',
            clientName: order.clientName || order.name || 'Unknown Client',
            pickupLocation: order.pickupLocation || '',
            deliveryLocation: order.location?.name || '',
            totalOrderAmount: Number(order.totalOrderAmount || order.amount || 0),
            deliveryStatus: order.deliveryStatus || order.status || 'PENDING'
        };
    });

    console.log('✅ Processed Orders:', processedOrders);

    // ✅ ADD: Show data status for debugging
    const hasData = dashboardData.totalRevenue > 0;
    const hasOrders = processedOrders.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transport Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage transport operations and track performance
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Filter controls */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${filterType === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setFilterType('month')}
                            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${filterType === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setFilterType('range')}
                            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${filterType === 'range' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            Date Range
                        </button>
                    </div>
                    <Link to="/transport/orders/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Transport Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Date range pickers */}
            {filterType === 'range' && (
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-sm text-gray-600">From</label>
                        <input
                            type="date"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-600">To</label>
                        <input
                            type="date"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            min={rangeStart}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {(!rangeStart || !rangeEnd) && (
                            <span className="text-xs text-amber-600">Select both dates to apply filter</span>
                        )}
                    </div>
                </div>
            )}

            {/* ✅ ADD: Data Status Alert */}
            {!hasData && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                No delivered transport orders found. Revenue will show as ₦0 until orders are marked as DELIVERED.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className="relative bg-white overflow-hidden shadow rounded-lg"
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 bg-${card.color}-500 rounded-md p-3`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {card.title}
                                            </dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">
                                                    {card.value}
                                                </div>
                                                {/* Remove the change indicator if there's no data */}
                                                {hasData && (
                                                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                                                        {card.change}
                                                    </div>
                                                )}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        to="/transport/orders/create"
                        className="relative group bg-blue-50 hover:bg-blue-100 rounded-lg p-6 transition-colors"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Plus className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="ml-3 text-sm font-medium text-gray-900">
                                        Create Order
                                    </p>
                                </div>
                                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                    <ArrowRight className="h-6 w-6" />
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/transport/trucks"
                        className="relative group bg-purple-50 hover:bg-purple-100 rounded-lg p-6 transition-colors"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                        <Truck className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="ml-3 text-sm font-medium text-gray-900">
                                        Manage Fleet
                                    </p>
                                </div>
                                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                    <ArrowRight className="h-6 w-6" />
                                </span>
                            </div>
                        </div>
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/transport/locations"
                            className="relative group bg-blue-50 hover:bg-blue-100 rounded-lg p-6 transition-colors"
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-blue-500 rounded-lg">
                                            <MapPin className="h-5 w-5 text-white" />
                                        </div>
                                        <p className="ml-3 text-sm font-medium text-gray-900">
                                            Manage Locations
                                        </p>
                                    </div>
                                    <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                        <ArrowRight className="h-6 w-6" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )}

                    <Link
                        to="/transport/expenses"
                        className="relative group bg-green-50 hover:bg-green-100 rounded-lg p-6 transition-colors"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="ml-3 text-sm font-medium text-gray-900">
                                        Track Expenses
                                    </p>
                                </div>
                                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                    <ArrowRight className="h-6 w-6" />
                                </span>
                            </div>
                        </div>
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/transport/expenses/approvals"
                            className="relative group bg-orange-50 hover:bg-orange-100 rounded-lg p-6 transition-colors"
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-orange-500 rounded-lg relative">
                                            <ClipboardCheck className="h-5 w-5 text-white" />
                                            {pendingExpensesCount > 0 && (
                                                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                                                    {pendingExpensesCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="ml-3 text-sm font-medium text-gray-900">
                                            {pendingExpensesCount > 0
                                                ? `${pendingExpensesCount} pending approval${pendingExpensesCount !== 1 ? 's' : ''}`
                                                : 'Review Expenses'}
                                        </p>
                                    </div>
                                    <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                        <ArrowRight className="h-6 w-6" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )}

                    <Link
                        to="/transport/cash-flow"
                        className="relative group bg-green-50 hover:bg-green-100 rounded-lg p-6 transition-colors"
                    >
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="ml-3 text-sm font-medium text-gray-900">
                                        View Cash Flow
                                    </p>
                                </div>
                                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                    <ArrowRight className="h-6 w-6" />
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Recent Transport Orders
                        </h3>
                        <Link
                            to="/transport/orders"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            View all orders
                        </Link>
                    </div>
                </div>
                <div className="p-6">
                    <Table
                        data={processedOrders}
                        columns={orderColumns}
                        loading={!recentOrders && !dashboardData.recentOrders}
                        emptyMessage={
                            hasOrders
                                ? "No recent orders found"
                                : "No transport orders yet. Create your first order to get started!"
                        }
                    />
                </div>
            </div>
        </div>
    );
};