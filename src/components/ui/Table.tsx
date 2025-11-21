/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { clsx } from 'clsx';

interface Column<T> {
    key: keyof T | string;
    title: string;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    pagination?: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number) => void;
    };
}

export function Table<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    emptyMessage = 'No data available',
    className,
    pagination,
}: TableProps<T>) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className={clsx('overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg', className)}>
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {column.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-12 text-center text-sm text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((record, recordIndex) => (
                                <tr key={recordIndex} className="hover:bg-gray-50">
                                    {columns.map((column, columnIndex) => {
                                        const value = record[column.key as keyof T];
                                        return (
                                            <td
                                                key={columnIndex}
                                                className={clsx(
                                                    'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                                                    column.className
                                                )}
                                            >
                                                {column.render ? column.render(value, record, recordIndex) : value}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ✅ ADD PAGINATION CONTROLS */}
            {pagination && pagination.total > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                    <div className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{pagination.current}</span> of{' '}
                        <span className="font-medium">{Math.ceil(pagination.total / pagination.pageSize)}</span>
                        {' '}({pagination.total} total records)
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => pagination.onChange(pagination.current - 1)}
                            disabled={pagination.current <= 1}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <span className="px-3 py-1 text-sm text-gray-700">
                            Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                        </span>

                        <button
                            onClick={() => pagination.onChange(pagination.current + 1)}
                            disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}


