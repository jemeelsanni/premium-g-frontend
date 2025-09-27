/* eslint-disable react-refresh/only-export-components */
import toast from 'react-hot-toast';

export const globalToast = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
};

// src/components/ui/LoadingSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <div
            className={cn(
                'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
                sizeClasses[size],
                className
            )}
        />
    );
};