/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';

export const CashFlowList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const pageSize = 10;

    const { data: cashFlowData, isLoading } = useQuery({
        queryKey: ['warehouse-cash-flow', currentPage, pageSize],
        queryFn: () => warehouseService.getCashFlow(currentPage, pageSize),
    });

    const cashFlowColumns = [
        {
            key: 'type',
            title: 'Type',
            render: (value: string) => {
                const isInflow = value === 'INFLOW';
                return (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${isInflow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {isInflow ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {value}
                    </span>
                );
            }
        },
        {
            key: 'amount',
            title: 'Amount',
            render: (value: number, record: any) => (
                <span className={`font-bold ${record.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'INFLOW' ? '+' : '-'}₦{value.toLocaleString()}
                </span>
            )
        },
        {
            key: 'description',
            title: 'Description',
        },
        {
            key: 'reference',
            title: 'Reference',
        },
        {
            key: 'cashier',
            title: 'Cashier',
        },
        {
            key: 'createdAt',
            title: 'Date & Time',
            render: (value: string) => (
                <div className="text-sm">
                    <div>{new Date(value).toLocaleDateString()}</div>
                    <div className="text-gray-500">{new Date(value).toLocaleTimeString()}</div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                        Cash Flow Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor all cash transactions and movements
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Inflow
                                    </dt>
                                    <dd className="text-2xl font-semibold text-green-600">
                                        ₦{(cashFlowData?.totalInflow || 0).toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TrendingDown className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Outflow
                                    </dt>
                                    <dd className="text-2xl font-semibold text-red-600">
                                        ₦{(cashFlowData?.totalOutflow || 0).toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Net Cash Flow
                                    </dt>
                                    <dd className={`text-2xl font-semibold ${(cashFlowData?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ₦{(cashFlowData?.netCashFlow || 0).toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Cash Flow Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={cashFlowData?.data || []}
                    columns={cashFlowColumns}
                    loading={isLoading}
                    emptyMessage="No cash flow records found"
                />
            </div>
        </div>
    );
};