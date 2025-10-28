/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CustomerDetail.tsx - WITH PDF EXPORT
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    CreditCard,
    Award,
    Download,
    Loader2,
} from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { generateCustomerDetailPDF } from '../../services/pdf/customerDetailPDF';
import { toast } from 'react-hot-toast';

type DatePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const CustomerDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Purchase History Pagination
    const [purchasePage, setPurchasePage] = useState(1);
    const [purchaseLimit, setPurchaseLimit] = useState(10);

    // Debt History Pagination  
    const [debtPage, setDebtPage] = useState(1);
    const [debtLimit, setDebtLimit] = useState(10);

    // PDF Export State
    const [isExporting, setIsExporting] = useState(false);

    // Date filtering
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const filters = useMemo(() => {
        const baseFilters: any = {
            page: purchasePage,
            limit: purchaseLimit,
        };

        if (datePreset === 'custom') {
            if (customStartDate) baseFilters.startDate = customStartDate;
            if (customEndDate) baseFilters.endDate = customEndDate;
        } else if (datePreset !== 'all') {
            const today = new Date();
            let startDate = new Date();

            switch (datePreset) {
                case 'today':
                    startDate = today;
                    break;
                case 'week':
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
            }

            baseFilters.startDate = startDate.toISOString().split('T')[0];
            baseFilters.endDate = today.toISOString().split('T')[0];
        }

        return baseFilters;
    }, [datePreset, customStartDate, customEndDate, purchasePage, purchaseLimit]);

    // Fetch customer details
    const { data: customerData, isLoading: customerLoading } = useQuery({
        queryKey: ['warehouse-customer-detail', id],
        queryFn: () => warehouseService.getCustomerDetails(id!),
        enabled: !!id,
    });

    // Fetch purchase history with pagination
    const { data: purchaseData, isLoading: purchaseLoading } = useQuery({
        queryKey: ['warehouse-customer-purchases', id, filters],
        queryFn: () => warehouseService.getCustomerPurchaseHistory(id!, filters),
        enabled: !!id,
    });


    // Fetch debt history
    const { data: debtData, isLoading: debtLoading } = useQuery({
        queryKey: ['warehouse-customer-debts', id],
        queryFn: () => warehouseService.getCustomerDebtSummary(id!),
        enabled: !!id,
    });

    const customer = customerData?.data.customer;
    const insights = customerData?.data.insights;
    const purchases = purchaseData?.data.purchases || [];
    const purchasePagination = purchaseData?.data.pagination;
    const purchaseSummary = purchaseData?.data.summary;

    // Paginate debts manually
    const allDebts = debtData?.data?.debtors || [];
    const debtSummary = debtData?.data?.summary;

    const paginatedDebts = useMemo(() => {
        const startIndex = (debtPage - 1) * debtLimit;
        const endIndex = startIndex + debtLimit;
        return allDebts.slice(startIndex, endIndex);
    }, [allDebts, debtPage, debtLimit]);

    const debtPagination = {
        page: debtPage,
        limit: debtLimit,
        total: allDebts.length,
        pages: Math.ceil(allDebts.length / debtLimit),
    };

    // Reset to first page when filters change
    useEffect(() => {
        setPurchasePage(1);
    }, [datePreset, customStartDate, customEndDate, purchaseLimit]);

    const handleDatePresetChange = (preset: DatePreset) => {
        setDatePreset(preset);
    };

    const handleCustomDateApply = () => {
        if (customStartDate || customEndDate) {
            setDatePreset('custom');
        }
    };

    // PDF Export Handler
    const handleExportPDF = async () => {
        if (!customer) return;

        try {
            setIsExporting(true);
            toast.loading('Generating PDF...', { id: 'pdf-export' });

            // Fetch all purchases for export
            const allPurchases = await warehouseService.getCustomerPurchaseHistory(id!, {
                page: 1,
                limit: 10000,
                startDate: filters.startDate,
                endDate: filters.endDate,
            });

            // Prepare filter info for PDF
            let periodText = 'All Time';
            if (datePreset === 'custom') {
                periodText = `${customStartDate || 'Beginning'} to ${customEndDate || 'Now'}`;
            } else if (datePreset !== 'all') {
                periodText = datePreset.charAt(0).toUpperCase() + datePreset.slice(1);
            }

            // Generate PDF
            const pdfBlob = await generateCustomerDetailPDF({
                customer,
                purchases: allPurchases.data.purchases || [],
                debtSummary,
                insights,
                summary: allPurchases.data.summary,
                filters: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    period: periodText,
                },
            });

            // Download PDF
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Customer_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('PDF exported successfully!', { id: 'pdf-export' });
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Failed to export PDF', { id: 'pdf-export' });
        } finally {
            setIsExporting(false);
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

    // Purchase Table Columns
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
                <span className="font-mono text-sm font-medium">{value}</span>
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
                    <div>
                        <span className="text-green-600 font-medium">
                            {record.discountPercentage}% Off
                        </span>
                        <div className="text-xs text-gray-500">
                            Saved: ₦{record.totalDiscountAmount?.toLocaleString() || 0}
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400">No Discount</span>
                ),
        },
        {
            key: 'paymentMethod',
            title: 'Payment',
            render: (value: string) => (
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{value}</span>
            ),
        },
    ];

    // Debt Table Columns
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
                    <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
                    >
                        <Icon className="h-3 w-3 mr-1" />
                        {value}
                    </span>
                );
            },
        },
    ];

    // Pagination Component
    const PaginationControls = ({
        pagination,
        onPageChange,
        onLimitChange,
    }: {
        pagination: any;
        onPageChange: (page: number) => void;
        onLimitChange: (limit: number) => void;
    }) => (
        <div className="mt-6 px-4 py-3 bg-white border-t border-gray-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                    Showing page <span className="font-semibold">{pagination.page}</span> of{' '}
                    <span className="font-semibold">{pagination.pages}</span> ({pagination.total}{' '}
                    total records)
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ««
                    </button>

                    <button
                        onClick={() => onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            let pageNum;
                            if (pagination.pages <= 5) {
                                pageNum = i + 1;
                            } else if (pagination.page <= 3) {
                                pageNum = i + 1;
                            } else if (pagination.page >= pagination.pages - 2) {
                                pageNum = pagination.pages - 4 + i;
                            } else {
                                pageNum = pagination.page - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`px-3 py-2 text-sm font-medium rounded-md ${pagination.page === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <div className="sm:hidden px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
                        {pagination.page} / {pagination.pages}
                    </div>

                    <button
                        onClick={() => onPageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>

                    <button
                        onClick={() => onPageChange(pagination.pages)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        »»
                    </button>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                    <span className="text-sm text-gray-700">Items per page:</span>
                    <select
                        value={pagination.limit}
                        onChange={(e) => onLimitChange(parseInt(e.target.value))}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="5">5</option>
                        <option value="8">8</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/warehouse/customers')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                        <p className="text-sm text-gray-500">Customer Details</p>
                    </div>
                </div>

                {/* Export PDF Button */}
                <Button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            Export PDF
                        </>
                    )}
                </Button>
            </div>

            {/* Customer Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Basic Info Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {customer.phone || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {customer.email || 'N/A'}
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>{customer.address || 'N/A'}</span>
                        </div>
                        <div className="pt-2 border-t">
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                {customer.customerType}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Purchase Stats Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Purchase Stats</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500">Total Purchases</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {customer.totalPurchases}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Spent</p>
                            <p className="text-lg font-semibold text-green-600">
                                ₦{customer.totalSpent?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Avg. Order Value</p>
                            <p className="text-sm font-medium text-gray-700">
                                ₦{customer.averageOrderValue?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Credit Info Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Credit Info</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500">Credit Limit</p>
                            <p className="text-lg font-semibold text-gray-900">
                                ₦{customer.creditLimit?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Outstanding Debt</p>
                            <p className="text-lg font-semibold text-red-600">
                                ₦{customer.outstandingDebt?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Payment Reliability</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{
                                            width: `${customer.paymentReliabilityScore || 0}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-medium">
                                    {customer.paymentReliabilityScore || 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Last Activity Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Activity</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-500">Last Purchase</p>
                            <p className="text-sm font-medium text-gray-900">
                                {customer.lastPurchaseDate
                                    ? format(new Date(customer.lastPurchaseDate), 'MMM dd, yyyy')
                                    : 'Never'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Preferred Payment</p>
                            <p className="text-sm font-medium text-gray-900">
                                {customer.preferredPaymentMethod || 'Not Set'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <span
                                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${customer.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {customer.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products Insight */}
            {insights?.topProducts && insights.topProducts.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Award className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Top Purchased Products</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {insights.topProducts.slice(0, 5).map((product: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {product.product?.name || product.name}
                                </p>
                                <p className="text-xs text-gray-500 mb-2">
                                    {product.product?.productNo || product.productNo}
                                </p>
                                <div className="space-y-1 text-xs">
                                    <p className="text-gray-600">
                                        Purchases: {product.purchaseCount || product.purchase_count}
                                    </p>
                                    <p className="text-gray-600">
                                        Quantity: {product.totalQuantity}
                                    </p>
                                    <p className="font-semibold text-green-600">
                                        ₦{product.totalSpent?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Purchase History Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Purchase History
                            </h2>
                            <p className="text-sm text-gray-600">
                                Complete transaction history
                            </p>
                        </div>

                        {/* Date Filter */}
                        <div className="flex flex-wrap items-center gap-2">
                            {(['all', 'today', 'week', 'month', 'year', 'custom'] as DatePreset[]).map(
                                (preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => handleDatePresetChange(preset)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md ${datePreset === preset
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    {datePreset === 'custom' && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <Button size="sm" onClick={handleCustomDateApply}>
                                Apply
                            </Button>
                        </div>
                    )}
                </div>

                {/* Purchase Summary */}
                {purchaseSummary && (
                    <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Purchases</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {purchaseSummary.totalPurchases}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-green-600">
                                ₦{purchaseSummary.totalSpent?.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Avg. Order Value</p>
                            <p className="text-2xl font-bold text-blue-600">
                                ₦{purchaseSummary.averageOrderValue?.toLocaleString()}
                            </p>
                        </div>
                    </div>
                )}

                {/* Purchases Table */}
                <div className="p-6">
                    {purchaseLoading ? (
                        <div className="text-center py-8">
                            <LoadingSpinner size="lg" />
                            <p className="mt-2 text-gray-600">Loading purchases...</p>
                        </div>
                    ) : purchases.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No Purchases Yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                This customer hasn't made any purchases yet
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table data={purchases} columns={purchaseColumns} />

                            {/* Purchase Pagination */}
                            {purchasePagination && (
                                <PaginationControls
                                    pagination={{
                                        ...purchasePagination,
                                        pages: purchasePagination.pages ||
                                            Math.ceil(
                                                (purchasePagination.total || 0) /
                                                (purchasePagination.limit || purchaseLimit || 10)
                                            )
                                    }}
                                    onPageChange={setPurchasePage}
                                    onLimitChange={setPurchaseLimit}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Debt History Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Debt History</h2>
                            <p className="text-sm text-gray-600">
                                Track all credit sales and payments
                            </p>
                        </div>
                        {debtSummary && (
                            <div className="text-right">
                                <div className="text-sm text-gray-600">Outstanding Debt</div>
                                <div className="text-2xl font-bold text-red-600">
                                    ₦{debtSummary.outstandingAmount?.toLocaleString() || 0}
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
                                ₦{debtSummary.totalDebt?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {debtSummary.numberOfDebts || 0} records
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
                            </div>
                            <p className="text-xl font-bold text-green-600">
                                ₦{debtSummary.totalPaid?.toLocaleString() || 0}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <h3 className="text-sm font-medium text-gray-600">Outstanding</h3>
                            </div>
                            <p className="text-xl font-bold text-red-600">
                                ₦{debtSummary.outstandingAmount?.toLocaleString() || 0}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-yellow-500" />
                                <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
                            </div>
                            <p className="text-xl font-bold text-yellow-600">
                                ₦{debtSummary.overdueAmount?.toLocaleString() || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {debtSummary.overdueCount || 0} debts
                            </p>
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
                    ) : allDebts.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No Debt Records
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                This customer has no outstanding or historical debts
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table data={paginatedDebts} columns={debtColumns} />

                            {/* Debt Pagination */}
                            {debtPagination.pages > 1 && (
                                <PaginationControls
                                    pagination={debtPagination}
                                    onPageChange={setDebtPage}
                                    onLimitChange={setDebtLimit}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};