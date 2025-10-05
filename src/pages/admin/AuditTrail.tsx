/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AuditTrail.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Activity, Download } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const AuditTrail: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        startDate: '',
        endDate: '',
    });
    const [showFilters, setShowFilters] = useState(false);

    const pageSize = 20;

    const { data: auditData, isLoading } = useQuery({
        queryKey: ['admin-audit', currentPage, filters],
        queryFn: () =>
            adminService.getAuditTrail({
                page: currentPage,
                limit: pageSize,
                entity: filters.entity || undefined,
                action: filters.action || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            }),
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value });
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            entity: '',
            action: '',
            startDate: '',
            endDate: '',
        });
        setCurrentPage(1);
    };

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
                <span className="text-sm text-gray-600 font-mono">
                    {value?.slice(0, 8)}...
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Activity className="h-6 w-6 mr-2" />
                        Audit Trail
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        System activity and user actions log
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Entity
                            </label>
                            <select
                                value={filters.entity}
                                onChange={(e) => handleFilterChange('entity', e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">All Entities</option>
                                <option value="User">User</option>
                                <option value="Product">Product</option>
                                <option value="Location">Location</option>
                                <option value="DistributionOrder">Distribution Order</option>
                                <option value="TransportOrder">Transport Order</option>
                                <option value="WarehouseSale">Warehouse Sale</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">All Actions</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                                <option value="APPROVE">Approve</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>
            )}

            {/* Audit Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <Table
                        columns={auditColumns}
                        data={auditData?.data?.auditLogs || []}
                        emptyMessage="No audit logs found"
                    />
                </div>
            )}

            {/* Pagination */}
            {auditData?.data?.pagination && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage >= auditData.data.pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                <span className="font-medium">{auditData.data.pagination.totalPages}</span>
                                {' '}({auditData.data.pagination.total} total records)
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={currentPage >= auditData.data.pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};