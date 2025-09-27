/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import {
    ChevronUp,
    ChevronDown,
    Search,
    Filter,
    Download,
    RefreshCw,
} from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';

export interface Column<T = any> {
    key: string;
    title: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    rowKey?: keyof T | ((record: T) => string); // More flexible row key handling
    pagination?: {
        current: number;
        pageSize: number;
        total: number;
        onChange: (page: number, pageSize: number) => void;
    };
    onSearch?: (searchTerm: string) => void;
    onFilter?: (filters: Record<string, any>) => void;
    onSort?: (sortField: string, sortOrder: 'asc' | 'desc') => void;
    onExport?: (format: 'csv' | 'excel') => void;
    onRefresh?: () => void;
    rowActions?: Array<{
        key: string;
        label: string;
        icon?: React.ComponentType<{ className?: string }>;
        onClick: (record: T) => void;
        visible?: (record: T) => boolean;
        variant?: 'primary' | 'danger' | 'secondary';
    }>;
    selectable?: boolean;
    onSelectionChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
    title?: string;
    subtitle?: string;
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    rowKey = 'id',
    pagination,
    onSearch,
    onFilter,
    onSort,
    onExport,
    onRefresh,
    rowActions,
    selectable,
    onSelectionChange,
    title,
    subtitle,
    emptyMessage = 'No data found'
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Get row key value
    const getRowKey = (record: T, index: number): string => {
        if (typeof rowKey === 'function') {
            return rowKey(record);
        }
        return record[rowKey as string] || index.toString();
    };

    // Handle search with debouncing
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        onSearch?.(value);
    };

    // Handle sorting
    const handleSort = (field: string) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        onSort?.(field, newOrder);
    };

    // Handle filtering
    const handleFilter = (field: string, value: any) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilter?.(newFilters);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({});
        onFilter?.({});
    };

    // Handle row selection
    const handleRowSelect = (rowKey: string, selected: boolean) => {
        const newSelectedKeys = selected
            ? [...selectedRowKeys, rowKey]
            : selectedRowKeys.filter(key => key !== rowKey);

        setSelectedRowKeys(newSelectedKeys);
        const selectedRows = data.filter(row => newSelectedKeys.includes(getRowKey(row, 0)));
        onSelectionChange?.(newSelectedKeys, selectedRows);
    };

    // Handle select all
    const handleSelectAll = (selected: boolean) => {
        const newSelectedKeys = selected ? data.map((row, index) => getRowKey(row, index)) : [];
        setSelectedRowKeys(newSelectedKeys);
        const selectedRows = selected ? data : [];
        onSelectionChange?.(newSelectedKeys, selectedRows);
    };

    // Filterable columns
    const filterableColumns = useMemo(() =>
        columns.filter(col => col.filterable), [columns]
    );

    // Get unique values for filter options
    const getFilterOptions = (field: string) => {
        const values = data.map(row => row[field]).filter(Boolean);
        return [...new Set(values)].map(value => ({
            value: value.toString(),
            label: value.toString()
        }));
    };

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

    const allSelected = selectedRowKeys.length === data.length && data.length > 0;
    const indeterminate = selectedRowKeys.length > 0 && selectedRowKeys.length < data.length;

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
                        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                    </div>

                    <div className="flex items-center space-x-3">
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        )}

                        {onExport && (
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>

                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    onExport('csv');
                                                    setShowExportMenu(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Export as CSV
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onExport('excel');
                                                    setShowExportMenu(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Export as Excel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center space-x-4 mt-4">
                    {onSearch && (
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {filterableColumns.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        Active
                                    </span>
                                )}
                            </Button>

                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    )}

                    {selectedRowKeys.length > 0 && (
                        <div className="text-sm text-gray-600">
                            {selectedRowKeys.length} item{selectedRowKeys.length !== 1 ? 's' : ''} selected
                        </div>
                    )}
                </div>

                {/* Filters Row */}
                {showFilters && filterableColumns.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                        {filterableColumns.map(column => (
                            <Select
                                key={column.key}
                                label={column.title}
                                placeholder={`Filter by ${column.title}`}
                                value={filters[column.key] || ''}
                                onChange={(e) => handleFilter(column.key, e.target.value)}
                                options={[
                                    { value: '', label: 'All' },
                                    ...getFilterOptions(column.key)
                                ]}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {selectable && (
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={input => {
                                            if (input) input.indeterminate = indeterminate;
                                        }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </th>
                            )}

                            {columns.map(column => (
                                <th
                                    key={column.key}
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${column.align === 'center' ? 'text-center' :
                                        column.align === 'right' ? 'text-right' : 'text-left'
                                        }`}
                                    style={{ width: column.width }}
                                >
                                    {column.sortable ? (
                                        <button
                                            className="flex items-center space-x-1 hover:text-gray-700 group"
                                            onClick={() => handleSort(column.key)}
                                        >
                                            <span>{column.title}</span>
                                            <div className="flex flex-col">
                                                {sortField === column.key ? (
                                                    sortOrder === 'asc' ?
                                                        <ChevronUp className="h-4 w-4" /> :
                                                        <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <div className="h-4 w-4 opacity-0 group-hover:opacity-50">
                                                        <ChevronUp className="h-2 w-4" />
                                                        <ChevronDown className="h-2 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ) : (
                                        column.title
                                    )}
                                </th>
                            ))}

                            {rowActions && rowActions.length > 0 && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-6 py-12 text-center">
                                    <div className="flex items-center justify-center">
                                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                                        <span className="text-gray-500">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((record, index) => {
                                const key = getRowKey(record, index);
                                return (
                                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                                        {selectable && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRowKeys.includes(key)}
                                                    onChange={(e) => handleRowSelect(key, e.target.checked)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                            </td>
                                        )}

                                        {columns.map(column => (
                                            <td
                                                key={column.key}
                                                className={`px-6 py-4 whitespace-nowrap text-sm ${column.align === 'center' ? 'text-center' :
                                                    column.align === 'right' ? 'text-right' : 'text-left'
                                                    }`}
                                            >
                                                {column.render
                                                    ? column.render(record[column.key], record, index)
                                                    : record[column.key]
                                                }
                                            </td>
                                        ))}

                                        {rowActions && rowActions.length > 0 && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {rowActions
                                                        .filter(action => !action.visible || action.visible(record))
                                                        .map(action => {
                                                            const colorClasses = {
                                                                primary: 'text-blue-600 hover:text-blue-800',
                                                                danger: 'text-red-600 hover:text-red-800',
                                                                secondary: 'text-gray-400 hover:text-gray-600'
                                                            };

                                                            return (
                                                                <button
                                                                    key={action.key}
                                                                    onClick={() => action.onClick(record)}
                                                                    className={`transition-colors ${colorClasses[action.variant || 'secondary']
                                                                        }`}
                                                                    title={action.label}
                                                                >
                                                                    {action.icon ? (
                                                                        <action.icon className="h-4 w-4" />
                                                                    ) : (
                                                                        action.label
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    }
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} results
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                            disabled={pagination.current <= 1}
                        >
                            Previous
                        </Button>

                        <span className="px-3 py-1 text-sm text-gray-700">
                            Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                            disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Click outside handlers for dropdowns */}
            {showExportMenu && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowExportMenu(false)}
                />
            )}
        </div>
    );
}