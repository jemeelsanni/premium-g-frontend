/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/ExpensesList.tsx - SIMPLIFIED VERSION WITH ALWAYS-VISIBLE FILTERS

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Download, Eye, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { ExpenseStatus, ExpenseType } from '../../types/transport';
import { format } from 'date-fns';

export const ExpensesList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<ExpenseType | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const pageSize = 10;

    const { data: expensesData, isLoading, error } = useQuery({
        queryKey: ['transport-expenses', currentPage, statusFilter, typeFilter, startDate, endDate],
        queryFn: () => transportService.getExpenses({
            page: currentPage,
            limit: pageSize,
            status: statusFilter || undefined,
            expenseType: typeFilter || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        }),
    });

    const handleExport = async () => {
        try {
            const blob = await transportService.exportExpensesToCSV({
                status: statusFilter || undefined,
                expenseType: typeFilter || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transport-expenses-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleClearFilters = () => {
        setStatusFilter('');
        setTypeFilter('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            [ExpenseStatus.PENDING]: {
                color: 'bg-yellow-100 text-yellow-800',
                icon: Clock,
                label: 'Pending'
            },
            [ExpenseStatus.APPROVED]: {
                color: 'bg-green-100 text-green-800',
                icon: CheckCircle,
                label: 'Approved'
            },
            [ExpenseStatus.REJECTED]: {
                color: 'bg-red-100 text-red-800',
                icon: XCircle,
                label: 'Rejected'
            }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[ExpenseStatus.PENDING];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        return type === 'TRIP'
            ? <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Trip</span>
            : <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">Non-Trip</span>;
    };

    const expenseColumns = [
        {
            key: 'expenseDate',
            title: 'Date',
            render: (value: string) => format(new Date(value), 'MMM dd, yyyy')
        },
        {
            key: 'expenseType',
            title: 'Type',
            render: (value: string) => getTypeBadge(value)
        },
        {
            key: 'category',
            title: 'Category',
            render: (value: string) => <span className="font-medium">{value}</span>
        },
        {
            key: 'description',
            title: 'Description',
            render: (value: string) => (
                <span className="text-sm text-gray-600 truncate max-w-xs block">{value}</span>
            )
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (value: number) => (
                <span className="font-semibold text-gray-900">
                    ₦{value.toLocaleString()}
                </span>
            )
        },
        {
            key: 'truck',
            title: 'Truck',
            render: (value: any) => value?.registrationNumber || 'N/A'
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => getStatusBadge(value)
        },
        {
            key: 'id',
            title: 'Actions',
            render: (value: string) => (
                <Link
                    to={`/transport/expenses/${value}`}
                    className="text-blue-600 hover:text-blue-800"
                >
                    <Eye className="h-4 w-4" />
                </Link>
            )
        }
    ];

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600">Failed to load expenses</p>
                </div>
            </div>
        );
    }

    const hasActiveFilters = statusFilter || typeFilter || startDate || endDate;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Transport Expenses
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage trip and non-trip expenses for your transport operations
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Link to="/transport/expenses/create">
                        <Button className="inline-flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            New Expense
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats - Clickable Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <button
                    onClick={() => {
                        setStatusFilter('');
                        setCurrentPage(1);
                    }}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow text-left ${statusFilter === '' ? 'ring-2 ring-blue-500' : ''
                        }`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-blue-500 p-3">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        All Expenses
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {statusFilter === '' ? expensesData?.data?.pagination?.total || 0 : '-'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => {
                        setStatusFilter(ExpenseStatus.PENDING);
                        setCurrentPage(1);
                    }}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow text-left ${statusFilter === ExpenseStatus.PENDING ? 'ring-2 ring-yellow-500' : ''
                        }`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-yellow-500 p-3">
                                    <Clock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Pending
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {statusFilter === ExpenseStatus.PENDING ? expensesData?.data?.pagination?.total || 0 : '-'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => {
                        setStatusFilter(ExpenseStatus.APPROVED);
                        setCurrentPage(1);
                    }}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow text-left ${statusFilter === ExpenseStatus.APPROVED ? 'ring-2 ring-green-500' : ''
                        }`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-green-500 p-3">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Approved
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {statusFilter === ExpenseStatus.APPROVED ? expensesData?.data?.pagination?.total || 0 : '-'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => {
                        setStatusFilter(ExpenseStatus.REJECTED);
                        setCurrentPage(1);
                    }}
                    className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow text-left ${statusFilter === ExpenseStatus.REJECTED ? 'ring-2 ring-red-500' : ''
                        }`}
                >
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="rounded-md bg-red-500 p-3">
                                    <XCircle className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Rejected
                                    </dt>
                                    <dd className="text-lg font-semibold text-gray-900">
                                        {statusFilter === ExpenseStatus.REJECTED ? expensesData?.data?.pagination?.total || 0 : '-'}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Filters - Always Visible */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center mb-3">
                    <Filter className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as ExpenseStatus | '');
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value={ExpenseStatus.PENDING}>Pending</option>
                            <option value={ExpenseStatus.APPROVED}>Approved</option>
                            <option value={ExpenseStatus.REJECTED}>Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value as ExpenseType | '');
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            <option value="">All Types</option>
                            <option value={ExpenseType.TRIP}>Trip Expenses</option>
                            <option value={ExpenseType.NON_TRIP}>Non-Trip Expenses</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={handleClearFilters}
                            className="w-full"
                            disabled={!hasActiveFilters}
                        >
                            Clear All
                        </Button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-medium text-gray-500">Active:</span>
                            {statusFilter && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Status: {statusFilter}
                                </span>
                            )}
                            {typeFilter && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Type: {typeFilter}
                                </span>
                            )}
                            {startDate && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    From: {startDate}
                                </span>
                            )}
                            {endDate && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    To: {endDate}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg">
                <Table
                    data={expensesData?.data?.expenses || []}
                    columns={expenseColumns}
                    loading={isLoading}
                    emptyMessage="No expenses found"
                />

                {/* Pagination */}
                {expensesData?.data?.pagination && expensesData.data.pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{expensesData.data.pagination.totalPages}</span>
                                    {' '}({expensesData.data.pagination.total} total expenses)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-l-md"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage === expensesData.data.pagination.totalPages}
                                        className="rounded-r-md"
                                    >
                                        Next
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};