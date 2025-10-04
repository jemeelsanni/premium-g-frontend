/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/ExpensesList.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Download, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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

    const getStatusBadge = (status: string) => {
        const baseClasses = 'inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full';
        switch (status) {
            case 'APPROVED':
                return (
                    <span className={`${baseClasses} bg-green-100 text-green-800`}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className={`${baseClasses} bg-red-100 text-red-800`}>
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                    </span>
                );
            case 'PENDING':
                return (
                    <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </span>
                );
            default:
                return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
        }
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

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4">
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
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
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
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="TRIP">Trip Expenses</option>
                            <option value="NON_TRIP">Non-Trip Expenses</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStatusFilter('');
                                setTypeFilter('');
                                setStartDate('');
                                setEndDate('');
                                setCurrentPage(1);
                            }}
                            className="w-full"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Expense Records
                    </h3>
                </div>
                <div className="p-6">
                    <Table
                        data={expensesData?.data?.expenses || []}
                        columns={expenseColumns}
                        loading={isLoading}
                        emptyMessage="No expenses found"
                    />
                </div>

                {/* Pagination */}
                {expensesData?.pagination && expensesData.pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing page {expensesData.data.pagination.page} of {expensesData.data.pagination.pages}
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage >= (expensesData.pagination.totalPages || 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};