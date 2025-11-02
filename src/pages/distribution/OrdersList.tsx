/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/OrdersListEnhanced.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, X, Eye, Download, FileText } from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import { ExportOptionsModal, ExportOptions } from '../../components/distribution/ExportOptionsModal';


export const OrdersList: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Get filters from URL
    const paymentStatusFilter = searchParams.get('paymentStatus') || '';
    const riteFoodsStatusFilter = searchParams.get('riteFoodsStatus') || '';
    const deliveryStatusFilter = searchParams.get('deliveryStatus') || '';
    const orderStatusFilter = searchParams.get('status') || '';

    const pageSize = 10;

    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['distribution-orders', currentPage, pageSize, searchTerm, paymentStatusFilter, riteFoodsStatusFilter, deliveryStatusFilter, orderStatusFilter],
        queryFn: () => distributionService.getOrders({
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            paymentStatus: paymentStatusFilter || undefined,
            riteFoodsStatus: riteFoodsStatusFilter || undefined,
            deliveryStatus: deliveryStatusFilter || undefined,
            status: orderStatusFilter || undefined,
        }),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleFilterChange = (filterType: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(filterType, value);
        } else {
            newParams.delete(filterType);
        }
        setSearchParams(newParams);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchParams(new URLSearchParams());
        setSearchTerm('');
        setCurrentPage(1);
    };

    const hasActiveFilters = paymentStatusFilter || riteFoodsStatusFilter || deliveryStatusFilter || orderStatusFilter || searchTerm;

    const handleExport = async (options: ExportOptions) => {
        setIsExporting(true);

        try {
            let url = '/api/v1/distribution/orders/export/pdf?';

            // Build query parameters based on export type
            if (options.type === 'duration') {
                url += `startDate=${options.startDate}&endDate=${options.endDate}`;
            } else if (options.type === 'count') {
                url += `limit=${options.count}`;
            } else if (options.type === 'all') {
                url += `all=true`;
            }

            // Get token for authorization
            const token = localStorage.getItem('token');

            // Fetch the PDF
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Create blob from response
            const blob = await response.blob();

            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            let filename = `distribution-orders-${timestamp}`;

            if (options.type === 'duration') {
                filename = `orders-${options.startDate}-to-${options.endDate}.pdf`;
            } else if (options.type === 'count') {
                filename = `orders-last-${options.count}.pdf`;
            } else {
                filename = `orders-all-${timestamp}.pdf`;
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Orders exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export orders');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { class: string; label: string }> = {
            // Payment Status
            PENDING: { class: 'bg-orange-100 text-orange-800', label: 'Pending Payment' },
            PARTIAL: { class: 'bg-yellow-100 text-yellow-800', label: 'Partial Payment' },
            CONFIRMED: { class: 'bg-green-100 text-green-800', label: 'Payment Confirmed' },

            // Rite Foods Status
            NOT_SENT: { class: 'bg-gray-100 text-gray-800', label: 'Not Sent' },
            PAYMENT_SENT: { class: 'bg-blue-100 text-blue-800', label: 'Payment Sent' },
            ORDER_RAISED: { class: 'bg-purple-100 text-purple-800', label: 'Order Raised' },
            PROCESSING: { class: 'bg-purple-100 text-purple-800', label: 'Processing' },
            LOADED: { class: 'bg-indigo-100 text-indigo-800', label: 'Loaded' },
            DISPATCHED: { class: 'bg-indigo-100 text-indigo-800', label: 'Dispatched' },

            // Delivery Status
            IN_TRANSIT: { class: 'bg-blue-100 text-blue-800', label: 'In Transit' },
            FULLY_DELIVERED: { class: 'bg-green-100 text-green-800', label: 'Delivered' },
            PARTIALLY_DELIVERED: { class: 'bg-yellow-100 text-yellow-800', label: 'Partial Delivery' },
            FAILED: { class: 'bg-red-100 text-red-800', label: 'Failed' },

            // Order Status
            PAYMENT_CONFIRMED: { class: 'bg-green-100 text-green-800', label: 'Payment OK' },
            SENT_TO_RITE_FOODS: { class: 'bg-purple-100 text-purple-800', label: 'At Rite Foods' },
            PROCESSING_BY_RFL: { class: 'bg-purple-100 text-purple-800', label: 'Processing' },
            DELIVERED: { class: 'bg-green-100 text-green-800', label: 'Delivered' },
            CANCELLED: { class: 'bg-red-100 text-red-800', label: 'Cancelled' },
        };

        const config = configs[status] || { class: 'bg-gray-100 text-gray-800', label: status };
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
                {config.label}
            </span>
        );
    };



    const orderColumns = [
        {
            key: 'orderNumber',
            title: 'Order #',
            render: (value: string | null, record: any) => {
                // Handle null orderNumber - use ID as fallback
                const displayNumber = value || `ORD-${record.id?.slice(-8) || 'N/A'}`;

                return (
                    <Link
                        to={`/distribution/orders/${record.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                        {displayNumber}
                    </Link>
                );
            }
        },
        {
            key: 'customer',
            title: 'Customer',
            render: (value: any) => (
                <div>
                    <div className="font-medium text-gray-900">{value?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{value?.territory || ''}</div>
                </div>
            )
        },
        {
            key: 'location',
            title: 'Location',
            render: (value: any) => value?.name || 'N/A'
        },
        {
            key: 'finalAmount',
            title: 'Amount',
            render: (value: number) => (
                <span className="font-semibold">₦{value?.toLocaleString() || '0'}</span>
            )
        },
        {
            key: 'paymentStatus',
            title: 'Payment',
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'riteFoodsStatus',
            title: 'Rite Foods',
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'deliveryStatus',
            title: 'Delivery',
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'createdAt',
            title: 'Created',
            render: (value: any, record: any) => {
                // Use record.createdAt instead of value
                console.log('Date value:', value, 'Record createdAt:', record.createdAt);
                return formatDate(record.createdAt);
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (record: any) => (
                <Link to={`/distribution/orders/${record.id}`}>
                    <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                </Link>
            )
        }
    ];

    const Pagination = () => {
        const pagination = ordersData?.data?.pagination;
        if (!pagination) return null;

        const { page, totalPages } = pagination;

        return (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => setCurrentPage(page - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        disabled={page >= totalPages}
                        onClick={() => setCurrentPage(page + 1)}
                    >
                        Next
                    </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{page}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <Button
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setCurrentPage(page - 1)}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2"
                            >
                                Previous
                            </Button>
                            {[...Array(Math.min(5, totalPages))].map((_, idx) => (
                                <Button
                                    key={idx}
                                    variant={page === idx + 1 ? "primary" : "outline"}
                                    onClick={() => setCurrentPage(idx + 1)}
                                    className="relative inline-flex items-center px-4 py-2"
                                >
                                    {idx + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                disabled={page >= totalPages}
                                onClick={() => setCurrentPage(page + 1)}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2"
                            >
                                Next
                            </Button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Failed to load orders</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Distribution Orders
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage and track all distribution orders through workflow stages
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <Link to="/distribution/orders/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            New Order
                        </Button>
                    </Link>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => {/* CSV export logic */ }}
                        className="flex items-center"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>

                    {/* Export PDF Button */}
                    <Button
                        onClick={() => setShowExportModal(true)}
                        disabled={isExporting}
                        className="flex items-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export PDF'}
                    </Button>

                </div>
            </div>

            {/* Active Filters Bar */}
            {hasActiveFilters && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-medium text-blue-900">Active Filters:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Search: {searchTerm}
                                    <button onClick={() => handleSearch('')} className="ml-2 hover:text-blue-900">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {paymentStatusFilter && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Payment: {paymentStatusFilter}
                                    <button onClick={() => handleFilterChange('paymentStatus', '')} className="ml-2 hover:text-blue-900">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {riteFoodsStatusFilter && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Rite Foods: {riteFoodsStatusFilter}
                                    <button onClick={() => handleFilterChange('riteFoodsStatus', '')} className="ml-2 hover:text-blue-900">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {deliveryStatusFilter && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Delivery: {deliveryStatusFilter}
                                    <button onClick={() => handleFilterChange('deliveryStatus', '')} className="ml-2 hover:text-blue-900">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            Clear All
                        </Button>
                    </div>
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Orders</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Status
                            </label>
                            <select
                                value={paymentStatusFilter}
                                onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Payments</option>
                                <option value="PENDING">Pending</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="CONFIRMED">Confirmed</option>
                            </select>
                        </div>

                        {/* Rite Foods Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rite Foods Status
                            </label>
                            <select
                                value={riteFoodsStatusFilter}
                                onChange={(e) => handleFilterChange('riteFoodsStatus', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="NOT_SENT">Not Sent</option>
                                <option value="PAYMENT_SENT">Payment Sent</option>
                                <option value="ORDER_RAISED">Order Raised</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="LOADED">Loaded</option>
                                <option value="DISPATCHED">Dispatched</option>
                            </select>
                        </div>

                        {/* Delivery Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Delivery Status
                            </label>
                            <select
                                value={deliveryStatusFilter}
                                onChange={(e) => handleFilterChange('deliveryStatus', e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Deliveries</option>
                                <option value="PENDING">Pending</option>
                                <option value="IN_TRANSIT">In Transit</option>
                                <option value="FULLY_DELIVERED">Delivered</option>
                                <option value="PARTIALLY_DELIVERED">Partial</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <>
                        <Table
                            data={ordersData?.data?.orders || []}
                            columns={orderColumns}
                            loading={isLoading}
                            emptyMessage="No orders found"
                        />
                        <Pagination />
                    </>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => handleFilterChange('paymentStatus', 'PENDING')}
                        className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
                    >
                        <div className="text-2xl font-bold text-orange-600">
                            {ordersData?.data?.orders?.filter((o: any) => o.paymentStatus === 'PENDING').length || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Pending Payment</div>
                    </button>

                    <button
                        onClick={() => handleFilterChange('riteFoodsStatus', 'LOADED')}
                        className="p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-left"
                    >
                        <div className="text-2xl font-bold text-indigo-600">
                            {ordersData?.data?.orders?.filter((o: any) => o.riteFoodsStatus === 'LOADED').length || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Ready for Transport</div>
                    </button>

                    <button
                        onClick={() => handleFilterChange('deliveryStatus', 'IN_TRANSIT')}
                        className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                    >
                        <div className="text-2xl font-bold text-blue-600">
                            {ordersData?.data?.orders?.filter((o: any) => o.deliveryStatus === 'IN_TRANSIT').length || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">In Transit</div>
                    </button>

                    <button
                        onClick={() => handleFilterChange('deliveryStatus', 'FULLY_DELIVERED')}
                        className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
                    >
                        <div className="text-2xl font-bold text-green-600">
                            {ordersData?.data?.orders?.filter((o: any) => o.deliveryStatus === 'FULLY_DELIVERED').length || 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Delivered</div>
                    </button>
                </div>
            </div>
            {/* Export Options Modal */}
            <ExportOptionsModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />
        </div>
    );
};