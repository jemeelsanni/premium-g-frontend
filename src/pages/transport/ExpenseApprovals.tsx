/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/ExpenseApprovals.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export const ExpenseApprovals: React.FC = () => {
    const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [approvalNotes, setApprovalNotes] = useState('');

    const queryClient = useQueryClient();

    const { data: expensesData, isLoading } = useQuery({
        queryKey: ['transport-expenses-pending'],
        queryFn: () => transportService.getExpenses({
            page: 1,
            limit: 100,
            status: 'PENDING'
        }),
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
            transportService.approveExpense(id, notes),
        onSuccess: () => {
            globalToast.success('Expense approved successfully!');
            queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
            queryClient.invalidateQueries({ queryKey: ['transport-expenses-pending'] });
            setApproveModalOpen(false);
            setCurrentExpenseId(null);
            setApprovalNotes('');
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
            queryClient.invalidateQueries({ queryKey: ['transport-expenses-pending'] });
            setRejectModalOpen(false);
            setCurrentExpenseId(null);
            setRejectionReason('');
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
            queryClient.invalidateQueries({ queryKey: ['transport-expenses-pending'] });
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

    const expenseColumns = [
        {
            key: 'select',
            title: (
                <input
                    type="checkbox"
                    checked={selectedExpenses.length === (expensesData?.data?.expenses?.length || 0) && selectedExpenses.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                />
            ),
            render: (_: any, record: any) => (
                <input
                    type="checkbox"
                    checked={selectedExpenses.includes(record.id)}
                    onChange={() => toggleSelectExpense(record.id)}
                    className="rounded border-gray-300"
                />
            )
        },
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
            key: 'createdByUser',
            title: 'Requested By',
            render: (value: any) => value?.username || 'Unknown'
        },
        {
            key: 'id',
            title: 'Actions',
            render: (value: string) => (
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(value)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                        <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(value)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    const pendingExpenses = expensesData?.data?.expenses || [];
    const totalPendingAmount = pendingExpenses.reduce(
        (sum: number, exp: any) => sum + parseFloat(exp.amount),
        0
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Expense Approvals
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Review and approve pending transport expenses
                    </p>
                </div>
                {selectedExpenses.length > 0 && (
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Button
                            onClick={handleBulkApprove}
                            disabled={bulkApproveMutation.isPending}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Selected ({selectedExpenses.length})
                        </Button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                            <p className="text-2xl font-bold text-gray-900">{pendingExpenses.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₦{totalPendingAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Selected</p>
                            <p className="text-2xl font-bold text-gray-900">{selectedExpenses.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Pending Expenses
                    </h3>
                </div>
                <div className="p-6">
                    <Table
                        data={pendingExpenses}
                        columns={expenseColumns}
                        loading={isLoading}
                        emptyMessage="No pending expenses"
                    />
                </div>
            </div>

            {/* Approve Modal */}
            <Modal
                isOpen={approveModalOpen}
                onClose={() => {
                    setApproveModalOpen(false);
                    setApprovalNotes('');
                }}
                title="Approve Expense"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to approve this expense?
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Add any approval notes..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setApproveModalOpen(false);
                                setApprovalNotes('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmApprove}
                            disabled={approveMutation.isPending}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {approveMutation.isPending ? 'Approving...' : 'Approve'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={rejectModalOpen}
                onClose={() => {
                    setRejectModalOpen(false);
                    setRejectionReason('');
                }}
                title="Reject Expense"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for rejecting this expense.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Explain why this expense is being rejected..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectModalOpen(false);
                                setRejectionReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmReject}
                            disabled={rejectMutation.isPending || !rejectionReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};