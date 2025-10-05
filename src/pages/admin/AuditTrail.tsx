/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AuditTrail.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const AuditTrail: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        userId: '',
        startDate: '',
        endDate: '',
    });

    const pageSize = 50;

    const { data: auditData, isLoading } = useQuery({
        queryKey: ['audit-trail', currentPage, filters],
        queryFn: () =>
            adminService.getAuditTrail({
                page: currentPage,
                limit: pageSize,
                entity: filters.entity || undefined,
                action: filters.action || undefined,
                userId: filters.userId || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            }),
    });

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            case 'APPROVE':
                return 'bg-purple-100 text-purple-800';
            case 'LOGIN':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const auditColumns = [
        {
            key: 'createdAt',
            title: 'Timestamp',
            render: (value: string) => (
                <div className="text-sm">
                    <div className="text-gray-900">
                        {new Date(value).toLocaleDateString()}
                    </div>
                    <div className="text-gray-500">
                        {new Date(value).toLocaleTimeString()}
                    </div>
                </div>
            ),
        },
        {
            key: 'user',
            title: 'User',
            render: (value: any) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {value?.username || 'System'}
                    </div>
                    <div className="text-gray-500">
                        {value?.role?.replace(/_/g, ' ') || 'N/A'}
                    </div>
                </div>
            ),
        },
        {
            key: 'action',
            title: 'Action',
            render: (value: string) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(value)}`}>
                    {value}
                </span>
            ),
        },
        {
            key: 'entity',
            title: 'Entity',
            render: (value: string) => (
                <span className="text-sm font-medium text-gray-900">{value}</span>
            ),
        },
        {
            key: 'entityId',
            title: 'Entity ID',
            render: (value: string) => (
                <span className="text-xs text-gray-500 font-mono">
                    {value ? value.substring(0, 8) + '...' : 'N/A'}
                </span>
            ),
        },
        {
            key: 'ipAddress',
            title: 'IP Address',
            render: (value: string) => (
                <span className="text-sm text-gray-600">{value || 'N/A'}</span>
            ),
        },
    ];

    const totalPages = auditData?.pagination?.totalPages || 1;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
                <p className="text-gray-600">System activity and security logs</p>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Entity Type
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g., User, Product, Order"
                                value={filters.entity}
                                onChange={(e) =>
                                    setFilters({ ...filters, entity: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.action}
                                onChange={(e) =>
                                    setFilters({ ...filters, action: e.target.value })
                                }
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="APPROVE">Approve</option>
                                <option value="LOGIN">Login</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) =>
                                    setFilters({ ...filters, startDate: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) =>
                                    setFilters({ ...filters, endDate: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setFilters({
                                    entity: '',
                                    action: '',
                                    userId: '',
                                    startDate: '',
                                    endDate: '',
                                });
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 inline mr-2" />
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                <Table
                    data={auditData?.data || []}
                    columns={auditColumns}
                />

                {/* Custom Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!hasPrev}
                                variant="outline"
                                size="sm"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!hasNext}
                                variant="outline"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                    {' '}({auditData?.pagination?.total || 0} total records)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={!hasPrev}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        {currentPage}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={!hasNext}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Total Records</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {auditData?.pagination?.total || 0}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Current Page</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {currentPage} of {totalPages}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Records/Page</div>
                    <div className="text-2xl font-bold text-gray-900">{pageSize}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500">Filters Active</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {Object.values(filters).filter((v) => v !== '').length}
                    </div>
                </div>
            </div>
        </div>
    );
};