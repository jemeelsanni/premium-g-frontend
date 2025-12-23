/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/SalesList.tsx - FIXED VERSION
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, User, DollarSign, TrendingUp, Package, ChevronLeft, ChevronRight, Download, FileText, Filter } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';



export const SalesList: React.FC = () => {
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom' | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const { data: salesData, isLoading } = useQuery({
        queryKey: ['warehouse-sales', currentPage, pageSize, startDate, endDate],
        queryFn: () =>
            warehouseService.getSales(currentPage, pageSize, {
                startDate: period === 'custom' ? startDate : undefined,
                endDate: period === 'custom' ? endDate : undefined,
            }),
    });


    // ✅ Calculate pagination values
    const totalPages = salesData?.data?.pagination?.totalPages || 1;
    const total = salesData?.data?.pagination?.total || 0;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    const parseNumber = (value: any, fallback = 0): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return !isNaN(parsed) ? parsed : fallback;
        }
        return fallback;
    };

    const formatProductSummary = (record: any) => {
        const items = Array.isArray(record?.items) ? record.items : [];
        if (items.length === 0) {
            return 'No products';
        }
        const firstItem = items[0];
        const firstName = firstItem?.product?.name || 'Unknown Product';
        const firstQuantity = Number(firstItem?.quantity ?? 0);
        const firstUnit = firstItem?.unitType ? firstItem.unitType.toLowerCase() : '';

        if (items.length === 1) {
            return `${firstName} (${firstQuantity.toLocaleString()} ${firstUnit})`;
        }

        return `${firstName} (+${items.length - 1} more)`;
    };

    const formatItemsCount = (record: any) => {
        const itemsCount = Number(record?.itemsCount ?? (Array.isArray(record?.items) ? record.items.length : 0));
        return `${itemsCount} item${itemsCount === 1 ? '' : 's'}`;
    };

    const salesColumns = [
        {
            key: 'receiptNumber',
            title: 'Receipt #',
            render: (value: string) => (
                <span className="font-mono text-sm text-gray-700">{value}</span>
            )
        },
        {
            key: 'customerName',
            title: 'Customer',
            render: (value: string, record: any) => (
                <div>
                    <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-900">{value || 'Walk-in Customer'}</span>
                    </div>
                    {record?.customerPhone && (
                        <div className="text-xs text-gray-500 ml-6">{record.customerPhone}</div>
                    )}
                </div>
            )
        },
        {
            key: 'items',
            title: 'Products',
            render: (_value: any, record: any) => (
                <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">{formatProductSummary(record)}</div>
                    <div className="text-xs text-gray-500">{formatItemsCount(record)}</div>
                </div>
            )
        },
        {
            key: 'totalAmount',
            title: 'Amount',
            render: (value: number | string, record: any) => {
                const total = parseNumber(value);
                const discount = parseNumber(record?.totalDiscountAmount);
                const hasDiscount = record?.discountApplied && discount > 0;
                const originalAmount = total + discount;

                return (
                    <div className="space-y-1">
                        {hasDiscount && (
                            <div className="text-xs text-gray-500 line-through">
                                ₦{originalAmount.toLocaleString()}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <span className={`font-bold ${hasDiscount ? 'text-green-600' : 'text-gray-900'}`}>
                                ₦{total.toLocaleString()}
                            </span>
                            {hasDiscount && (
                                <TrendingDown className="h-4 w-4 text-green-600" />
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'paymentStatus',
            title: 'Payment Status',
            render: (value: string) => {
                const status = value || 'PAID';
                const colors = {
                    'PAID': 'bg-green-100 text-green-800',
                    'CREDIT': 'bg-red-100 text-red-800',
                    'PARTIAL': 'bg-yellow-100 text-yellow-800'
                };

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            key: 'salesOfficerUser',
            title: 'Officer',
            render: (_value: any, record: any) => (
                <div className="text-sm text-gray-700">
                    {record?.salesOfficerUser?.username || record?.salesOfficer || '—'}
                </div>
            )
        },
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => (
                <div className="text-sm text-gray-700">
                    {new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_value: any, record: any) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/warehouse/sales/${record.receiptNumber}`)}
                >
                    View Details
                </Button>
            )
        }
    ];

    const handlePeriodChange = (value: 'day' | 'week' | 'month' | 'year' | 'custom' | '') => {
        setPeriod(value);

        if (value === 'day') {
            setStartDate(dayjs().startOf('day').toISOString());
            setEndDate(dayjs().endOf('day').toISOString());
        } else if (value === 'week') {
            setStartDate(dayjs().startOf('week').toISOString());
            setEndDate(dayjs().endOf('week').toISOString());
        } else if (value === 'month') {
            setStartDate(dayjs().startOf('month').toISOString());
            setEndDate(dayjs().endOf('month').toISOString());
        } else if (value === 'year') {
            setStartDate(dayjs().startOf('year').toISOString());
            setEndDate(dayjs().endOf('year').toISOString());
        } else if (value === 'custom' || value === '') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleExportCSV = async () => {
        setIsExportingCSV(true);
        try {
            const blob = await warehouseService.exportSalesToCSV({
                period: period || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `warehouse-sales-${new Date().toISOString().split('T')[0]}.csv`;
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

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await warehouseService.exportSalesToPDF({
                period: period || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 100
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `warehouse-sales-${new Date().toISOString().split('T')[0]}.pdf`;
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                        Warehouse Sales
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        View and manage all warehouse sales transactions
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        disabled={isExportingCSV || !salesData?.data?.sales?.length}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {isExportingCSV ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button
                        onClick={handleExportPDF}
                        disabled={isExportingPDF || !salesData?.data?.sales?.length}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                    </Button>
                    <Button onClick={() => navigate('/warehouse/sales/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Record New Sale
                    </Button>
                </div>
            </div>
            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Sales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Period Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Period
                            </label>
                            <select
                                value={period}
                                onChange={(e) => handlePeriodChange(e.target.value as any)}
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

                        {/* Clear Filters */}
                        {(period || startDate || endDate) && (
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={handleClearFilters}
                                    className="w-full"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Sales
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {total}
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
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Revenue
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        ₦{salesData?.data?.sales?.reduce((sum: number, s: any) =>
                                            sum + parseNumber(s.totalAmount), 0).toLocaleString() || '0'}
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
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Number of Packs Sold
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {salesData?.data?.sales?.reduce((sum: number, s: any) => {
                                            const items = Array.isArray(s?.items) ? s.items : [];
                                            const totalPacks = items.reduce((packSum: number, item: any) =>
                                                packSum + (item?.unitType?.toLowerCase() === 'pack' ? parseNumber(item.quantity) : 0), 0);
                                            return sum + totalPacks;
                                        }, 0).toLocaleString() || '0'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white shadow rounded-lg">
                <Table
                    data={salesData?.data?.sales || []}
                    columns={salesColumns}
                    loading={isLoading}
                    emptyMessage="No sales records found"
                />

                {/* ✅ FIXED: Manual Pagination (matching other pages pattern) */}
                {!isLoading && total > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                            {Math.min(currentPage * pageSize, total)} of {total} results
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!hasPrev}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>

                            <span className="px-3 py-1 text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!hasNext}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};