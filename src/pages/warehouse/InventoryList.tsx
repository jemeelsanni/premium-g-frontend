/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/InventoryList.tsx
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, AlertTriangle, Search, Plus, DollarSign } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { WarehouseInventory } from '../../types/warehouse';
import { globalToast } from '../../components/ui/Toast';

const inventoryUpdateSchema = z.object({
    currentStock: z.number().min(0, 'Current stock cannot be negative'),
    minimumStock: z.number().min(0, 'Minimum stock cannot be negative'),
    maximumStock: z.number().min(1, 'Maximum stock must be greater than 0'),
});

type InventoryUpdateData = z.infer<typeof inventoryUpdateSchema>;

export const InventoryList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WarehouseInventory | null>(null);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const queryClient = useQueryClient();
    const pageSize = 50;

    const parseNumber = (value: unknown, fallback = 0) => {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<InventoryUpdateData>({
        resolver: zodResolver(inventoryUpdateSchema),
    });

    const { data: inventoryData, isLoading } = useQuery({
        queryKey: ['warehouse-inventory', currentPage, pageSize],
        queryFn: () => warehouseService.getInventory(currentPage, pageSize),
    });

    const updateInventoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: InventoryUpdateData }) =>
            warehouseService.updateInventory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            globalToast.success('Inventory updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update inventory');
        }
    });

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        reset();
    };

    const onSubmit = (data: InventoryUpdateData) => {
        if (selectedItem) {
            updateInventoryMutation.mutate({ id: selectedItem.id, data });
        }
    };

    // ✅ FIXED: Trust backend stockStatus instead of recalculating
    const getStockStatus = (item: WarehouseInventory) => {
        const backendStatus = item.stockStatus;

        if (backendStatus === 'LOW_STOCK' || backendStatus === 'OUT_OF_STOCK') {
            return { status: 'low', color: 'red', text: 'Low Stock' };
        } else if (backendStatus === 'OVERSTOCK') {
            return { status: 'high', color: 'orange', text: 'Overstock' };
        } else {
            return { status: 'normal', color: 'green', text: 'Normal' };
        }
    };

    const rawInventoryData = inventoryData?.data;
    const inventoryItems = Array.isArray(rawInventoryData)
        ? rawInventoryData
        : Array.isArray((rawInventoryData as any)?.inventory)
            ? (rawInventoryData as any).inventory
            : [];

    const normalizedInventory: WarehouseInventory[] = inventoryItems.map((item: any) => {
        const currentStock = parseNumber(item.currentStock ?? item.packs ?? item.units ?? 0);
        const minimumStock = parseNumber(item.minimumStock ?? item.reorderLevel ?? 0);
        const maximumSource = item.maximumStock ?? item.maxStockLevel;
        const maximumStock = maximumSource == null ? undefined : parseNumber(maximumSource);

        return {
            ...item,
            currentStock,
            minimumStock,
            maximumStock,
            lastRestocked: item.lastRestocked ?? item.lastUpdated ?? item.updatedAt ?? item.createdAt ?? null,
        } as WarehouseInventory;
    });

    const pagination = (rawInventoryData as any)?.pagination;
    const searchValue = searchTerm.trim().toLowerCase();

    // ✅ FIXED: Use backend stockStatus for filtering
    const filteredData = normalizedInventory.filter(item => {
        const productName = item.product?.name ?? '';
        const matchesSearch = productName.toLowerCase().includes(searchValue);
        const matchesFilter = showLowStockOnly
            ? (item.stockStatus === 'LOW_STOCK' || item.stockStatus === 'OUT_OF_STOCK')
            : true;
        return matchesSearch && matchesFilter;
    });

    const page = pagination?.page ?? currentPage;
    const total = pagination?.total ?? filteredData.length;
    const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
    const paginatedData = pagination
        ? filteredData
        : filteredData.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        if (!pagination) {
            const computedTotalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
            if (currentPage > computedTotalPages) {
                setCurrentPage(computedTotalPages);
            }
        }
    }, [filteredData.length, pagination, currentPage, pageSize]);

    // ✅ FIXED: Use backend stockStatus for counting
    const lowStockCount = normalizedInventory.filter(item => {
        return item.stockStatus === 'LOW_STOCK' || item.stockStatus === 'OUT_OF_STOCK';
    }).length;

    const totalStock = normalizedInventory.reduce((sum, item) => sum + parseNumber(item.currentStock), 0);

    // ✅ NEW: Calculate total stock value (cost basis)
    const totalStockValue = normalizedInventory.reduce((sum, item) => {
        const stockValue = parseNumber((item as any).stockValue ?? 0);
        return sum + stockValue;
    }, 0);

    const wellStockCount = Math.max(normalizedInventory.length - lowStockCount, 0);
    const totalItems = pagination?.total ?? normalizedInventory.length;
    const selectedStatus = selectedItem ? getStockStatus(selectedItem) : null;
    const selectedCurrentValue = parseNumber(selectedItem?.currentStock).toLocaleString();

    const inventoryColumns = [
        {
            key: 'product',
            title: 'Product',
            render: (value: any) => (
                <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{value?.name || 'Unknown Product'}</span>
                </div>
            )
        },
        {
            key: 'currentStock',
            title: 'Current Stock',
            render: (value: number | undefined, record: WarehouseInventory) => {
                const stockStatus = getStockStatus(record);
                const displayValue = typeof value === 'number' ? value.toLocaleString() : 'N/A';
                return (
                    <div className="flex items-center">
                        <span className={`font-bold ${stockStatus.status === 'low' ? 'text-red-600' :
                            stockStatus.status === 'high' ? 'text-orange-600' :
                                'text-green-600'
                            }`}>
                            {displayValue}
                        </span>
                        {stockStatus.status === 'low' && (
                            <AlertTriangle className="h-4 w-4 ml-1 text-red-500" />
                        )}
                    </div>
                );
            }
        },
        {
            key: 'minimumStock',
            title: 'Min Stock',
            render: (value: number | undefined) => typeof value === 'number' ? value.toLocaleString() : 'N/A'
        },
        {
            key: 'stockStatus',
            title: 'Status',
            render: (record: WarehouseInventory) => {
                const stockStatus = getStockStatus(record);
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
            bg-${stockStatus.color}-100 text-${stockStatus.color}-800`}>
                        {stockStatus.text}
                    </span>
                );
            }
        },
        {
            key: 'lastRestocked',
            title: 'Last Restocked',
            render: (value: string) =>
                value ? new Date(value).toLocaleDateString() : 'Never'
        },
        {
            key: 'stockValue',
            title: 'Stock Value (Cost)',
            render: (value: number | undefined) =>
                value ? `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : 'N/A'
        },
    ];

    const Pagination = () => {
        if (total === 0 || totalPages <= 1) return null;

        const startItem = ((page - 1) * pageSize) + 1;
        const endItem = Math.min(page * pageSize, total);

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setCurrentPage(page - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setCurrentPage(page + 1)}
                    >
                        Next
                    </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{startItem}</span> to{' '}
                            <span className="font-medium">{endItem}</span> of{' '}
                            <span className="font-medium">{total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <Button
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setCurrentPage(page - 1)}
                                className="rounded-l-md"
                            >
                                Previous
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const offset = Math.floor(Math.min(Math.max(page - 3, 0), Math.max(totalPages - 5, 0)));
                                const pageNum = 1 + offset + i;
                                if (pageNum <= totalPages) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? 'primary' : 'outline'}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className="rounded-none"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                                return null;
                            })}

                            <Button
                                variant="outline"
                                disabled={page === totalPages}
                                onClick={() => setCurrentPage(page + 1)}
                                className="rounded-r-md"
                            >
                                Next
                            </Button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Inventory Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Monitor and manage warehouse stock levels
                    </p>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">
                                Low Stock Alert
                            </h3>
                            <div className="mt-1 text-sm text-red-700">
                                {lowStockCount} item(s) are running low on stock and need immediate attention.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-5">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Package className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Items
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {totalItems}
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
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Low Stock
                                    </dt>
                                    <dd className="text-2xl font-semibold text-red-600">
                                        {lowStockCount}
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
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Well Stocked
                                    </dt>
                                    <dd className="text-2xl font-semibold text-green-600">
                                        {wellStockCount}
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
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-bold text-xs">TTL</span>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Stock
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {totalStock.toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ NEW: Total Stock Value Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <DollarSign className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Stock Value
                                    </dt>
                                    <dd className="text-xl font-semibold text-emerald-600">
                                        ₦{totalStockValue.toLocaleString('en-NG', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="lowStockFilter"
                                checked={showLowStockOnly}
                                onChange={(e) => {
                                    setShowLowStockOnly(e.target.checked);
                                    setCurrentPage(1);
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="lowStockFilter" className="ml-2 block text-sm text-gray-900">
                                Show low stock only
                            </label>
                        </div>

                        <div className="flex justify-end">
                            <Button variant="outline" className="inline-flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={paginatedData}
                    columns={inventoryColumns}
                    loading={isLoading}
                    emptyMessage="No inventory items found"
                />

                <Pagination />
            </div>

            {/* Update Inventory Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`Update Inventory - ${selectedItem?.product?.name}`}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Current Stock *"
                        type="number"
                        {...register('currentStock', { valueAsNumber: true })}
                        error={errors.currentStock?.message}
                        placeholder="Enter current stock quantity"
                    />

                    <Input
                        label="Minimum Stock Level *"
                        type="number"
                        {...register('minimumStock', { valueAsNumber: true })}
                        error={errors.minimumStock?.message}
                        placeholder="Enter minimum stock level"
                        helpText="Stock level that triggers low stock alert"
                    />

                    <Input
                        label="Maximum Stock Level *"
                        type="number"
                        {...register('maximumStock', { valueAsNumber: true })}
                        error={errors.maximumStock?.message}
                        placeholder="Enter maximum stock level"
                        helpText="Maximum capacity for this product"
                    />

                    {selectedItem && selectedStatus && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Status</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Current:</span>
                                    <span className="ml-2 font-medium">{selectedCurrentValue}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`ml-2 font-medium ${selectedStatus.status === 'low' ? 'text-red-600' :
                                        selectedStatus.status === 'high' ? 'text-orange-600' :
                                            'text-green-600'
                                        }`}>
                                        {selectedStatus.text}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting || updateInventoryMutation.isPending}
                        >
                            Update Inventory
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};