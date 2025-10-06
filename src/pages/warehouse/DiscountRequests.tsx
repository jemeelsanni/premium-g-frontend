/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { globalToast } from '../../components/ui/Toast';

const statusBadgeConfig: Record<string, { icon: typeof CheckCircle; classes: string; label: string }> = {
    PENDING: { icon: Clock, classes: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    APPROVED: { icon: CheckCircle, classes: 'bg-green-100 text-green-800', label: 'Approved' },
    REJECTED: { icon: XCircle, classes: 'bg-red-100 text-red-800', label: 'Rejected' }
};

export const DiscountRequests: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: discountRequests, isLoading } = useQuery({
        queryKey: ['warehouse-discount-requests', 'all'],
        queryFn: async () => {
            const statuses: Array<'PENDING' | 'APPROVED' | 'REJECTED'> = ['PENDING', 'APPROVED', 'REJECTED'];
            const responses = await Promise.all(
                statuses.map((status) => warehouseService.getDiscountRequests(1, 100, status))
            );
            return responses
                .flatMap((response) => response?.data?.requests || [])
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => warehouseService.approveDiscount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-discount-requests'] });
            globalToast.success('Discount approved successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error?.response?.data?.message || 'Failed to approve discount');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => warehouseService.rejectDiscount(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-discount-requests'] });
            globalToast.success('Discount rejected successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error?.response?.data?.message || 'Failed to reject discount');
        }
    });

    const requests = discountRequests || [];

    const tableData = requests.map((request: any) => ({
        id: request.id,
        customer: request.warehouseCustomer?.name || 'Unknown Customer',
        product: request.product?.name || 'General Discount',
        discountType: request.requestedDiscountType,
        requestedDiscount: request.requestedDiscountValue,
        minimumQuantity: request.minimumQuantity,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt
    }));

    const discountColumns = [
        {
            key: 'customer',
            title: 'Customer',
            render: (value: string) => <span className="font-medium text-gray-900">{value}</span>
        },
        {
            key: 'product',
            title: 'Product'
        },
        {
            key: 'requestedDiscount',
            title: 'Requested Discount',
            render: (_value: number, record: any) => {
                if (record.discountType === 'FIXED_AMOUNT') {
                    return `₦${Number(record.requestedDiscount || 0).toLocaleString()}`;
                }
                return `${record.requestedDiscount}%`;
            }
        },
        {
            key: 'minimumQuantity',
            title: 'Min Qty',
            render: (value: number | undefined) => (value ? value.toLocaleString() : '—')
        },
        {
            key: 'reason',
            title: 'Reason'
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => {
                const config = statusBadgeConfig[value] || statusBadgeConfig.PENDING;
                const Icon = config.icon || AlertCircle;
                return (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.classes}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_value: any, record: any) => {
                if (record.status !== 'PENDING') {
                    return <span className="text-gray-400">—</span>;
                }

                return (
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMutation.mutate(record.id)}
                            className="text-green-600 hover:text-green-700"
                            disabled={approveMutation.isPending}
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const reason = window.prompt('Provide a reason for rejection (optional):')?.trim();
                                rejectMutation.mutate({ id: record.id, reason });
                            }}
                            className="text-red-600 hover:text-red-700"
                            disabled={rejectMutation.isPending}
                        >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                        Discount Requests
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Review and approve discount requests from customers
                    </p>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={tableData}
                    columns={discountColumns}
                    loading={isLoading}
                    emptyMessage="No discount requests found"
                />
            </div>
        </div>
    );
};

export default DiscountRequests;
