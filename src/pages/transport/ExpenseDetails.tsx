/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign, FileText, Truck, MapPin, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

export const ExpenseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: expense, isLoading, error } = useQuery({
        queryKey: ['transport-expense', id],
        queryFn: () => transportService.getExpense(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !expense) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600">Failed to load expense details</p>
                    <Button onClick={() => navigate('/transport/expenses')} className="mt-4">
                        Back to Expenses
                    </Button>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
            APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
            REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="h-4 w-4 mr-1" />
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        return type === 'TRIP'
            ? <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">Trip Expense</span>
            : <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">Non-Trip Expense</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/transport/expenses')}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Expense Details</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Created {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {getStatusBadge(expense.status)}
                    {getTypeBadge(expense.expenseType)}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Amount Card */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">
                                    ₦{expense.amount.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    {/* Expense Information */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Information</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="flex items-center text-sm font-medium text-gray-500">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Category
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{expense.category}</dd>
                            </div>
                            <div>
                                <dt className="flex items-center text-sm font-medium text-gray-500">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Expense Date
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                                </dd>
                            </div>
                            {expense.truck && (
                                <div>
                                    <dt className="flex items-center text-sm font-medium text-gray-500">
                                        <Truck className="h-4 w-4 mr-2" />
                                        Truck
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                        {expense.truck.registrationNumber}
                                    </dd>
                                </div>
                            )}
                            {expense.location && (
                                <div>
                                    <dt className="flex items-center text-sm font-medium text-gray-500">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Location
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">{expense.location.name}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Description */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{expense.description}</p>
                    </div>

                    {/* Approval Notes (if any) */}
                    {expense.approvalNotes && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                {expense.status === 'APPROVED' ? 'Approval Notes' : 'Rejection Reason'}
                            </h3>
                            <p className="text-sm text-gray-700">{expense.approvalNotes}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Metadata */}
                <div className="space-y-6">
                    {/* Status Timeline */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                                        <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">Created</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(expense.createdAt), 'MMM dd, yyyy HH:mm')}
                                    </p>
                                    {expense.createdByUser && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            by {expense.createdByUser.username}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {expense.status === 'APPROVED' && expense.approvedAt && (
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">Approved</p>
                                        <p className="text-xs text-gray-500">
                                            {format(new Date(expense.approvedAt), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                        {expense.approver && (  // ✅ Changed from approvedByUser to approver
                                            <p className="text-xs text-gray-600 mt-1">
                                                by {expense.approver.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {expense.status === 'REJECTED' && expense.approvalNotes && (  // ✅ Note: no rejectedAt field
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100">
                                            <XCircle className="h-4 w-4 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">Rejected</p>
                                        {/* Note: The Expense model doesn't have rejectedAt field */}
                                        {expense.approver && (  // ✅ Rejections also use the approver field
                                            <p className="text-xs text-gray-600 mt-1">
                                                by {expense.approver.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Status</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Paid</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${expense.isPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {expense.isPaid ? 'Yes' : 'No'}
                            </span>
                        </div>
                        {expense.isPaid && expense.paidAt && (
                            <p className="text-xs text-gray-500 mt-2">
                                Paid on {format(new Date(expense.paidAt), 'MMM dd, yyyy')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};