/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/transport/StatusUpdateDropdown.tsx - FIXED ENUM VALUES
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { globalToast } from '../ui/Toast';
import { OrderStatusBadge } from './OrderStatusBadge';

import { OrderStatus } from './OrderStatusBadge';

interface StatusUpdateDropdownProps {
    orderId: string;
    currentStatus: OrderStatus;
    disabled?: boolean;
}

// ✅ FIX: Use only valid OrderStatus values for transport
const statusOptions: OrderStatus[] = [
    'PENDING',
    'IN_TRANSIT',
    'DELIVERED',
    'PARTIALLY_DELIVERED',
    'CANCELLED'
];

// ✅ FIX: Updated transition rules to match valid statuses
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    PARTIALLY_DELIVERED: ['DELIVERED', 'IN_TRANSIT'],
    CANCELLED: [],
    CONFIRMED: [],
    PROCESSING: []
};

export const StatusUpdateDropdown: React.FC<StatusUpdateDropdownProps> = ({
    orderId,
    currentStatus,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX
                });
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: OrderStatus) => transportService.updateOrderStatus(orderId, newStatus),
        onSuccess: (newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transport-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['transport-dashboard'] });
            globalToast.success(`Order status updated to ${newStatus}`);
            setIsOpen(false);
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || error.response?.data?.details || 'Failed to update order status';
            globalToast.error(errorMessage);
            console.error('Status update error:', error.response?.data);
        }
    });

    const handleStatusChange = (newStatus: OrderStatus) => {
        if (newStatus === currentStatus) {
            setIsOpen(false);
            return;
        }

        const allowed = allowedTransitions[currentStatus];
        if (allowed && allowed.length > 0 && !allowed.includes(newStatus)) {
            globalToast.error(`Cannot change status from ${currentStatus} to ${newStatus}`);
            return;
        }

        updateStatusMutation.mutate(newStatus);
    };

    const availableStatuses = statusOptions.filter(status => {
        if (status === currentStatus) return false;
        const allowed = allowedTransitions[currentStatus];
        if (!allowed || allowed.length === 0) return false;
        return allowed.includes(status);
    });

    if (availableStatuses.length === 0) {
        return <OrderStatusBadge status={currentStatus} />;
    }

    return (
        <>
            <div className="relative inline-block text-left">
                <button
                    ref={buttonRef}
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

            {isOpen && createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9998]"
                        style={{ backgroundColor: 'transparent' }}
                    />

                    <div
                        ref={dropdownRef}
                        className="fixed z-[9999] w-56 bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                        style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                        }}
                    >
                        <div className="px-4 py-3 bg-gray-50">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Change Status To
                            </p>
                        </div>
                        <div className="py-1 max-h-60 overflow-y-auto">
                            {availableStatuses.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={updateStatusMutation.isPending}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <OrderStatusBadge status={status} />
                                </button>
                            ))}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
};