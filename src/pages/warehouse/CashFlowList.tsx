/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, DollarSign, TrendingUp, TrendingDown, Plus, Filter, X, Download, FileText } from 'lucide-react';
import { warehouseService, CreateCashFlowData } from '../../services/warehouseService';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';

interface CashFlowFilters {
    transactionType?: 'CASH_IN' | 'CASH_OUT' | '';
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    isReconciled?: boolean | '';
}

export const CashFlowList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const queryClient = useQueryClient();
    const pageSize = 20;

    // Filter state
    const [filters, setFilters] = useState<CashFlowFilters>({
        transactionType: '',
        paymentMethod: '',
        startDate: '',
        endDate: '',
        isReconciled: ''
    });

    // Form state
    const [formData, setFormData] = useState<CreateCashFlowData>({
        transactionType: 'CASH_IN',
        amount: 0,
        paymentMethod: 'CASH',
        description: '',
        referenceNumber: ''
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Build query params
    const buildQueryParams = () => {
        const params: any = {
            page: currentPage,
            limit: pageSize
        };

        if (filters.transactionType) params.transactionType = filters.transactionType;
        if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;

        // Convert dates to ISO format with proper time boundaries
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            params.startDate = start.toISOString();
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            params.endDate = end.toISOString();
        }

        if (filters.isReconciled !== '') params.isReconciled = filters.isReconciled;

        return params;
    };

    const { data: cashFlowData, isLoading } = useQuery({
        queryKey: ['warehouse-cash-flow', currentPage, pageSize, filters],
        queryFn: () => {
            const params = buildQueryParams();
            return warehouseService.getCashFlow(
                params.page,
                params.limit,
                params.transactionType,
                params.paymentMethod,
                params.startDate,
                params.endDate,
                params.isReconciled
            );
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateCashFlowData) => warehouseService.createCashFlow(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-cash-flow'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-dashboard'] });
            globalToast.success('Cash flow entry recorded successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to record cash flow entry');
        }
    });

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setFormData({
            transactionType: 'CASH_IN',
            amount: 0,
            paymentMethod: 'CASH',
            description: '',
            referenceNumber: ''
        });
        setFormErrors({});
    };
    const handleExportCSV = async () => {
        setIsExportingCSV(true);
        try {
            const blob = await warehouseService.exportCashFlowToCSV({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                transactionType: filters.transactionType || undefined,
                paymentMethod: filters.paymentMethod || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `warehouse-cashflow-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            globalToast.success('Cash flow exported to CSV successfully');
        } catch (error) {
            globalToast.error('Failed to export cash flow to CSV');
            console.error('Export error:', error);
        } finally {
            setIsExportingCSV(false);
        }
    };

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await warehouseService.exportCashFlowToPDF({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                transactionType: filters.transactionType || undefined,
                paymentMethod: filters.paymentMethod || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `warehouse-cashflow-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            globalToast.success('Cash flow exported to PDF successfully');
        } catch (error) {
            globalToast.error('Failed to export cash flow to PDF');
            console.error('Export error:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };


    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.amount || formData.amount <= 0) {
            errors.amount = 'Amount must be greater than 0';
        }

        if (!formData.transactionType) {
            errors.transactionType = 'Transaction type is required';
        }

        if (!formData.paymentMethod) {
            errors.paymentMethod = 'Payment method is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        createMutation.mutate(formData);
    };

    const handleFilterChange = (key: keyof CashFlowFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    const clearFilters = () => {
        setFilters({
            transactionType: '',
            paymentMethod: '',
            startDate: '',
            endDate: '',
            isReconciled: ''
        });
        setCurrentPage(1);
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== undefined);

    // Quick filter buttons for common date ranges
    const setQuickFilter = (type: 'today' | 'week' | 'month' | 'year') => {
        const now = new Date();
        const startDate = new Date();

        switch (type) {
            case 'today':
                // Today: from start of day to now
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                // Last 7 days: from 7 days ago to now
                startDate.setDate(now.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                // Last 30 days: from 30 days ago to now
                startDate.setMonth(now.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'year':
                // This year: from start of year to now
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        setFilters(prev => ({
            ...prev,
            startDate: startDate.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0]
        }));
        setCurrentPage(1);
    };

    // Set filter to specific month
    const setMonthFilter = (month: number, year: number) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Last day of month

        setFilters(prev => ({
            ...prev,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        }));
        setCurrentPage(1);
    };

    // Set filter to specific year
    const setYearFilter = (year: number) => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        setFilters(prev => ({
            ...prev,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        }));
        setCurrentPage(1);
    };

    const cashFlowColumns = [
        {
            key: 'transactionType',
            title: 'Type',
            render: (value: string) => {
                const isInflow = value === 'CASH_IN';
                return (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${isInflow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {isInflow ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {isInflow ? 'INFLOW' : 'OUTFLOW'}
                    </span>
                );
            }
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (value: number, record: any) => (
                <span className={`font-bold ${record.transactionType === 'CASH_IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.transactionType === 'CASH_IN' ? '+' : '-'}₦{Number(value).toLocaleString()}
                </span>
            )
        },
        {
            key: 'paymentMethod',
            title: 'Payment Method',
            render: (value: string) => (
                <span className="text-sm text-gray-700">
                    {value.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            key: 'description',
            title: 'Description',
            render: (value: string) => (
                <span className="text-sm text-gray-600">{value || '-'}</span>
            )
        },
        {
            key: 'referenceNumber',
            title: 'Reference',
            render: (value: string) => (
                <span className="text-sm font-mono text-gray-500">{value || '-'}</span>
            )
        },
        {
            key: 'cashierUser',
            title: 'Cashier',
            render: (value: any) => (
                <span className="text-sm text-gray-700">{value?.username || '-'}</span>
            )
        },
        {
            key: 'createdAt',
            title: 'Date & Time',
            render: (value: string) => (
                <div className="text-sm">
                    <div>{new Date(value).toLocaleDateString()}</div>
                    <div className="text-gray-500">{new Date(value).toLocaleTimeString()}</div>
                </div>
            )
        }
    ];

    // Extract cash flow entries from the API response
    const cashFlowEntries = cashFlowData?.data?.cashFlowEntries || [];
    const pagination = cashFlowData?.data?.pagination;
    const summary = cashFlowData?.data?.summary;

    // Use summary from API if available, otherwise calculate from current page
    const totalInflow = summary?.totalInflow ?? cashFlowEntries
        .filter((entry: any) => entry.transactionType === 'CASH_IN')
        .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);

    const totalOutflow = summary?.totalOutflow ?? cashFlowEntries
        .filter((entry: any) => entry.transactionType === 'CASH_OUT')
        .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);

    const netCashFlow = summary?.netCashFlow ?? (totalInflow - totalOutflow);

    // Generate month/year options
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                        Cash Flow Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor and record all cash transactions
                    </p>
                </div>
                <div className="mt-4 flex gap-3 md:mt-0 md:ml-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                                {Object.values(filters).filter(v => v !== '' && v !== undefined).length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        disabled={isExportingCSV || !cashFlowEntries.length}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {isExportingCSV ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={isExportingPDF || !cashFlowEntries.length}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Transaction
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white shadow rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearFilters}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {/* Quick Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quick Filters
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setQuickFilter('today')}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setQuickFilter('week')}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Last 7 Days
                            </button>
                            <button
                                onClick={() => setQuickFilter('month')}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Last 30 Days
                            </button>
                            <button
                                onClick={() => setYearFilter(currentYear)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                This Year
                            </button>
                        </div>
                    </div>

                    {/* Month/Year Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Month
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    onChange={(e) => {
                                        const monthIndex = parseInt(e.target.value);
                                        if (!isNaN(monthIndex)) {
                                            const year = filters.startDate
                                                ? new Date(filters.startDate).getFullYear()
                                                : currentYear;
                                            setMonthFilter(monthIndex, year);
                                        }
                                    }}
                                    value={filters.startDate ? new Date(filters.startDate).getMonth() : ''}
                                >
                                    <option value="">Select Month</option>
                                    {months.map((month, index) => (
                                        <option key={index} value={index}>
                                            {month}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    onChange={(e) => {
                                        const year = parseInt(e.target.value);
                                        if (!isNaN(year)) {
                                            const month = filters.startDate
                                                ? new Date(filters.startDate).getMonth()
                                                : 0;
                                            setMonthFilter(month, year);
                                        }
                                    }}
                                    value={filters.startDate ? new Date(filters.startDate).getFullYear() : currentYear}
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by Year
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onChange={(e) => {
                                    const year = parseInt(e.target.value);
                                    if (!isNaN(year)) {
                                        setYearFilter(year);
                                    }
                                }}
                                value={filters.startDate ? new Date(filters.startDate).getFullYear() : ''}
                            >
                                <option value="">Select Year</option>
                                {years.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate || ''}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate || ''}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Other Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Transaction Type
                            </label>
                            <select
                                value={filters.transactionType || ''}
                                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="CASH_IN">Cash In (Inflow)</option>
                                <option value="CASH_OUT">Cash Out (Outflow)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={filters.paymentMethod || ''}
                                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">All Methods</option>
                                <option value="CASH">Cash</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                <option value="POS">POS</option>
                                <option value="CHECK">Check</option>
                                <option value="MOBILE_MONEY">Mobile Money</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
                            <div className="flex flex-wrap gap-2">
                                {filters.startDate && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        From: {new Date(filters.startDate).toLocaleDateString()}
                                        <button
                                            onClick={() => handleFilterChange('startDate', '')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.endDate && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        To: {new Date(filters.endDate).toLocaleDateString()}
                                        <button
                                            onClick={() => handleFilterChange('endDate', '')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.transactionType && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {filters.transactionType === 'CASH_IN' ? 'Inflow' : 'Outflow'}
                                        <button
                                            onClick={() => handleFilterChange('transactionType', '')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.paymentMethod && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {filters.paymentMethod.replace(/_/g, ' ')}
                                        <button
                                            onClick={() => handleFilterChange('paymentMethod', '')}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Inflow
                                    </dt>
                                    <dd className="text-2xl font-semibold text-green-600">
                                        ₦{totalInflow.toLocaleString()}
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
                                <TrendingDown className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Outflow
                                    </dt>
                                    <dd className="text-2xl font-semibold text-red-600">
                                        ₦{totalOutflow.toLocaleString()}
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
                                <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Net Cash Flow
                                    </dt>
                                    <dd className={`text-2xl font-semibold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ₦{netCashFlow.toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Cash Flow Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={cashFlowEntries}
                    columns={cashFlowColumns}
                    loading={isLoading}
                    emptyMessage="No cash flow records found"
                />

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                                disabled={currentPage === pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{pagination.totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                                        disabled={currentPage === pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Cash Flow Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={handleCloseModal}
                title="Record Cash Transaction"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Transaction Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transaction Type *
                        </label>
                        <select
                            value={formData.transactionType}
                            onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as 'CASH_IN' | 'CASH_OUT' })}
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${formErrors.transactionType
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                        >
                            <option value="CASH_IN">Cash In (Inflow)</option>
                            <option value="CASH_OUT">Cash Out (Outflow)</option>
                        </select>
                        {formErrors.transactionType && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.transactionType}</p>
                        )}
                    </div>

                    {/* Amount */}
                    <Input
                        label="Amount (₦) *"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        error={formErrors.amount}
                        required
                    />

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method *
                        </label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${formErrors.paymentMethod
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                        >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="POS">POS</option>
                            <option value="CHECK">Check</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                        </select>
                        {formErrors.paymentMethod && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.paymentMethod}</p>
                        )}
                    </div>

                    {/* Reference Number */}
                    <Input
                        label="Reference Number"
                        type="text"
                        placeholder="e.g., WS-001-2024"
                        value={formData.referenceNumber || ''}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={3}
                            placeholder="Describe this transaction..."
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={createMutation.isPending}
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Transaction
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};