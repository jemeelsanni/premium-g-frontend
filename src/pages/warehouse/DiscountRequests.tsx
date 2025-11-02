/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/DiscountRequests.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Check, X, Filter } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
// import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';

const discountRequestSchema = z.object({
    warehouseCustomerId: z.string().min(1, 'Customer is required'),
    productId: z.string().optional(),
    requestedDiscountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    requestedDiscountValue: z.number().min(0.01, 'Discount value must be greater than 0'),
    minimumQuantity: z.number().min(1).optional(),
    maximumDiscountAmount: z.number().min(0).optional(),
    validFrom: z.string().min(1, 'Valid from date is required'),
    validUntil: z.string().optional(),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    businessJustification: z.string().optional(),
});

type DiscountRequestFormData = z.infer<typeof discountRequestSchema>;

export const DiscountRequests: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const queryClient = useQueryClient();
    const pageSize = 20;
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<DiscountRequestFormData>({
        resolver: zodResolver(discountRequestSchema),
    });

    // Fetch discount requests
    const { data: requestsData, isLoading } = useQuery({
        queryKey: ['discount-requests', currentPage, pageSize, statusFilter],
        queryFn: () => warehouseService.getDiscountRequests(currentPage, pageSize, statusFilter),
    });

    // Fetch customers
    const { data: customersData } = useQuery({
        queryKey: ['warehouse-customers'],
        queryFn: () => warehouseService.getCustomers(1, 100),
    });

    // Fetch products
    const { data: products } = useQuery({
        queryKey: ['warehouse-products'],
        queryFn: () => warehouseService.getProducts(),
    });

    // Create discount request mutation
    const createRequestMutation = useMutation({
        mutationFn: (data: DiscountRequestFormData) => warehouseService.requestDiscount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discount-requests'] });
            globalToast.success('Discount request submitted successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to submit discount request');
        }
    });

    // Review discount request mutation
    const reviewRequestMutation = useMutation({
        mutationFn: ({ id, action, data }: { id: string; action: 'approve' | 'reject'; data: any }) =>
            warehouseService.reviewDiscountRequest(id, action, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['discount-requests'] });
            globalToast.success(`Discount request ${variables.action}d successfully!`);
            setIsReviewModalOpen(false);
            setSelectedRequest(null);
            setAdminNotes('');
            setRejectionReason('');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to review discount request');
        }
    });

    const handleCloseModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const onSubmit = (data: DiscountRequestFormData) => {
        createRequestMutation.mutate(data);
    };

    const handleReview = (request: any, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setReviewAction(action);
        setIsReviewModalOpen(true);
    };

    const handleConfirmReview = () => {
        if (!selectedRequest) return;

        reviewRequestMutation.mutate({
            id: selectedRequest.id,
            action: reviewAction,
            data: {
                adminNotes,
                rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined
            }
        });
    };

    const columns = [
        {
            key: 'customer',
            title: 'Customer',
            render: (record: any) => (
                <div>
                    <p className="font-medium">{record.warehouseCustomer?.name}</p>
                    <p className="text-xs text-gray-500">{record.warehouseCustomer?.customerType}</p>
                </div>
            )
        },
        {
            key: 'product',
            title: 'Product',
            render: (record: any) => record.product?.name || 'General Discount'
        },
        {
            key: 'discountDetails',
            title: 'Discount Details',
            render: (record: any) => (
                <div>
                    <p className="font-medium">
                        {record.requestedDiscountType === 'PERCENTAGE'
                            ? `${record.requestedDiscountValue}%`
                            : `₦${record.requestedDiscountValue.toLocaleString()}`}
                    </p>
                    {record.minimumQuantity && (
                        <p className="text-xs text-gray-500">Min Qty: {record.minimumQuantity}</p>
                    )}
                </div>
            )
        },
        {
            key: 'reason',
            title: 'Reason',
            render: (value: string) => (
                <div className="max-w-xs truncate" title={value}>
                    {value}
                </div>
            )
        },
        {
            key: 'requestedBy',
            title: 'Requested By',
            render: (record: any) => record.requestedByUser?.username
        },
        {
            key: 'createdAt',
            title: 'Date Requested',
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => {
                const statusColors: any = {
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    APPROVED: 'bg-green-100 text-green-800',
                    REJECTED: 'bg-red-100 text-red-800'
                };
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[value]}`}>
                        {value}
                    </span>
                );
            }
        }
    ];

    // Add actions column for super admin
    if (isSuperAdmin && statusFilter === 'PENDING') {
        columns.push({
            key: 'actions',
            title: 'Actions',
            render: (record: any) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(record, 'approve')}
                        className="inline-flex items-center text-green-600 hover:bg-green-50"
                    >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(record, 'reject')}
                        className="inline-flex items-center text-red-600 hover:bg-red-50"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                    </Button>
                </div>
            )
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Discount Requests
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage customer discount requests and approvals
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Request Discount
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <div className="flex gap-2">
                        {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status as any);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${statusFilter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    columns={columns}
                    data={requestsData?.data?.requests || []}
                    loading={isLoading}
                />

                {/* Pagination */}
                {requestsData && requestsData.data.pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-700">
                                Page {requestsData.data.pagination.page} of {requestsData.data.pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={currentPage === requestsData.data.pagination.totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Request Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Request Customer Discount"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer *
                        </label>
                        <select
                            {...register('warehouseCustomerId')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select a customer</option>
                            {customersData?.data?.customers?.map((customer: any) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.customerType}
                                </option>
                            ))}
                        </select>
                        {errors.warehouseCustomerId && (
                            <p className="mt-1 text-sm text-red-600">{errors.warehouseCustomerId.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product (Optional - leave blank for general discount)
                        </label>
                        <select
                            {...register('productId')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">General Discount (All Products)</option>
                            {products?.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} - {product.productNo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Type *
                            </label>
                            <select
                                {...register('requestedDiscountType')}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED_AMOUNT">Fixed Amount</option>
                            </select>
                            {errors.requestedDiscountType && (
                                <p className="mt-1 text-sm text-red-600">{errors.requestedDiscountType.message}</p>
                            )}
                        </div>

                        <Input
                            label="Discount Value *"
                            type="number"
                            step="0.01"
                            {...register('requestedDiscountValue', { valueAsNumber: true })}
                            error={errors.requestedDiscountValue?.message}
                            placeholder="e.g., 15 or 500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Minimum Quantity"
                            type="number"
                            {...register('minimumQuantity', { valueAsNumber: true })}
                            error={errors.minimumQuantity?.message}
                            placeholder="Optional"
                        />

                        <Input
                            label="Maximum Discount Amount"
                            type="number"
                            step="0.01"
                            {...register('maximumDiscountAmount', { valueAsNumber: true })}
                            error={errors.maximumDiscountAmount?.message}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valid From *"
                            type="date"
                            {...register('validFrom')}
                            error={errors.validFrom?.message}
                        />

                        <Input
                            label="Valid Until"
                            type="date"
                            {...register('validUntil')}
                            error={errors.validUntil?.message}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason *
                        </label>
                        <textarea
                            {...register('reason')}
                            rows={3}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Why is this discount needed?"
                        />
                        {errors.reason && (
                            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Justification
                        </label>
                        <textarea
                            {...register('businessJustification')}
                            rows={2}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Optional: Expected business impact"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Review Modal */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} Discount Request`}
            >
                <div className="space-y-4">
                    {selectedRequest && (
                        <div className="bg-gray-50 p-4 rounded-md space-y-2">
                            <p><strong>Customer:</strong> {selectedRequest.warehouseCustomer?.name}</p>
                            <p><strong>Product:</strong> {selectedRequest.product?.name || 'General Discount'}</p>
                            <p><strong>Discount:</strong> {
                                selectedRequest.requestedDiscountType === 'PERCENTAGE'
                                    ? `${selectedRequest.requestedDiscountValue}%`
                                    : `₦${selectedRequest.requestedDiscountValue.toLocaleString()}`
                            }</p>
                            <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Notes
                        </label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Optional notes about this decision"
                        />
                    </div>

                    {reviewAction === 'reject' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Please provide a reason for rejection"
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsReviewModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmReview}
                            disabled={reviewRequestMutation.isPending || (reviewAction === 'reject' && !rejectionReason)}
                            className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {reviewRequestMutation.isPending ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};