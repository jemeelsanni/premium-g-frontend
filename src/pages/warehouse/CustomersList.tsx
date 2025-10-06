/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/warehouse/CustomersList.tsx
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Users, Phone } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { WarehouseCustomer } from '../../types/warehouse';
import { globalToast } from '../../components/ui/Toast';

const customerSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().min(1, 'Address is required'),
    customerType: z.string().min(1, 'Customer type is required'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomersList: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<WarehouseCustomer | null>(null);
    const queryClient = useQueryClient();
    const pageSize = 10;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
    });

    const searchValue = searchTerm.trim();

    const { data: customersData, isLoading } = useQuery({
        queryKey: ['warehouse-customers', currentPage, pageSize, searchValue],
        queryFn: () => warehouseService.getCustomers(currentPage, pageSize, searchValue),
    });

    const createMutation = useMutation({
        mutationFn: (data: CustomerFormData) => warehouseService.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            globalToast.success('Customer added successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to add customer');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
            warehouseService.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            globalToast.success('Customer updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update customer');
        }
    });

    const handleOpenModal = (customer?: WarehouseCustomer) => {
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
            reset({
                name: '',
                phone: '',
                address: '',
                customerType: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
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

    const customers = customersData?.data?.customers ?? [];
    const pagination = customersData?.data?.pagination;

    useEffect(() => {
        if (pagination?.page && pagination.page !== currentPage) {
            setCurrentPage(pagination.page);
        }
    }, [pagination?.page, currentPage]);

    const page = pagination?.page ?? currentPage;
    const total = pagination?.total ?? customers.length;
    const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
    const paginatedData = pagination
        ? customers
        : customers.slice((page - 1) * pageSize, page * pageSize);

    const customerColumns = [
        {
            key: 'name',
            title: 'Customer Name',
            render: (value: string) => (
                <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{value}</span>
                </div>
            )
        },
        {
            key: 'phone',
            title: 'Phone',
            render: (value: string | undefined | null) => (
                <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{value || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'address',
            title: 'Address',
            render: (value: string | undefined | null) => (
                <span className="text-sm text-gray-600 truncate max-w-48" title={value || 'N/A'}>
                    {value || 'N/A'}
                </span>
            )
        },
        {
            key: 'customerType',
            title: 'Type',
            render: (value: string) => (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {value}
                </span>
            )
        },
        {
            key: 'totalPurchases',
            title: 'Total Purchases',
            render: (_value: number, record: WarehouseCustomer) => `₦${(record.totalSpent ?? 0).toLocaleString()}`
        },
        {
            key: 'lastPurchaseDate',
            title: 'Last Purchase',
            render: (value: string) =>
                value ? new Date(value).toLocaleDateString() : 'Never'
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value: any, record: WarehouseCustomer) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(record)}
                    className="inline-flex items-center"
                >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                        Customer Database
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage warehouse customers and their information
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={paginatedData}
                    columns={customerColumns}
                    loading={isLoading}
                    emptyMessage="No customers found"
                />
                {total > 0 && totalPages > 1 && (
                    <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                                <span className="font-medium">{total}</span> customers
                            </p>
                            <div className="inline-flex -space-x-px rounded-md shadow-sm">
                                <Button
                                    variant="outline"
                                    disabled={page === 1}
                                    onClick={() => setCurrentPage(page - 1)}
                                    className="rounded-l-md"
                                >
                                    Previous
                                </Button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                    const offset = Math.floor(Math.min(Math.max(page - 3, 0), Math.max(totalPages - 5, 0)));
                                    const pageNumber = 1 + offset + index;
                                    if (pageNumber > totalPages) return null;
                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={pageNumber === page ? 'primary' : 'outline'}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className="rounded-none"
                                        >
                                            {pageNumber}
                                        </Button>
                                    );
                                })}
                                <Button
                                    variant="outline"
                                    disabled={page === totalPages}
                                    onClick={() => setCurrentPage(page + 1)}
                                    className="rounded-r-md"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        <div className="flex sm:hidden w-full justify-between">
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
                    </div>
                )}
            </div>

            {/* Add/Edit Customer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Customer Name *"
                        {...register('name')}
                        error={errors.name?.message}
                        placeholder="Enter customer name"
                    />

                    <Input
                        label="Phone Number *"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Type *
                        </label>
                        <select
                            {...register('customerType')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select type</option>
                            <option value="INDIVIDUAL">Individual</option>
                            <option value="BUSINESS">Business</option>
                            <option value="RETAILER">Retailer</option>
                        </select>
                        {errors.customerType && (
                            <p className="mt-1 text-sm text-red-600">{errors.customerType.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {editingCustomer ? 'Update Customer' : 'Add Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
