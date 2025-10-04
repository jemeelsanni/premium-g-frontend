// src/components/transport/StatusTimeline.tsx

import React from 'react';
import { Check, Circle } from 'lucide-react';

type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'PARTIALLY_DELIVERED'
    | 'CANCELLED';

interface StatusTimelineProps {
    currentStatus: OrderStatus;
}

const statusFlow: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'IN_TRANSIT',
    'DELIVERED'
];

const statusLabels: Record<OrderStatus, string> = {
    PENDING: 'Order Placed',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    PARTIALLY_DELIVERED: 'Partially Delivered',
    CANCELLED: 'Cancelled'
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus }) => {
    // Handle cancelled status separately
    if (currentStatus === 'CANCELLED') {
        return (
            <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <Circle className="h-5 w-5 text-red-500 fill-current" />
                    <span className="text-sm font-medium text-red-700">Order Cancelled</span>
                </div>
            </div>
        );
    }

    const currentIndex = statusFlow.indexOf(currentStatus);

    return (
        <div className="py-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {statusFlow.map((status, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = status === currentStatus;

                    return (
                        <div key={status} className="flex items-center flex-1">
                            {/* Status Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isCompleted
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-gray-300'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5 text-white" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p
                                        className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                                            }`}
                                    >
                                        {statusLabels[status]}
                                    </p>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < statusFlow.length - 1 && (
                                <div
                                    className={`flex-1 h-0.5 mx-2 ${index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};