/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/ExpenseApprovals.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, DollarSign, Filter } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { ExpenseStatus } from '../../types/transport';

export const ExpenseApprovals: React.FC = () => {
    const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalNotes, setApprovalNotes] = useState('');

    // ✅ ADD: Status filter
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>(ExpenseStatus.PENDING);

    const queryClient = useQueryClient();

    // ✅ UPDATED: Fetch expenses with status filter
    const { data: expensesData, isLoading } = useQuery({
        queryKey: ['transport-expenses-filtered', statusFilter],
        queryFn: () => transportService.getExpenses({
            page: 1,
            limit: 100,
            status: statusFilter || undefined
        }),
        refetchInterval: statusFilter === ExpenseStatus.PENDING ? 30000 : undefined // Only auto-refresh for pending
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
            transportService.approveExpense(id, notes),
        onSuccess: () => {
            globalToast.success('Expense approved successfully!');
            queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['transport-expenses-filtered'] });
            setApproveModalOpen(false);
            setCurrentExpenseId(null);
            setApprovalNotes('');
            setSelectedExpenses([]);
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to approve expense');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            transportService.rejectExpense(id, reason),
        onSuccess: () => {
            globalToast.success('Expense rejected');
            queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['transport-expenses-filtered'] });
            setRejectModalOpen(false);
            setCurrentExpenseId(null);
            setRejectionReason('');
            setSelectedExpenses([]);
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to reject expense');
        }
    });

    const bulkApproveMutation = useMutation({
        mutationFn: (data: { expenseIds: string[]; notes?: string }) =>
            transportService.bulkApproveExpenses(data),
        onSuccess: () => {
            globalToast.success(`${selectedExpenses.length} expenses approved successfully!`);
            queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['transport-expenses-filtered'] });
            setSelectedExpenses([]);
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to approve expenses');
        }
    });

    const handleApprove = (id: string) => {
        setCurrentExpenseId(id);
        setApproveModalOpen(true);
    };

    const handleReject = (id: string) => {
        setCurrentExpenseId(id);
        setRejectModalOpen(true);
    };

    const confirmApprove = () => {
        if (currentExpenseId) {
            approveMutation.mutate({ id: currentExpenseId, notes: approvalNotes });
        }
    };

    const confirmReject = () => {
        if (currentExpenseId && rejectionReason.trim()) {
            rejectMutation.mutate({ id: currentExpenseId, reason: rejectionReason });
        } else {
            globalToast.error('Please provide a rejection reason');
        }
    };

    const handleBulkApprove = () => {
        if (selectedExpenses.length === 0) {
            globalToast.error('Please select expenses to approve');
            return;
        }
        bulkApproveMutation.mutate({ expenseIds: selectedExpenses });
    };

    const toggleSelectExpense = (id: string) => {
        setSelectedExpenses(prev =>
            prev.includes(id) ? prev.filter(expId => expId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const allIds = expensesData?.data?.expenses?.map((exp: any) => exp.id) || [];
        setSelectedExpenses(prev =>
            prev.length === allIds.length ? [] : allIds
        );
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            [ExpenseStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            [ExpenseStatus.APPROVED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            [ExpenseStatus.REJECTED]: { color: 'bg-red-100 text-red-800', icon: XCircle }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[ExpenseStatus.PENDING];
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {status}
            </span>
        );
    };

    const expenseColumns = [
        // ✅ Only show checkbox for pending expenses
        ...(statusFilter === ExpenseStatus.PENDING ? [{
            key: 'select',
            title: '', // ✅ FIXED: Changed from JSX Element to empty string
            render: (_: any, record: any) => (
                <input
                    type="checkbox"
                    checked={selectedExpenses.includes(record.id)}
                    onChange={() => toggleSelectExpense(record.id)}
                    className="rounded border-gray-300"
                />
            )
        }] : []),
        {
            key: 'expenseDate',
            title: 'Date',
            render: (value: string) => format(new Date(value), 'MMM dd, yyyy')
        },
        {
            key: 'expenseType',
            title: 'Type',
            render: (value: string) => (
                <span className={`px-2 py-1 text-xs font-medium rounded ${value === 'TRIP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                    {value === 'TRIP' ? 'Trip' : 'Non-Trip'}
                </span>
            )
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
            render: (value: number) => ( // ✅ FIXED: Keep as number parameter
                <span className="font-semibold text-gray-900">
                    ₦{Number(value).toLocaleString()} {/* ✅ FIXED: Convert to Number explicitly */}
                </span>
            )
        },
        {
            key: 'truck',
            title: 'Truck',
            render: (value: any) => value?.registrationNumber || 'N/A'
        },
        {
            key: 'createdByUser',
            title: 'Requested By',
            render: (value: any) => value?.username || 'N/A'
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => getStatusBadge(value)
        },
        // ✅ Only show actions for pending expenses
        ...(statusFilter === ExpenseStatus.PENDING ? [{
            key: 'id',
            title: 'Actions',
            render: (value: string) => (
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(value)}
                        className="text-green-600 hover:text-green-700"
                    >
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(value)}
                        className="text-red-600 hover:text-red-700"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            )
        }] : [])
    ];

    const pendingCount = statusFilter === ExpenseStatus.PENDING ? expensesData?.data?.expenses?.length || 0 : 0;
    const totalAmount = expensesData?.data?.expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Expense Approvals</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Review and approve pending transport expenses
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-yellow-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Pending Approval
                                    </dt>
                                    <dd className="text-3xl font-semibold text-gray-900">
                                        {pendingCount}
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
                                        Total Amount
                                    </dt>
                                    <dd className="text-3xl font-semibold text-gray-900">
                                        ₦{totalAmount.toLocaleString()}
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
                                <CheckCircle className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Selected
                                    </dt>
                                    <dd className="text-3xl font-semibold text-gray-900">
                                        {selectedExpenses.length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ NEW: Status Filter Tabs */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                setStatusFilter(ExpenseStatus.PENDING);
                                setSelectedExpenses([]);
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === ExpenseStatus.PENDING
                                ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Clock className="inline h-4 w-4 mr-1" />
                            Pending
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter(ExpenseStatus.APPROVED);
                                setSelectedExpenses([]);
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === ExpenseStatus.APPROVED
                                ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Approved
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter(ExpenseStatus.REJECTED);
                                setSelectedExpenses([]);
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === ExpenseStatus.REJECTED
                                ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <XCircle className="inline h-4 w-4 mr-1" />
                            Rejected
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter('');
                                setSelectedExpenses([]);
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === ''
                                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions - Only show for pending */}
            {statusFilter === ExpenseStatus.PENDING && selectedExpenses.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                            {selectedExpenses.length} expense(s) selected
                        </span>
                        <Button
                            onClick={handleBulkApprove}
                            disabled={bulkApproveMutation.isPending}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Selected
                        </Button>
                    </div>
                </div>
            )}

            {/* Expenses Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                            {statusFilter === ExpenseStatus.PENDING && 'Pending Expenses'}
                            {statusFilter === ExpenseStatus.APPROVED && 'Approved Expenses'}
                            {statusFilter === ExpenseStatus.REJECTED && 'Rejected Expenses'}
                            {statusFilter === '' && 'All Expenses'}
                        </h3>
                        {/* ✅ ADD: Select All checkbox for pending expenses */}
                        {statusFilter === ExpenseStatus.PENDING && expensesData?.data?.expenses && expensesData.data.expenses.length > 0 && (
                            <label className="flex items-center space-x-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={selectedExpenses.length === (expensesData?.data?.expenses?.length || 0) && selectedExpenses.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300"
                                />
                                <span>Select All</span>
                            </label>
                        )}
                    </div>
                </div>
                <Table
                    data={expensesData?.data?.expenses || []}
                    columns={expenseColumns}
                    loading={isLoading}
                    emptyMessage={`No ${statusFilter.toLowerCase() || 'expenses'} found`}
                />
            </div>

            {/* Approve Modal */}
            <Modal
                isOpen={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                title="Approve Expense"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to approve this expense?
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Approval Notes (Optional)
                        </label>
                        <textarea
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Add any notes about this approval..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setApproveModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmApprove}
                            disabled={approveMutation.isPending}
                        >
                            Approve
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                title="Reject Expense"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for rejecting this expense.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason *
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Explain why this expense is being rejected..."
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setRejectModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmReject}
                            disabled={rejectMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Reject
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};