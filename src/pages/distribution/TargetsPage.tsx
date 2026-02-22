/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, Calendar, AlertCircle, Eye, Filter } from 'lucide-react';
import { supplierTargetService } from '../../services/supplierTargetService';
import supplierCompanyService from '../../services/supplierCompanyService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Table } from '../../components/ui/Table';

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

export const TargetsPage: React.FC = () => {
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState<any>(null);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

    // Fetch suppliers
    const { data: suppliers } = useQuery({
        queryKey: ['supplier-companies'],
        queryFn: () => supplierCompanyService.getAllSupplierCompanies(),
    });

    // Fetch supplier targets with filters
    const { data: targetsResponse, isLoading } = useQuery({
        queryKey: ['supplier-targets', selectedSupplier, selectedYear, selectedMonth],
        queryFn: () =>
            supplierTargetService.getSupplierTargets({
                supplierCompanyId: selectedSupplier || undefined,
                year: selectedYear || undefined,
                month: selectedMonth ? Number(selectedMonth) : undefined,
            }),
    });

    const targets = targetsResponse?.data?.targets || [];

    // Debug logging
    React.useEffect(() => {
        if (targetsResponse) {
            console.log('Targets Response:', targetsResponse);
            console.log('Targets Data:', targets);
            if (targets.length > 0) {
                console.log('First Target:', targets[0]);
                console.log('Has actualPacks?', targets[0].actualPacks);
                console.log('Has percentageAchieved?', targets[0].percentageAchieved);
            }
        }
    }, [targetsResponse, targets]);

    const handleViewTarget = (target: any) => {
        setSelectedTarget(target);
        setIsViewModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Supplier Targets
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                View targets set for supplier companies
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center space-x-3 mb-3">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier
                        </label>
                        <select
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Suppliers</option>
                            {suppliers?.map((supplier: any) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {[2024, 2025, 2026, 2027, 2028].map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Months</option>
                            {MONTHS.map((month) => (
                                <option key={month.value} value={month.value}>
                                    {month.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
                {targets.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Targets Found</h3>
                        <p className="text-gray-500">
                            No supplier targets match the selected filters
                        </p>
                    </div>
                ) : (
                    <Table
                        data={targets}
                        columns={[
                            {
                                key: 'supplierCompany',
                                title: 'Supplier',
                                render: (_value: any, record: any) => (
                                    <div>
                                        <div className="font-medium text-gray-900">{record.supplierCompany?.name}</div>
                                        <div className="text-sm text-gray-500">{record.supplierCompany?.code}</div>
                                    </div>
                                ),
                            },
                            {
                                key: 'period',
                                title: 'Period',
                                render: (_value: any, record: any) => (
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        <span className="font-medium">
                                            {MONTHS.find((m) => m.value === record.month)?.label} {record.year}
                                        </span>
                                    </div>
                                ),
                            },
                            {
                                key: 'totalPacksTarget',
                                title: 'Target',
                                render: (value: number, record: any) => (
                                    <div>
                                        <div className="font-semibold text-blue-600">{value.toLocaleString()} packs</div>
                                        <div className="text-xs text-gray-500">
                                            Actual: {record.actualPacks?.toLocaleString() || 0} packs
                                        </div>
                                        {record.categoryTargets && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(['CSD', 'ED', 'WATER', 'JUICE'] as const).map((cat) => {
                                                    const v = (record.categoryTargets as any)?.[cat];
                                                    if (!v) return null;
                                                    return (
                                                        <span key={cat} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                            {cat}: {v.toLocaleString()}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'progress',
                                title: 'Progress',
                                render: (_value: any, record: any) => {
                                    const percentage = record.percentageAchieved || 0;
                                    return (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-semibold ${
                                                    percentage >= 100 ? 'text-green-600' :
                                                    percentage >= 75 ? 'text-blue-600' :
                                                    percentage >= 50 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {percentage.toFixed(1)}%
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {record.remainingTarget?.toLocaleString() || 0} left
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${
                                                        percentage >= 100 ? 'bg-green-600' :
                                                        percentage >= 75 ? 'bg-blue-600' :
                                                        percentage >= 50 ? 'bg-yellow-600' :
                                                        'bg-red-600'
                                                    }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                },
                            },
                            {
                                key: 'weeklyTargets',
                                title: 'Weekly Breakdown',
                                render: (value: any) => (
                                    <div className="text-sm text-gray-600">
                                        W1: {value.week1} | W2: {value.week2} | W3: {value.week3} | W4: {value.week4}
                                    </div>
                                ),
                            },
                            {
                                key: 'creator',
                                title: 'Created By',
                                render: (_value: any, record: any) => (
                                    <div className="text-sm text-gray-600">{record.creator?.username}</div>
                                ),
                            },
                            {
                                key: 'actions',
                                title: 'Actions',
                                render: (_value: any, record: any) => (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewTarget(record)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                ),
                            } as any,
                        ]}
                        loading={isLoading}
                    />
                )}
            </div>

            {/* View Target Detail Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedTarget ? `${selectedTarget.supplierCompany?.name} - ${MONTHS.find(m => m.value === selectedTarget.month)?.label} ${selectedTarget.year}` : 'Target Details'}
            >
                {selectedTarget && (
                    <div className="space-y-6">
                        {/* Supplier Info */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Supplier Company</p>
                            <p className="text-xl font-bold text-gray-900">
                                {selectedTarget.supplierCompany?.name}
                            </p>
                            <p className="text-xs text-gray-500">{selectedTarget.supplierCompany?.code}</p>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Period</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {MONTHS.find(m => m.value === selectedTarget.month)?.label} {selectedTarget.year}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Target</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {selectedTarget.totalPacksTarget.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">packs</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">Actual</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {selectedTarget.actualPacks?.toLocaleString() || 0}
                                </p>
                                <p className="text-xs text-gray-500">packs</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Achievement</span>
                                <span className={`text-lg font-bold ${
                                    (selectedTarget.percentageAchieved || 0) >= 100 ? 'text-green-600' :
                                    (selectedTarget.percentageAchieved || 0) >= 75 ? 'text-blue-600' :
                                    (selectedTarget.percentageAchieved || 0) >= 50 ? 'text-yellow-600' :
                                    'text-red-600'
                                }`}>
                                    {(selectedTarget.percentageAchieved || 0).toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full transition-all ${
                                        (selectedTarget.percentageAchieved || 0) >= 100 ? 'bg-green-600' :
                                        (selectedTarget.percentageAchieved || 0) >= 75 ? 'bg-blue-600' :
                                        (selectedTarget.percentageAchieved || 0) >= 50 ? 'bg-yellow-600' :
                                        'bg-red-600'
                                    }`}
                                    style={{ width: `${Math.min(selectedTarget.percentageAchieved || 0, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-600">
                                <span>0 packs</span>
                                <span>Remaining: {selectedTarget.remainingTarget?.toLocaleString() || 0} packs</span>
                                <span>{selectedTarget.totalPacksTarget.toLocaleString()} packs</span>
                            </div>
                        </div>

                        {/* Weekly Breakdown */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Breakdown</h4>
                            <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((week) => {
                                    const targetPacks = (selectedTarget.weeklyTargets as any)[`week${week}`] || 0;
                                    const actualPacks = (selectedTarget.weeklyActuals as any)?.[`week${week}`] || 0;
                                    const weekPercentage = targetPacks > 0 ? (actualPacks / targetPacks) * 100 : 0;

                                    return (
                                        <div key={week} className="border rounded-lg p-3">
                                            <p className="text-xs text-gray-600 mb-2 text-center font-medium">Week {week}</p>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs text-gray-500">Target</p>
                                                    <p className="text-lg font-semibold text-blue-600">
                                                        {targetPacks.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Actual</p>
                                                    <p className="text-lg font-semibold text-purple-600">
                                                        {actualPacks.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="pt-1">
                                                    <p className={`text-sm font-semibold ${
                                                        weekPercentage >= 100 ? 'text-green-600' :
                                                        weekPercentage >= 75 ? 'text-blue-600' :
                                                        weekPercentage >= 50 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                        {weekPercentage.toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        {selectedTarget.categoryTargets && Object.values(selectedTarget.categoryTargets).some((v: any) => v > 0) && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Category Targets</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'CSD', label: 'Carbonated Soda Drink', color: 'bg-blue-50 text-blue-700' },
                                        { key: 'ED', label: 'Energy Drink', color: 'bg-orange-50 text-orange-700' },
                                        { key: 'WATER', label: 'Water', color: 'bg-cyan-50 text-cyan-700' },
                                        { key: 'JUICE', label: 'Juice', color: 'bg-green-50 text-green-700' },
                                    ].map(({ key, label, color }) => {
                                        const catTarget = (selectedTarget.categoryTargets as any)?.[key] || 0;
                                        const pct = selectedTarget.totalPacksTarget > 0
                                            ? ((catTarget / selectedTarget.totalPacksTarget) * 100).toFixed(1)
                                            : '0.0';
                                        return (
                                            <div key={key} className={`p-3 rounded-lg ${color.split(' ')[0]}`}>
                                                <p className={`text-xs font-medium ${color.split(' ')[1]} mb-1`}>{key}</p>
                                                <p className="text-xs text-gray-500">{label}</p>
                                                <p className={`text-xl font-bold ${color.split(' ')[1]} mt-1`}>
                                                    {catTarget.toLocaleString()}
                                                    <span className="text-xs font-normal ml-1">packs</span>
                                                </p>
                                                <p className="text-xs text-gray-500">{pct}% of total</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {selectedTarget.notes && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                                    {selectedTarget.notes}
                                </div>
                            </div>
                        )}

                        {/* Creator Info */}
                        <div className="border-t pt-4">
                            <p className="text-xs text-gray-500">
                                Created by {selectedTarget.creator?.username} on{' '}
                                {new Date(selectedTarget.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
