/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/OrdersList.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Eye, Edit } from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
// ✅ FIXED: Import from the correct types file
import { DistributionOrder } from '../../types/index';

// ✅ FIXED: Use the correct status type from index.ts
type OrderStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const OrdersList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

    const pageSize = 10;

    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['distribution-orders', currentPage, pageSize, searchTerm, statusFilter],
        queryFn: () => distributionService.getOrders({
            page: currentPage,
            limit: pageSize,
            search: searchTerm || undefined,
            status: statusFilter || undefined,
        }),
    });

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleStatusFilter = (status: OrderStatus | '') => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'DELIVERED':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'SHIPPED':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'PROCESSING':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'APPROVED':
                return `${baseClasses} bg-purple-100 text-purple-800`;
            case 'PENDING':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            case 'CANCELLED':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    // ✅ FIXED: Update columns to match the correct DistributionOrder type
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
            render: (value: any) => (
                <div>
                    <div className="font-medium text-gray-900">{value?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{value?.territory}</div>
                </div>
            )
        },
        {
            key: 'location',
            title: 'Location',
            render: (value: any) => value?.name || 'N/A'
        },
        {
            key: 'orderItems',
            title: 'Packs',
            render: (value: any[]) => {
                // Calculate total packs from orderItems
                const totalPacks = value?.reduce((sum, item) => sum + (item.packs || 0), 0) || 0;
                return totalPacks.toLocaleString();
            }
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
                <span className={getStatusBadge(value)}>
                    {value}
                </span>
            )
        },
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value: any, record: DistributionOrder) => (
                <div className="flex items-center space-x-2">
                    <Link to={`/distribution/orders/${record.id}`}>
                        <Button variant="outline" size="sm" className="p-1">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link to={`/distribution/orders/${record.id}/edit`}>
                        <Button variant="outline" size="sm" className="p-1">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    const Pagination = () => {
        if (!ordersData?.data?.pagination) return null;  // ✅ Access nested pagination

        const { page, totalPages, total } = ordersData.data.pagination;  // ✅ Access nested pagination
        const startItem = ((page - 1) * pageSize) + 1;
        const endItem = Math.min(page * pageSize, total);

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
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
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startItem}</span> to{' '}
                            <span className="font-medium">{endItem}</span> of{' '}
                            <span className="font-medium">{total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <Button
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setCurrentPage(page - 1)}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2"
                            >
                                Previous
                            </Button>
                            {[...Array(totalPages)].map((_, idx) => (
                                <Button
                                    key={idx + 1}
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
                        Manage all distribution orders and track their status
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link to="/distribution/orders/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            New Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilter(e.target.value as OrderStatus | '')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        <Button variant="outline" className="inline-flex items-center">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={ordersData?.data?.orders || []}
                    columns={orderColumns}
                    loading={isLoading}
                    emptyMessage="No orders found"
                />

                <Pagination />
            </div>
        </div>
    );
};