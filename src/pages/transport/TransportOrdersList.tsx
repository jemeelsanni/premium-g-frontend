import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { transportApi, TransportFilters } from '../../api/transport.api';
import { Search, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react';
import { TransportOrder } from '../../types';

export const TransportOrdersList = () => {
    const [filters, setFilters] = useState<TransportFilters>({
        page: 1,
        limit: 20,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['transport-orders', filters],
        queryFn: () => transportApi.getOrders(filters),
    });

    // Fix: Properly extract orders array from response
    const orders: TransportOrder[] = Array.isArray(data?.data?.orders)
        ? data.data.orders
        : [];
    const pagination = data?.data?.pagination;

    const handleSearch = (search: string) => {
        setFilters({ ...filters, search, page: 1 });
    };

    const handleFilterChange = (key: keyof TransportFilters, value: string) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            IN_TRANSIT: 'bg-purple-100 text-purple-800',
            DELIVERED: 'bg-green-100 text-green-800',
            PARTIALLY_DELIVERED: 'bg-orange-100 text-orange-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transport Orders</h1>
                    <p className="text-gray-600 mt-1">View and manage all transport orders</p>
                </div>
                <Link
                    to="/transport/orders/create"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Order
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onChange={(e) => handleFilterChange('deliveryStatus', e.target.value)}
                        value={filters.deliveryStatus || ''}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        placeholder="End Date"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Profit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order: TransportOrder) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                                            {order.invoiceNumber && (
                                                <div className="text-xs text-gray-500">Invoice: {order.invoiceNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.location?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₦{order.totalOrderAmount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                ₦{order.netProfit?.toLocaleString() || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {/* Safe conversion for Decimal type */}
                                                {order.profitMargin ? Number(order.profitMargin).toFixed(2) : '0.00'}% margin
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(order.deliveryStatus)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                to={`/transport/orders/${order.id}`}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page! - 1) })}
                                disabled={filters.page === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page! + 1) })}
                                disabled={filters.page === pagination.totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{((filters.page! - 1) * filters.limit!) + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(filters.page! * filters.limit!, pagination.total)}
                                    </span>{' '}
                                    of <span className="font-medium">{pagination.total}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page! - 1) })}
                                        disabled={filters.page === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        Page {filters.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page! + 1) })}
                                        disabled={filters.page === pagination.totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};