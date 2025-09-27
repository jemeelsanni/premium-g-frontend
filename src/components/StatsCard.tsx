// src/components/StatsCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo';
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    description,
}) => {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-100',
            text: 'text-blue-600',
            ring: 'ring-blue-500',
        },
        green: {
            bg: 'bg-green-100',
            text: 'text-green-600',
            ring: 'ring-green-500',
        },
        purple: {
            bg: 'bg-purple-100',
            text: 'text-purple-600',
            ring: 'ring-purple-500',
        },
        yellow: {
            bg: 'bg-yellow-100',
            text: 'text-yellow-600',
            ring: 'ring-yellow-500',
        },
        red: {
            bg: 'bg-red-100',
            text: 'text-red-600',
            ring: 'ring-red-500',
        },
        indigo: {
            bg: 'bg-indigo-100',
            text: 'text-indigo-600',
            ring: 'ring-indigo-500',
        },
    };

    const currentColor = colorClasses[color];

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div
                            className={`inline-flex items-center justify-center p-3 rounded-md ${currentColor.bg} ${currentColor.text}`}
                        >
                            <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {title}
                            </dt>
                            <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                    {value}
                                </div>
                                {trend && (
                                    <div
                                        className={`ml-2 flex items-baseline text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {trend.isPositive ? (
                                            <svg
                                                className="self-center flex-shrink-0 h-4 w-4 text-green-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="self-center flex-shrink-0 h-4 w-4 text-red-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                        <span className="sr-only">
                                            {trend.isPositive ? 'Increased' : 'Decreased'} by
                                        </span>
                                        {Math.abs(trend.value)}%
                                    </div>
                                )}
                            </dd>
                            {description && (
                                <dd className="mt-1 text-xs text-gray-500 truncate">
                                    {description}
                                </dd>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
};