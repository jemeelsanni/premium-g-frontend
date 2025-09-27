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
}

export function Table<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    emptyMessage = 'No data available',
    className,
}: TableProps<T>) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
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
    );
}