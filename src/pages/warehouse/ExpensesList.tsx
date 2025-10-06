/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, AlertCircle, Plus } from 'lucide-react';

import { warehouseService } from '../../services/warehouseService';
import { WarehouseExpense } from '../../types/warehouse';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { globalToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

const statusOptions: Array<{ value: WarehouseExpense['status']; label: string }> = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PAID', label: 'Paid' }
];

const expenseTypeOptions: Array<{ value: string; label: string }> = [
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'RENT', label: 'Rent' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'SUPPLIES', label: 'Supplies' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'INVENTORY_PROCUREMENT', label: 'Inventory Procurement' },
    { value: 'PACKAGING_MATERIALS', label: 'Packaging Materials' },
    { value: 'SECURITY', label: 'Security' },
    { value: 'CLEANING_SERVICES', label: 'Cleaning Services' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'OTHER', label: 'Other' }
];

const pageSize = 10;

export const ExpensesList: React.FC = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    const [statusFilter, setStatusFilter] = useState<'' | WarehouseExpense['status']>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        expenseType: '',
        category: '',
        amount: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const { data, isLoading, isError } = useQuery({
        queryKey: ['warehouse-expenses', currentPage, statusFilter],
        queryFn: () => warehouseService.getExpenses({
            page: currentPage,
            limit: pageSize,
            status: statusFilter || undefined
        }),
        keepPreviousData: true
    });

    const expenses: WarehouseExpense[] = data?.data?.expenses || [];
    const pagination = data?.data?.pagination;
    const totalPages = pagination?.totalPages || 1;

    const updateStatusMutation = useMutation({
        mutationFn: ({
            id,
            status,
            rejectionReason
        }: {
            id: string;
            status: WarehouseExpense['status'];
            rejectionReason?: string;
        }) => warehouseService.updateExpenseStatus(id, status, { rejectionReason }),
        onSuccess: (_, variables) => {
            const message = variables.status === 'APPROVED'
                ? 'Expense approved successfully'
                : variables.status === 'REJECTED'
                    ? 'Expense rejected'
                    : 'Expense updated';
            globalToast.success(message);
            queryClient.invalidateQueries({ queryKey: ['warehouse-expenses'] });
        },
        onError: (error: any) => {
            globalToast.error(error?.response?.data?.message || 'Failed to update expense');
        }
    });

    const createExpenseMutation = useMutation({
        mutationFn: () => {
            const payload = {
                expenseType: createForm.expenseType,
                category: createForm.category,
                amount: Number(createForm.amount) || 0,
                description: createForm.description || undefined
            };
            return warehouseService.createExpense(payload);
        },
        onSuccess: () => {
            globalToast.success('Expense recorded and pending approval.');
            queryClient.invalidateQueries({ queryKey: ['warehouse-expenses'] });
            setShowCreateModal(false);
            setCreateForm({ expenseType: '', category: '', amount: '', description: '' });
            setFormErrors({});
        },
        onError: (error: any) => {
            globalToast.error(error?.response?.data?.message || 'Failed to record expense');
        }
    });

    const formatAmount = (amount: number | string) => {
        const numeric = typeof amount === 'number' ? amount : Number(amount);
        if (Number.isNaN(numeric)) {
            return '₦0.00';
        }
        return `₦${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const statusBadge = (status: WarehouseExpense['status']) => {
        const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
        switch (status) {
            case 'APPROVED':
                return (
                    <span className={`${base} bg-green-100 text-green-800`}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className={`${base} bg-red-100 text-red-800`}>
                        <XCircle className="mr-1 h-3 w-3" /> Rejected
                    </span>
                );
            case 'PAID':
                return <span className={`${base} bg-blue-100 text-blue-800`}>Paid</span>;
            default:
                return (
                    <span className={`${base} bg-yellow-100 text-yellow-800`}>
                        <Clock className="mr-1 h-3 w-3" /> Pending
                    </span>
                );
        }
    };

    const validateCreateForm = () => {
        const errors: Record<string, string> = {};

        if (!createForm.expenseType) {
            errors.expenseType = 'Select an expense type';
        }
        if (!createForm.category.trim()) {
            errors.category = 'Category is required';
        }
        const amountValue = Number(createForm.amount);
        if (!createForm.amount || Number.isNaN(amountValue) || amountValue <= 0) {
            errors.amount = 'Enter a valid amount';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateExpense = (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateCreateForm()) {
            return;
        }
        createExpenseMutation.mutate();
    };

    const handleApprove = (expense: WarehouseExpense) => {
        if (!isSuperAdmin) {
            globalToast.error('Only Super Admins can approve expenses.');
            return;
        }
        updateStatusMutation.mutate({ id: expense.id, status: 'APPROVED' });
    };

    const handleReject = (expense: WarehouseExpense) => {
        if (!isSuperAdmin) {
            globalToast.error('Only Super Admins can reject expenses.');
            return;
        }
        const reason = window.prompt('Provide a reason for rejection:')?.trim();
        if (!reason) {
            globalToast.error('Rejection reason is required.');
            return;
        }
        updateStatusMutation.mutate({ id: expense.id, status: 'REJECTED', rejectionReason: reason });
    };

    const expenseColumns = [
        {
            key: 'createdAt',
            title: 'Logged On',
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'expenseType',
            title: 'Type',
            render: (value: string) => (
                <span className="font-medium text-gray-900 uppercase tracking-wide text-xs">
                    {value.replace(/_/g, ' ')}
                </span>
            )
        },
        {
            key: 'category',
            title: 'Category',
            render: (value: string) => <span className="text-sm text-gray-700">{value}</span>
        },
        {
            key: 'description',
            title: 'Description',
            render: (value: string | undefined) => (
                <span className="text-sm text-gray-600">
                    {value || 'No additional notes'}
                </span>
            )
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (value: number | string) => (
                <span className="font-semibold text-gray-900">{formatAmount(value)}</span>
            )
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: WarehouseExpense['status']) => statusBadge(value)
        },
        {
            key: 'id',
            title: 'Actions',
            render: (_value: string, record: WarehouseExpense) => {
                if (!isSuperAdmin) {
                    return (
                        <span className="text-xs text-gray-500">
                            Awaiting super admin approval
                        </span>
                    );
                }

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(record)}
                            disabled={updateStatusMutation.isPending || record.status === 'APPROVED'}
                        >
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(record)}
                            disabled={updateStatusMutation.isPending || record.status === 'REJECTED'}
                        >
                            Reject
                        </Button>
                    </div>
                );
            }
        }
    ];

    if (isError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
                    <p className="text-gray-600">Unable to load warehouse expenses.</p>
                </div>
            </div>
        );
    }

    const Pagination = () => (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{expenses.length}</span> of{' '}
                    <span className="font-medium">{pagination?.total || 0}</span> expenses
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                        Warehouse Expenses
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Track expenses and submit for Super Admin approval.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <Button
                        className="inline-flex items-center"
                        onClick={() => {
                            setShowCreateModal(true);
                            setFormErrors({});
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Record Expense
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                Only Super Admins can approve or reject warehouse expenses. Submit your expenses and
                they will remain pending until a Super Admin reviews them.
            </div>

            <div className="bg-white shadow rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value as WarehouseExpense['status'] | '');
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All statuses</option>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={expenses}
                    columns={expenseColumns}
                    loading={isLoading || updateStatusMutation.isPending}
                    emptyMessage="No expenses recorded yet"
                />
                <Pagination />
            </div>

            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    if (!createExpenseMutation.isPending) {
                        setShowCreateModal(false);
                        setFormErrors({});
                    }
                }}
                title="Record Warehouse Expense"
                maxWidth="lg"
            >
                <form onSubmit={handleCreateExpense} className="space-y-4">
                    <Select
                        label="Expense Type *"
                        placeholder="Select type"
                        options={expenseTypeOptions}
                        value={createForm.expenseType}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, expenseType: event.target.value }))}
                        error={formErrors.expenseType}
                    />

                    <Input
                        label="Category *"
                        placeholder="e.g. Warehouse utilities"
                        value={createForm.category}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, category: event.target.value }))}
                        error={formErrors.category}
                    />

                    <Input
                        label="Amount (₦) *"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={createForm.amount}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, amount: event.target.value }))}
                        error={formErrors.amount}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={3}
                            placeholder="Optional notes about this expense"
                            value={createForm.description}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (!createExpenseMutation.isPending) {
                                    setShowCreateModal(false);
                                    setFormErrors({});
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={createExpenseMutation.isPending}
                        >
                            Submit for Approval
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ExpensesList;
