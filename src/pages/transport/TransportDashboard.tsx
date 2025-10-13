import React from 'react';
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
} from 'lucide-react';
import { transportService } from '../../services/transportService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { TransportOrder } from '../../types/transport';
import { useAuthStore } from '@/store/authStore';

export const TransportDashboard: React.FC = () => {

    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TRANSPORT_ADMIN';


    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['transport-dashboard'],
        queryFn: () => transportService.getDashboardStats(),
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
        enabled: isAdmin, // Only fetch for admins
    });

    const pendingExpensesCount = pendingExpensesData?.data?.pagination?.total || 0;


    const { data: trucks } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks(),
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

    const statCards = [
        {
            title: 'Active Trips',
            value: stats?.data?.activeTrips || 0,
            icon: Truck,
            color: 'blue',
            change: '+15%'
        },
        {
            title: 'Total Revenue',
            value: `₦${(stats?.data?.totalRevenue || 0).toLocaleString()}`,
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
            title: 'Monthly Growth',
            value: `${stats?.monthlyGrowth || 0}%`,
            icon: TrendingUp,
            color: 'orange',
            change: '+3%'
        }
    ];

    const orderColumns = [
        {
            key: 'orderNumber',
            title: 'Order #',
            render: (value: string, record: TransportOrder) => (
                <Link
                    to={`/transport/orders/${record.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    {value}
                </Link>
            )
        },
        {
            key: 'clientName',
            title: 'Client',
        },
        {
            key: 'pickupLocation',
            title: 'Pickup',
            render: (value: string) => (
                <div className="max-w-32 truncate" title={value}>
                    {value}
                </div>
            )
        },
        {
            key: 'deliveryLocation',
            title: 'Delivery',
            render: (value: string) => (
                <div className="max-w-32 truncate" title={value}>
                    {value}
                </div>
            )
        },
        {
            key: 'totalOrderAmount',
            title: 'Amount',
            render: (value: number) => `₦${value.toLocaleString()}`
        },
        {
            key: 'deliveryStatus',
            title: 'Status',
            render: (value: string) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    value === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                        value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {value}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Transport Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your fleet operations and logistics
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Link to="/transport/orders/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            New Transport Order
                        </Button>
                    </Link>
                    <Link to="/transport/trucks">
                        <Button variant="outline">
                            Manage Fleet
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
                            to="/transport/orders/create"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                    <Package className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Create Transport Order
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Start a new logistics and transport operation
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/transport/trucks"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                                    <Truck className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Manage Fleet
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Add and manage your truck fleet
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        <Link
                            to="/transport/orders"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-100">
                                    <TrendingUp className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    View All Orders
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Track and manage all transport orders
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        {/* After the "View Orders" Link, add this: */}

                        <Link
                            to="/transport/expenses/create"
                            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                            <div>
                                <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-600 group-hover:bg-orange-100">
                                    <DollarSign className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Create Expense
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Record trip or non-trip expenses
                                </p>
                            </div>
                            <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                <ArrowRight className="h-6 w-6" />
                            </span>
                        </Link>

                        {isAdmin && (
                            <Link
                                to="/transport/expenses/approvals"
                                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 group-hover:bg-green-100">
                                        <ClipboardCheck className="h-6 w-6" />
                                    </span>
                                    {pendingExpensesCount > 0 && (
                                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                            {pendingExpensesCount}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Expense Approvals
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {pendingExpensesCount > 0
                                            ? `${pendingExpensesCount} pending approval${pendingExpensesCount !== 1 ? 's' : ''}`
                                            : 'Review and approve expenses'}
                                    </p>
                                </div>
                                <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                                    <ArrowRight className="h-6 w-6" />
                                </span>
                            </Link>
                        )}
                    </div>
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
                        data={recentOrders?.data?.orders || []}  // ✅ Access orders array
                        columns={orderColumns}
                        loading={!recentOrders}
                        emptyMessage="No recent orders found"
                    />
                </div>
            </div>
        </div>
    );
};