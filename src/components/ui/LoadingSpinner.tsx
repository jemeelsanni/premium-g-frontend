import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
}) => {
    return (
        <div
            className={clsx(
                'animate-spin rounded-full border-b-2 border-blue-600',
                {
                    'h-4 w-4': size === 'sm',
                    'h-8 w-8': size === 'md',
                    'h-12 w-12': size === 'lg',
                },
                className
            )}
        />
    );
};