/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { globalToast } from '../../components/ui/Toast';

export const DiscountRequests: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: discountRequests, isLoading } = useQuery({
        queryKey: ['warehouse-discount-requests'],
        queryFn: () => warehouseService.getDiscountRequests(),
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => warehouseService.approveDiscount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-discount-requests'] });
            globalToast.success('Discount approved successfully!');
        },
        onError: () => {
            globalToast.error('Failed to approve discount');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (id: string) => warehouseService.rejectDiscount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-discount-requests'] });
            globalToast.success('Discount rejected successfully!');
        },
        onError: () => {
            globalToast.error('Failed to reject discount');
        }
    });

    const discountColumns = [
        {
            key: 'customer',
            title: 'Customer',
            render: (value: string) => (
                <span className="font-medium">{value}</span>
            )
        },
        {
            key: 'product',
            title: 'Product',
        },
        {
            key: 'requestedDiscount',
            title: 'Discount %',
            render: (value: number) => `${value}%`
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (value: number) => `₦${value.toLocaleString()}`
        },
        {
            key: 'reason',
            title: 'Reason',
        },
        {
            key: 'status',
            title: 'Status',
            render: (value: string) => {
                const statusConfig = {
                    PENDING: { icon: Clock, color: 'yellow', text: 'Pending' },
                    APPROVED: { icon: CheckCircle, color: 'green', text: 'Approved' },
                    REJECTED: { icon: XCircle, color: 'red', text: 'Rejected' },
                };
                const config = statusConfig[value as keyof typeof statusConfig];
                const Icon = config?.icon || AlertCircle;

                return (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-${config?.color}-100 text-${config?.color}-800`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config?.text || value}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value: any, record: any) => {
                if (record.status === 'PENDING') {
                    return (
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveMutation.mutate(record.id)}
                                className="text-green-600 hover:text-green-700"
                            >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rejectMutation.mutate(record.id)}
                                className="text-red-600 hover:text-red-700"
                            >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                            </Button>
                        </div>
                    );
                }
                return <span className="text-gray-400">-</span>;
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
                    data={discountRequests?.data || []}
                    columns={discountColumns}
                    loading={isLoading}
                    emptyMessage="No discount requests found"
                />
            </div>
        </div>
    );
};


