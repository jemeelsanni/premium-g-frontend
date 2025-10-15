// src/pages/transport/TransportOrdersList.tsx - WITH EXPORT FUNCTIONALITY
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Eye, Edit, MapPin, FileText, Filter } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { TransportOrderStatus } from '../../types/transport';
import { StatusUpdateDropdown } from '../../components/transport/StatusUpdateDropdown';
import { toast } from 'react-hot-toast';

type PeriodFilter = 'day' | 'week' | 'month' | 'year' | 'custom' | '';

export const TransportOrdersList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TransportOrderStatus | ''>('');

    // Export filters
    const [showFilters, setShowFilters] = useState(false);
    const [period, setPeriod] = useState<PeriodFilter>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const pageSize = 10;

    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['transport-orders', currentPage, pageSize, searchTerm, statusFilter],
        queryFn: () => transportService.getOrders({
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
            status: statusFilter || undefined
        }),
    });

    // Debug logging
    useEffect(() => {
        if (ordersData) {
            console.log('📦 Orders Data:', ordersData);
            console.log('📦 Orders Array:', ordersData?.data?.orders);
            console.log('📦 Pagination:', ordersData?.data?.pagination);
        }
    }, [ordersData]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status: TransportOrderStatus | '') => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Export to CSV
    const handleExportCSV = async () => {
        setIsExportingCSV(true);
        try {
            const blob = await transportService.exportOrdersToCSV({
                search: searchTerm,
                status: statusFilter || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `transport-orders-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Orders exported to CSV successfully');
        } catch (error) {
            toast.error('Failed to export orders to CSV');
            console.error('Export error:', error);
        } finally {
            setIsExportingCSV(false);
        }
    };

    // Export Sales to CSV (with date filters)
    const handleExportSalesCSV = async () => {
        setIsExportingCSV(true);
        try {
            const blob = await transportService.exportSalesToCSV({
                period: period || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: statusFilter || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `transport-sales-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Sales exported to CSV successfully');
        } catch (error) {
            toast.error('Failed to export sales to CSV');
            console.error('Export error:', error);
        } finally {
            setIsExportingCSV(false);
        }
    };

    // Export Sales to PDF (with date filters)
    const handleExportSalesPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await transportService.exportSalesToPDF({
                period: period || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: statusFilter || undefined,
                limit: 100
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `transport-sales-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Sales exported to PDF successfully');
        } catch (error) {
            toast.error('Failed to export sales to PDF');
            console.error('Export error:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleClearFilters = () => {
        setPeriod('');
        setStartDate('');
        setEndDate('');
    };

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
            key: 'name',
            title: 'Client',
            render: (value: string, record: any) => {
                const clientName = value || record.clientName || 'N/A';
                return (
                    <div className="font-medium text-gray-900">{clientName}</div>
                );
            }
        },
        {
            key: 'phone',
            title: 'Phone',
            render: (value: string, record: any) => {
                const phone = value || record.clientPhone || 'N/A';
                return (
                    <div className="text-sm text-gray-600">{phone}</div>
                );
            }
        },
        {
            key: 'pickupLocation',
            title: 'Pickup',
            render: (value: string, record: any) => {
                const location = value || record.location?.name || 'N/A';
                return (
                    <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="truncate max-w-32" title={location}>
                            {location}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'deliveryAddress',
            title: 'Delivery',
            render: (value: string, record: any) => {
                const delivery = value || record.deliveryLocation || 'N/A';
                return (
                    <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1 text-blue-400" />
                        <span className="truncate max-w-32" title={delivery}>
                            {delivery}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'totalOrderAmount',
            title: 'Amount',
            render: (value: number, record: any) => {
                const amount = value || record.amount || 0;
                return (
                    <div className="font-semibold text-gray-900">
                        ₦{Number(amount).toLocaleString()}
                    </div>
                );
            }
        },
        {
            key: 'deliveryStatus',
            title: 'Status',
            render: (value: string, record: any) => (
                <StatusUpdateDropdown
                    orderId={record.id}
                    currentStatus={value || record.status || 'PENDING'}
                />
            )
        },
        {
            key: 'createdAt',
            title: 'Created',
            render: (value: string) => {
                const date = new Date(value);
                return (
                    <div className="text-sm text-gray-600">
                        {date.toLocaleDateString()}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_value: any, record: any) => (
                <div className="flex items-center space-x-2">
                    <Link to={`/transport/orders/${record.id}`}>
                        <Button variant="outline" size="sm" className="p-1">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link to={`/transport/orders/${record.id}/edit`}>
                        <Button variant="outline" size="sm" className="p-1">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    const Pagination = () => {
        const pagination = ordersData?.data?.pagination;

        if (!pagination) {
            console.log('⚠️ No pagination data');
            return null;
        }

        const { page, totalPages, total } = pagination;
        const startItem = ((page - 1) * pageSize) + 1;
        const endItem = Math.min(page * pageSize, total);

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                        variant="outline"
                        disabled={page === 1}
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
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startItem}</span> to{' '}
                            <span className="font-medium">{endItem}</span> of{' '}
                            <span className="font-medium">{total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <Button
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setCurrentPage(page - 1)}
                                className="rounded-l-md px-3 py-2"
                            >
                                Previous
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }

                                if (pageNum > 0 && pageNum <= totalPages) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? 'primary' : 'outline'}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className="px-4 py-2"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                                return null;
                            })}

                            <Button
                                variant="outline"
                                disabled={page >= totalPages}
                                onClick={() => setCurrentPage(page + 1)}
                                className="rounded-r-md px-3 py-2"
                            >
                                Next
                            </Button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    const processedOrders = (ordersData?.data?.orders || []).map((order: any) => ({
        ...order,
        name: order.name || order.clientName || 'Unknown',
        clientName: order.name || order.clientName || 'Unknown',
        phone: order.phone || order.clientPhone || '',
        clientPhone: order.phone || order.clientPhone || '',
        pickupLocation: order.pickupLocation || order.location?.name || '',
        deliveryAddress: order.deliveryAddress || order.deliveryLocation || '',
        totalOrderAmount: Number(order.totalOrderAmount || order.amount || 0),
        deliveryStatus: order.deliveryStatus || order.status || 'PENDING'
    }));

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">Failed to load orders: {String(error)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header - Fixed height */}
            <div className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transport Orders</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage and track all transport orders
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Export Filters
                    </Button>
                    <Link to="/transport/orders/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Export Filters Panel */}
            {showFilters && (
                <div className="flex-shrink-0 bg-white shadow rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Export Sales Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Period Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Period
                            </label>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Time</option>
                                <option value="day">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        {period === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* End Date */}
                        {period === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* Export Buttons */}
                        <div className="flex items-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={handleExportSalesCSV}
                                disabled={isExportingCSV}
                                className="flex-1"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                {isExportingCSV ? 'Exporting...' : 'CSV'}
                            </Button>
                            <Button
                                onClick={handleExportSalesPDF}
                                disabled={isExportingPDF}
                                className="flex-1"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isExportingPDF ? 'Exporting...' : 'PDF'}
                            </Button>
                        </div>

                        {/* Clear Filters */}
                        {(period || startDate || endDate) && (
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    className="w-full"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Search & Status Filters - Fixed height */}
            <div className="flex-shrink-0 bg-white shadow rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                        <div className="relative">
                            <Input
                                placeholder="Search by order number, client name..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <Search className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilter(e.target.value as TransportOrderStatus | '')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <Button
                        variant="outline"
                        className="inline-flex items-center justify-center"
                        onClick={handleExportCSV}
                        disabled={isExportingCSV || processedOrders.length === 0}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExportingCSV ? 'Exporting...' : 'Quick Export'}
                    </Button>
                </div>

                {(searchTerm || statusFilter) && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-gray-500">Active filters:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                Search: {searchTerm}
                            </span>
                        )}
                        {statusFilter && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                Status: {statusFilter.replace('_', ' ')}
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                                setCurrentPage(1);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Table Container - Takes remaining height */}
            <div className="flex-1 flex flex-col bg-white shadow rounded-lg min-h-0">
                {/* Table - Fills available space */}
                <div className="flex-1 overflow-auto">
                    <Table
                        data={processedOrders}
                        columns={orderColumns}
                        loading={isLoading}
                        emptyMessage={
                            searchTerm || statusFilter
                                ? "No orders found matching your filters"
                                : "No transport orders yet. Create your first order to get started!"
                        }
                    />
                </div>

                {/* Pagination - Fixed at bottom */}
                {!isLoading && ordersData?.data?.pagination && (
                    <div className="flex-shrink-0">
                        <Pagination />
                    </div>
                )}
            </div>
        </div>
    );
};