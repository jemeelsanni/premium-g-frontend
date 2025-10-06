/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/SalesList.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Download, DollarSign, User, Calendar, Eye, ShoppingCart, Percent } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';

export const SalesList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const pageSize = 10;

    const { data: salesData, isLoading, error } = useQuery({
        queryKey: ['warehouse-sales', currentPage, pageSize],
        queryFn: () => warehouseService.getSales(currentPage, pageSize),
    });

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleDateFilter = (value: string) => {
        setDateFilter(value);
        setCurrentPage(1);
    };

    const sales = salesData?.data?.sales ?? [];
    const pagination = salesData?.data?.pagination;
    const totalSales = pagination?.total ?? sales.length;

    const filteredData = sales.filter((sale: any) => {
        const customerName = sale.customerName ?? '';
        const salesOfficerName = sale.salesOfficerUser?.username ?? sale.salesOfficer ?? '';
        const matchesSearch = [customerName, salesOfficerName]
            .some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDate = dateFilter
            ? new Date(sale.createdAt).toDateString() === new Date(dateFilter).toDateString()
            : true;

        return matchesSearch && matchesDate;
    }) || [];

    const parseNumber = (value: unknown, fallback = 0) => {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : fallback;
        }
        if (typeof value === 'string' && value.trim()) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        }
        return fallback;
    };

    const salesColumns = [
        {
            key: 'customerName',
            title: 'Customer',
            render: (value: string) => (
                <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium text-gray-900">{value || 'Walk-in Customer'}</span>
                </div>
            )
        },
        {
            key: 'salesOfficerUser',
            title: 'Sales Officer',
            render: (_value: any, record: any) => (
                <div className="text-sm text-gray-700">
                    {record?.salesOfficerUser?.username || record?.salesOfficer || '—'}
                </div>
            )
        },
        {
            key: 'totalAmount',
            title: 'Total Amount',
            render: (value: number | string) => (
                <span className="font-bold text-green-600">₦{parseNumber(value).toLocaleString()}</span>
            )
        },
        {
            key: 'discountApplied',
            title: 'Discount',
            render: (_value: any, record: any) => (
                record?.discountApplied ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        <Percent className="mr-1 h-3 w-3" /> Discounted
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        No Discount
                    </span>
                )
            )
        },
        {
            key: 'createdAt',
            title: 'Date & Time',
            render: (value: string) => (
                <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                        <div className="font-medium">{new Date(value).toLocaleDateString()}</div>
                        <div className="text-gray-500">{new Date(value).toLocaleTimeString()}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_value: any, record: any) => (
                <Link
                    to={`/warehouse/sales/${record.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                </Link>
            )
        }
    ];

    const Pagination = () => {
        if (!pagination) return null;

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

    // Calculate stats
    const todaysSales = filteredData.filter(sale =>
        new Date(sale.createdAt).toDateString() === new Date().toDateString()
    );

    const todaysRevenue = todaysSales.reduce((sum, sale: any) => sum + parseNumber(sale.totalAmount), 0);
    const totalRevenue = filteredData.reduce((sum, sale: any) => sum + parseNumber(sale.totalAmount), 0);

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Failed to load sales data</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Sales Records
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        View and manage all warehouse sales transactions
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link to="/warehouse/sales/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Record New Sale
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Today's Sales
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {todaysSales.length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Today's Revenue
                                    </dt>
                                    <dd className="text-2xl font-semibold text-green-600">
                                        ₦{todaysRevenue.toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-bold text-sm">#</span>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Sales
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {totalSales}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-orange-600" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Revenue
                                    </dt>
                                    <dd className="text-2xl font-semibold text-orange-600">
                                        ₦{totalRevenue.toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search sales..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => handleDateFilter(e.target.value)}
                            placeholder="Filter by date"
                        />

                        <div className="sm:col-span-2 flex justify-end space-x-3">
                            <Button variant="outline" className="inline-flex items-center">
                                <Download className="h-4 w-4 mr-2" />
                                Export Sales Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={filteredData}
                    columns={salesColumns}
                    loading={isLoading}
                    emptyMessage="No sales records found"
                />

                <Pagination />
            </div>
        </div>
    );
};
