/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/SalesList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, User, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';

export const SalesList: React.FC = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const { data: salesData, isLoading } = useQuery({
        queryKey: ['warehouse-sales', currentPage, pageSize],
        queryFn: () => warehouseService.getSales(currentPage, pageSize),
    });

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
            key: 'discountApplied',
            title: 'Discount',
            render: (_value: any, record: any) => {
                const hasDiscount = record?.discountApplied;
                const discountAmount = parseNumber(record?.totalDiscountAmount);
                const discountPercent = parseNumber(record?.discountPercentage);

                if (!hasDiscount || discountAmount <= 0) {
                    return <span className="text-gray-400 text-sm">—</span>;
                }

                return (
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                                {discountPercent > 0 ? `${discountPercent.toFixed(1)}%` : 'Applied'}
                            </span>
                        </div>
                        <div className="text-xs text-green-600">
                            -₦{discountAmount.toLocaleString()}
                        </div>
                    </div>
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
                <Button onClick={() => navigate('/warehouse/sales/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record New Sale
                </Button>
            </div>

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
                                        {salesData?.data?.pagination?.total || 0}
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
                                <Tag className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        With Discounts
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {salesData?.data?.sales?.filter((s: any) => s.discountApplied).length || 0}
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
                                <TrendingDown className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Discounts Given
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        ₦{salesData?.data?.sales?.reduce((sum: number, s: any) =>
                                            sum + parseNumber(s.totalDiscountAmount), 0).toLocaleString() || '0'}
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
                    pagination={{
                        currentPage,
                        totalPages: salesData?.data?.pagination?.totalPages || 1,
                        onPageChange: setCurrentPage,
                    }}
                    emptyMessage="No sales records found"
                />
            </div>
        </div>
    );
};