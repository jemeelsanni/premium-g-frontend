// src/components/transport/OrderStatusBadge.tsx

import React from 'react';
import {
    Clock,
    CheckCircle,
    Loader,
    Truck,
    Package,
    XCircle,
    AlertCircle
} from 'lucide-react';

type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'PARTIALLY_DELIVERED'
    | 'CANCELLED';

interface OrderStatusBadgeProps {
    status: OrderStatus;
    showIcon?: boolean;
}

const statusConfig: Record<OrderStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
}> = {
    PENDING: {
        label: 'Pending',
        color: 'text-yellow-800',
        bgColor: 'bg-yellow-100',
        icon: Clock
    },
    CONFIRMED: {
        label: 'Confirmed',
        color: 'text-blue-800',
        bgColor: 'bg-blue-100',
        icon: CheckCircle
    },
    PROCESSING: {
        label: 'Processing',
        color: 'text-purple-800',
        bgColor: 'bg-purple-100',
        icon: Loader
    },
    IN_TRANSIT: {
        label: 'In Transit',
        color: 'text-indigo-800',
        bgColor: 'bg-indigo-100',
        icon: Truck
    },
    DELIVERED: {
        label: 'Delivered',
        color: 'text-green-800',
        bgColor: 'bg-green-100',
        icon: Package
    },
    PARTIALLY_DELIVERED: {
        label: 'Partially Delivered',
        color: 'text-orange-800',
        bgColor: 'bg-orange-100',
        icon: AlertCircle
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'text-red-800',
        bgColor: 'bg-red-100',
        icon: XCircle
    }
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, showIcon = true }) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
            {showIcon && <Icon className="h-3 w-3 mr-1" />}
            {config.label}
        </span>
    );
};