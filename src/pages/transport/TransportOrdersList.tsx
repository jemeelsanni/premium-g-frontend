/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/TransportOrdersList.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, Eye, Edit, MapPin } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { TransportOrder, TransportOrderStatus } from '../../types/transport';
import { StatusUpdateDropdown } from '../../components/transport/StatusUpdateDropdown';


export const TransportOrdersList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TransportOrderStatus | ''>('');

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

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusFilter = (status: TransportOrderStatus | '') => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

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
            render: (value: string) => (
                <div className="font-medium text-gray-900">{value}</div>
            )
        },
        {
            key: 'pickupLocation',
            title: 'Route',
            render: (value: string, record: TransportOrder) => (
                <div className="text-sm">
                    <div className="flex items-center text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-24" title={record.pickupLocation || ''}>
                            {record.pickupLocation}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400">↓</div>
                    <div className="flex items-center text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-24" title={record.deliveryAddress || ''}>
                            {record.deliveryAddress}
                        </span>
                    </div>
                </div>
            )
        },
        {
            key: 'truck',
            title: 'Truck',
            render: (value: any) => (
                <div className="text-sm">
                    {value ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {value.plateNumber}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">Not assigned</span>
                    )}
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
            render: (value: any, row: TransportOrder) => (
                <StatusUpdateDropdown
                    orderId={row.id}
                    currentStatus={row.deliveryStatus}
                />
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
            render: (value: any, record: TransportOrder) => (
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
        if (!ordersData) return null;

        const { page, totalPages, total } = ordersData.pagination;
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
                        disabled={page === totalPages}
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
                                className="rounded-l-md"
                            >
                                Previous
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                                if (pageNum <= totalPages) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "primary" : "outline"}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className="rounded-none"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                                return null;
                            })}

                            <Button
                                variant="outline"
                                disabled={page === totalPages}
                                onClick={() => setCurrentPage(page + 1)}
                                className="rounded-r-md"
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
                <p className="text-red-600">Failed to load transport orders</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Transport Orders
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage all transport orders and logistics operations
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link to="/transport/orders/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            New Transport Order
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
                            onChange={(e) => handleStatusFilter(e.target.value as TransportOrderStatus | '')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_TRANSIT">In Transit</option>
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
                    emptyMessage="No transport orders found"
                />

                <Pagination />
            </div>
        </div>
    );
};