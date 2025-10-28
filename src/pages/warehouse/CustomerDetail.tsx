/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CustomerDetail.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    ShoppingCart,
    AlertCircle,
    Filter,
    CheckCircle,
    CreditCard,
    TrendingUp,
} from 'lucide-react';
import { warehouseService, CustomerPurchaseFilters } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import { format, startOfWeek, startOfMonth, subMonths, endOfMonth } from 'date-fns';
type DatePreset = 'today' | 'week' | 'month' | 'lastMonth' | 'custom' | 'all';

export const CustomerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [purchasePage, setPurchasePage] = useState(1);
    const [purchaseLimit, setPurchaseLimit] = useState(10);
    const [debtPage, setDebtPage] = useState(1);
    const [debtLimit, setDebtLimit] = useState(10);
    const [page, setPage] = useState(1);
    const limit = 10;

    // Calculate date range based on preset
    const getDateRange = (): { startDate?: string; endDate?: string } => {
        const today = new Date();

        switch (datePreset) {
            case 'today':
                return {
                    startDate: format(today, 'yyyy-MM-dd'),
                    endDate: format(today, 'yyyy-MM-dd'),
                };
            case 'week':
                return {
                    startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                    endDate: format(today, 'yyyy-MM-dd'),
                };
            case 'month':
                return {
                    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
                    endDate: format(today, 'yyyy-MM-dd'),
                };
            case 'lastMonth': {
                const lastMonth = subMonths(today, 1);
                return {
                    startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
                    endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
                };
            }
            case 'custom':
                return {
                    startDate: customStartDate || undefined,
                    endDate: customEndDate || undefined,
                };
            default:
                return {};
        }
    };

    const filters: CustomerPurchaseFilters = {
        page,
        limit,
        ...getDateRange(),
    };

    // Fetch customer details with insights
    const { data: customerData, isLoading: customerLoading } = useQuery({
        queryKey: ['warehouse-customer-detail', id],
        queryFn: () => warehouseService.getCustomerById(id!),
        enabled: !!id,
    });

    // Fetch purchase history with filters
    const { data: purchaseData, isLoading: purchaseLoading } = useQuery({
        queryKey: ['warehouse-customer-purchases', id, filters],
        queryFn: () => warehouseService.getCustomerPurchaseHistory(id!, filters),
        enabled: !!id,
    });

    const { data: debtData, isLoading: debtLoading } = useQuery({
        queryKey: ['warehouse-customer-debts', id],
        queryFn: () => warehouseService.getCustomerDebtSummary(id!),
        enabled: !!id,
    });

    const debts = debtData?.data?.debtors || [];
    const debtSummary = debtData?.data?.summary;


    const customer = customerData?.data.customer;
    const purchases = purchaseData?.data.purchases || [];
    const pagination = purchaseData?.data.pagination;
    const summary = purchaseData?.data.summary;

    const handleDatePresetChange = (preset: DatePreset) => {
        setDatePreset(preset);
        setPage(1); // Reset to first page when filter changes
    };

    const handleCustomDateApply = () => {
        if (customStartDate || customEndDate) {
            setDatePreset('custom');
            setPage(1);
        }
    };

    if (customerLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Customer not found</h3>
                <div className="mt-6">
                    <Button onClick={() => navigate('/warehouse/customers')}>
                        Back to Customers
                    </Button>
                </div>
            </div>
        );
    }

    const purchaseColumns = [
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => format(new Date(value), 'MMM dd, yyyy HH:mm'),
        },
        {
            key: 'receiptNumber',
            title: 'Receipt #',
            render: (value: string) => (
                <span className="font-mono text-sm">{value}</span>
            ),
        },
        {
            key: 'product',
            title: 'Product',
            render: (_: unknown, record: any) => (
                <div>
                    <div className="font-medium">{record.product.name}</div>
                    <div className="text-sm text-gray-500">{record.product.productNo}</div>
                </div>
            ),
        },
        {
            key: 'quantity',
            title: 'Quantity',
            render: (value: number, record: any) => `${value} ${record.unitType}`,
        },
        {
            key: 'unitPrice',
            title: 'Unit Price',
            render: (value: number) => `₦${value.toLocaleString()}`,
        },
        {
            key: 'totalAmount',
            title: 'Total Amount',
            render: (value: number) => (
                <span className="font-semibold">₦{value.toLocaleString()}</span>
            ),
        },
        {
            key: 'discountApplied',
            title: 'Discount',
            render: (_: unknown, record: any) =>
                record.discountApplied ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {record.discountPercentage}% (-₦{record.totalDiscountAmount?.toLocaleString() || 0})
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            key: 'paymentMethod',
            title: 'Payment',
            render: (value: string) => (
                <span className="text-sm">{value.replace(/_/g, ' ')}</span>
            ),
        },
    ];

    const debtColumns = [
        {
            key: 'createdAt',
            title: 'Date',
            render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
        },
        {
            key: 'sale',
            title: 'Receipt / Product',
            render: (_: unknown, record: any) => (
                <div>
                    <div className="font-mono text-sm font-medium">{record.sale.receiptNumber}</div>
                    <div className="text-xs text-gray-500">{record.sale.product?.name}</div>
                </div>
            ),
        },
        {
            key: 'totalAmount',
            title: 'Total Amount',
            render: (value: number) => (
                <span className="font-semibold">₦{value.toLocaleString()}</span>
            ),
        },
        {
            key: 'amountPaid',
            title: 'Amount Paid',
            render: (value: number) => (
                <span className="text-green-600 font-medium">₦{value.toLocaleString()}</span>
            ),
        },
        {
            key: 'amountDue',
            title: 'Amount Due',
            render: (value: number) => (
                <span className="text-red-600 font-medium">₦{value.toLocaleString()}</span>
            ),
        },
        {
            key: 'dueDate',
            title: 'Due Date',
            render: (value: string | null) =>
                value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A',
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => {
                const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
                    PAID: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
                    PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: DollarSign },
                    OUTSTANDING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CreditCard },
                    OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
                };

                const config = statusConfig[value] || statusConfig.OUTSTANDING;
                const Icon = config.icon;

                return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {value}
                    </span>
                );
            },
        },
        {
            key: 'payments',
            title: 'Payments',
            render: (payments: any[]) => (
                <div className="text-xs">
                    {payments && payments.length > 0 ? (
                        <span className="text-gray-600">{payments.length} payment(s)</span>
                    ) : (
                        <span className="text-gray-400">No payments</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/warehouse/customers')}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
                </div>
            </div>

            {/* Customer Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Customer Name</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">{customer.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{customer.customerType}</p>
                        </div>
                        <User className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Contact Info</p>
                            <p className="text-sm text-gray-900 mt-1 flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                {customer.phone || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {customer.address ? customer.address.substring(0, 30) + '...' : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {customer.totalPurchases}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Orders</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500">Total Spent</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                ₦{parseFloat(customer.totalSpent?.toString() || '0').toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                Avg: ₦{parseFloat(customer.averageOrderValue?.toString() || '0').toLocaleString()}
                            </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-purple-600" />
                    </div>
                </div>
            </div>



            {/* Sales History Section */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                            Sales History
                        </h2>
                    </div>

                    {/* Date Filter Pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => handleDatePresetChange('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${datePreset === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => handleDatePresetChange('today')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${datePreset === 'today'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleDatePresetChange('week')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${datePreset === 'week'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => handleDatePresetChange('month')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${datePreset === 'month'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => handleDatePresetChange('lastMonth')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${datePreset === 'lastMonth'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Last Month
                        </button>
                    </div>

                    {/* Custom Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <Button
                                onClick={handleCustomDateApply}
                                disabled={!customStartDate && !customEndDate}
                                className="w-full"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Apply Custom Range
                            </Button>
                        </div>
                    </div>

                    {/* Summary Stats for Filtered Period */}
                    {summary && (
                        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalPurchases}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    ₦{parseFloat(summary.totalSpent.toString()).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    ₦{parseFloat(summary.averageOrderValue.toString()).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Purchase History Table */}
                <div className="overflow-x-auto">
                    <Table
                        data={purchases}
                        columns={purchaseColumns}
                        loading={purchaseLoading}
                        emptyMessage="No purchases found for the selected period"
                    />
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={pagination.page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                                disabled={pagination.page === pagination.pages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Debt History Section - NEW */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Debt History</h2>
                            <p className="text-sm text-gray-600">Track all credit sales and payments</p>
                        </div>
                        {debtSummary && (
                            <div className="text-right">
                                <div className="text-sm text-gray-600">Outstanding Debt</div>
                                <div className="text-2xl font-bold text-red-600">
                                    ₦{debtSummary.outstandingAmount.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debt Summary Cards */}
                {debtSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="h-5 w-5 text-blue-500" />
                                <h3 className="text-sm font-medium text-gray-600">Total Debt</h3>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                                ₦{debtSummary.totalDebt.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{debtSummary.numberOfDebts} records</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
                            </div>
                            <p className="text-xl font-bold text-green-600">
                                ₦{debtSummary.totalPaid.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <h3 className="text-sm font-medium text-gray-600">Outstanding</h3>
                            </div>
                            <p className="text-xl font-bold text-red-600">
                                ₦{debtSummary.outstandingAmount.toLocaleString()}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-yellow-500" />
                                <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
                            </div>
                            <p className="text-xl font-bold text-yellow-600">
                                ₦{debtSummary.overdueAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{debtSummary.overdueCount} debts</p>
                        </div>
                    </div>
                )}

                {/* Debts Table */}
                <div className="p-6">
                    {debtLoading ? (
                        <div className="text-center py-8">
                            <LoadingSpinner size="lg" />
                            <p className="mt-2 text-gray-600">Loading debt history...</p>
                        </div>
                    ) : debts.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Debt Records</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                This customer has no outstanding or historical debts
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table
                                data={debts}
                                columns={debtColumns}
                            />


                            {/* Payment Details Section */}
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Payments</h3>
                                <div className="space-y-2">
                                    {debts
                                        .filter((debt: any) => debt.payments && debt.payments.length > 0)
                                        .slice(0, 5)
                                        .map((debt: any) => (
                                            <div key={debt.id} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {debt.sale.receiptNumber}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${debt.status === 'PAID'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {debt.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    {debt.payments.map((payment: any) => (
                                                        <div key={payment.id} className="flex items-center justify-between text-xs text-gray-600">
                                                            <span>
                                                                {format(new Date(payment.paymentDate), 'MMM dd, yyyy')} - {payment.paymentMethod}
                                                            </span>
                                                            <span className="font-semibold text-green-600">
                                                                +₦{payment.amount.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>





        </div>
    );
};