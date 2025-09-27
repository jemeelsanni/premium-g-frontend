/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/warehouse/CustomersList.tsx
import React, { useState } from 'react';
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

    const { data: customersData, isLoading } = useQuery({
        queryKey: ['warehouse-customers', currentPage, pageSize],
        queryFn: () => warehouseService.getCustomers(currentPage, pageSize),
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
                phone: customer.phone,
                address: customer.address,
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

    const filteredData = customersData?.data?.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    ) || [];

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
            render: (value: string) => (
                <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{value}</span>
                </div>
            )
        },
        {
            key: 'address',
            title: 'Address',
            render: (value: string) => (
                <span className="text-sm text-gray-600 truncate max-w-48" title={value}>
                    {value}
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
            render: (value: number) => `₦${value.toLocaleString()}`
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={filteredData}
                    columns={customerColumns}
                    loading={isLoading}
                    emptyMessage="No customers found"
                />
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
                            <option value="RETAIL">Retail Business</option>
                            <option value="WHOLESALE">Wholesale</option>
                            <option value="CORPORATE">Corporate</option>
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


