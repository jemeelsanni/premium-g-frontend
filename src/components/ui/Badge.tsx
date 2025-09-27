import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
    children: ReactNode;
    color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
    variant?: 'solid' | 'soft' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export const Badge = ({
    children,
    color = 'gray',
    variant = 'solid',
    size = 'md'
}: BadgeProps) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-sm'
    };

    const colorClasses = {
        solid: {
            gray: 'bg-gray-600 text-white',
            red: 'bg-red-600 text-white',
            yellow: 'bg-yellow-600 text-white',
            green: 'bg-green-600 text-white',
            blue: 'bg-blue-600 text-white',
            indigo: 'bg-indigo-600 text-white',
            purple: 'bg-purple-600 text-white',
            pink: 'bg-pink-600 text-white',
            orange: 'bg-orange-600 text-white'
        },
        soft: {
            gray: 'bg-gray-100 text-gray-800',
            red: 'bg-red-100 text-red-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            green: 'bg-green-100 text-green-800',
            blue: 'bg-blue-100 text-blue-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            purple: 'bg-purple-100 text-purple-800',
            pink: 'bg-pink-100 text-pink-800',
            orange: 'bg-orange-100 text-orange-800'
        },
        outline: {
            gray: 'border border-gray-300 text-gray-700',
            red: 'border border-red-300 text-red-700',
            yellow: 'border border-yellow-300 text-yellow-700',
            green: 'border border-green-300 text-green-700',
            blue: 'border border-blue-300 text-blue-700',
            indigo: 'border border-indigo-300 text-indigo-700',
            purple: 'border border-purple-300 text-purple-700',
            pink: 'border border-pink-300 text-pink-700',
            orange: 'border border-orange-300 text-orange-700'
        }
    };

    return (
        <span className={clsx(
            baseClasses,
            sizeClasses[size],
            colorClasses[variant][color]
        )}>
            {children}
        </span>
    );
};