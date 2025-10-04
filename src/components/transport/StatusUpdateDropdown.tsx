/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/transport/StatusUpdateDropdown.tsx

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { globalToast } from '../ui/Toast';
import { OrderStatusBadge } from './OrderStatusBadge';

type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'PARTIALLY_DELIVERED'
    | 'CANCELLED';

interface StatusUpdateDropdownProps {
    orderId: string;
    currentStatus: OrderStatus;
    disabled?: boolean;
}

const statusOptions: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'IN_TRANSIT',
    'DELIVERED',
    'PARTIALLY_DELIVERED',
    'CANCELLED'
];

// Status transition rules (optional - for validation)
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'],
    DELIVERED: [], // Final state
    PARTIALLY_DELIVERED: ['DELIVERED', 'IN_TRANSIT'],
    CANCELLED: [] // Final state
};

export const StatusUpdateDropdown: React.FC<StatusUpdateDropdownProps> = ({
    orderId,
    currentStatus,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: OrderStatus) => transportService.updateOrderStatus(orderId, newStatus),
        onSuccess: (data, newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transport-order', orderId] });
            globalToast.success(`Order status updated to ${newStatus}`);
            setIsOpen(false);
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update order status');
        }
    });

    const handleStatusChange = (newStatus: OrderStatus) => {
        if (newStatus === currentStatus) {
            setIsOpen(false);
            return;
        }

        // Optional: Validate transition
        const allowed = allowedTransitions[currentStatus];
        if (allowed && allowed.length > 0 && !allowed.includes(newStatus)) {
            globalToast.error(`Cannot change status from ${currentStatus} to ${newStatus}`);
            return;
        }

        updateStatusMutation.mutate(newStatus);
    };

    // Filter status options based on allowed transitions (optional)
    const availableStatuses = statusOptions.filter(status => {
        if (status === currentStatus) return false;
        const allowed = allowedTransitions[currentStatus];
        if (!allowed || allowed.length === 0) return false;
        return allowed.includes(status);
    });

    // If no transitions allowed, just show badge
    if (availableStatuses.length === 0) {
        return <OrderStatusBadge status={currentStatus} />;
    }

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled || updateStatusMutation.isPending}
                    className={`inline-flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                >
                    <OrderStatusBadge status={currentStatus} />
                    {updateStatusMutation.isPending ? (
                        <Loader className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                </button>
            </div>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-4 py-3">
                            <p className="text-xs font-medium text-gray-500 uppercase">Change Status To</p>
                        </div>
                        <div className="py-1">
                            {availableStatuses.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <OrderStatusBadge status={status} />
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};