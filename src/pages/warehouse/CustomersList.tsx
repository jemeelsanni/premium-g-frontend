/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/warehouse/CustomersList.tsx

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Edit, Users, Phone } from 'lucide-react';
import { warehouseService, CustomerFilters } from '../../services/warehouseService';
import { WarehouseCustomer } from '../../types/warehouse';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';

interface CustomerAnalytics {
    totalCustomers: number;
    totalSpent: number;
    totalPurchases: number;
    averageOrderValue: number;
    averagePaymentScore: number;
    totalOutstandingDebt: number;
}

const customerSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().min(1, 'Address is required'),
    customerType: z.string().min(1, 'Customer type is required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomersList: React.FC = () => {
    const [filters, setFilters] = useState<Required<Pick<CustomerFilters, 'page' | 'limit' | 'sortBy'>>>({
        page: 1,
        limit: 10,
        sortBy: 'name',
    });
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<CustomerFilters['customerType']>();
    const [hasDebt, setHasDebt] = useState<boolean | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<WarehouseCustomer | null>(null);
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
    });

    // ======== FETCH CUSTOMERS =========
    const { data, isLoading } = useQuery({
        queryKey: ['warehouse-customers', filters, search, filterType, hasDebt],
        queryFn: async () => {
            const queryFilters: CustomerFilters = {
                ...filters,
                search: search || undefined,
                customerType: filterType,
                hasOutstandingDebt: hasDebt,
            };
            return warehouseService.getCustomers(queryFilters);
        },
    });

    const customers = data?.data?.customers || [];
    const analytics = data?.data?.analytics || null;
    const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

    // ======== CREATE & UPDATE =========
    const createMutation = useMutation({
        mutationFn: (payload: CustomerFormData) => warehouseService.createCustomer(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            globalToast.success('Customer added successfully!');
            closeModal();
        },
        onError: (err: any) => {
            globalToast.error(err.response?.data?.message || 'Failed to add customer');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
            warehouseService.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            globalToast.success('Customer updated successfully!');
            closeModal();
        },
        onError: (err: any) => {
            globalToast.error(err.response?.data?.message || 'Failed to update customer');
        },
    });

    // ======== MODAL HANDLERS =========
    const openModal = (customer?: WarehouseCustomer) => {
        if (customer) {
            setEditingCustomer(customer);
            reset({
                name: customer.name,
                phone: customer.phone ?? '',
                address: customer.address ?? '',
                customerType: customer.customerType,
            });
        } else {
            setEditingCustomer(null);
            reset({ name: '', phone: '', address: '', customerType: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        reset();
    };

    const onSubmit = (data: CustomerFormData) => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    // ======== HELPERS =========
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    const handleSearch = () => setFilters((prev) => ({ ...prev, page: 1 }));

    const customerColumns = [
        {
            key: 'name',
            title: 'Customer Name',
            render: (value: string) => (
                <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{value}</span>
                </div>
            ),
        },
        { key: 'phone', title: 'Phone' },
        {
            key: 'address',
            title: 'Address',
            render: (value: string | null) => value || 'N/A',
        },
        { key: 'customerType', title: 'Type' },
        {
            key: 'totalSpent',
            title: 'Total Spent',
            render: (value: number) => formatCurrency(value || 0),
        },
        {
            key: 'outstandingDebt',
            title: 'Debt',
            render: (value: number) =>
                value > 0 ? <span className="text-red-600">{formatCurrency(value)}</span> : '—',
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_v: any, record: WarehouseCustomer) => (
                <Button variant="outline" size="sm" onClick={() => openModal(record)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Warehouse Customers</h2>
                    <p className="mt-1 text-sm text-gray-500">Analytics, filters, and management</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button onClick={() => openModal()} className="inline-flex items-center">
                        <Plus className="h-4 w-4 mr-2" /> Add Customer
                    </Button>
                </div>
            </div>

            {/* Analytics Summary */}
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Total Customers</p>
                        <p className="text-2xl font-bold">{analytics.totalCustomers}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Total Spent</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalSpent)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Avg Order Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Outstanding Debt</p>
                        <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(analytics.totalOutstandingDebt)}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow">
                <div className="flex flex-1 gap-2 min-w-[200px]">
                    <Input
                        placeholder="Search customers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                    />
                    <Button onClick={handleSearch}>Search</Button>
                </div>

                <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                    className="px-3 py-2 border rounded-lg"
                >
                    <option value="name">Name</option>
                    <option value="recent">Recent</option>
                    <option value="topSpender">Top Spenders</option>
                    <option value="topPurchases">Most Purchases</option>
                </select>

                <select
                    value={filterType || 'all'}
                    onChange={(e) =>
                        setFilterType(e.target.value === 'all' ? undefined : (e.target.value as any))
                    }
                    className="px-3 py-2 border rounded-lg"
                >
                    <option value="all">All Types</option>
                    <option value="INDIVIDUAL">Individuals</option>
                    <option value="BUSINESS">Businesses</option>
                    <option value="RETAILER">Retailers</option>
                </select>

                <select
                    value={hasDebt === undefined ? 'all' : hasDebt ? 'true' : 'false'}
                    onChange={(e) =>
                        setHasDebt(e.target.value === 'all' ? undefined : e.target.value === 'true')
                    }
                    className="px-3 py-2 border rounded-lg"
                >
                    <option value="all">All Customers</option>
                    <option value="true">With Debt</option>
                    <option value="false">No Debt</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={customers}
                    columns={customerColumns}
                    loading={isLoading}
                    emptyMessage="No customers found"
                />
            </div>

            {/* Pagination */}
            {typeof pagination.pages === 'number' && pagination.pages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    <Button
                        variant="outline"
                        disabled={pagination.page === 1}
                        onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                    >
                        Prev
                    </Button>
                    <span className="px-4 py-2">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Add/Edit Customer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Customer Name *"
                        {...register('name')}
                        error={errors.name?.message}
                        placeholder="Enter customer name"
                    />
                    <Input
                        label="Phone *"
                        {...register('phone')}
                        error={errors.phone?.message}
                        placeholder="Enter phone number"
                    />
                    <Input
                        label="Address *"
                        {...register('address')}
                        error={errors.address?.message}
                        placeholder="Enter address"
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Customer Type *</label>
                        <select
                            {...register('customerType')}
                            className="block w-full border rounded-md px-3 py-2"
                        >
                            <option value="">Select</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="BUSINESS">Business</option>
                            <option value="RETAILER">Retailer</option>
                        </select>
                        {errors.customerType && (
                            <p className="text-sm text-red-600 mt-1">{errors.customerType.message}</p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {editingCustomer ? 'Update' : 'Add Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
