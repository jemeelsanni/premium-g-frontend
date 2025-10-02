/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/CustomersList.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Users, Phone, Mail, Building, MapPin } from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { CustomerForm, CustomerFormData } from './CustomerForm';
import { toast } from 'react-hot-toast';

export const CustomersList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: customersData, isLoading } = useQuery({
        queryKey: ['distribution-customers', searchTerm],
        queryFn: () => distributionService.getCustomers(1, 50), // Get more customers for now
    });

    const createMutation = useMutation({
        mutationFn: (data: CustomerFormData) => distributionService.createCustomer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-customers'] });
            toast.success('Customer created successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create customer');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
            distributionService.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-customers'] });
            toast.success('Customer updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update customer');
        }
    });

    const handleOpenModal = (customer?: any) => {
        setEditingCustomer(customer || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleFormSubmit = (data: CustomerFormData) => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    // Extract customers array safely from response
    const customers = Array.isArray(customersData?.data?.customers)
        ? customersData.data.customers
        : [];

    const customerColumns = [
        {
            key: 'name',
            title: 'Customer',
            render: (value: string, record: any) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{value}</div>
                        {record.email && (
                            <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {record.email}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            title: 'Contact',
            render: (value: string, record: any) => (
                <div className="space-y-1">
                    {value && (
                        <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {value}
                        </div>
                    )}
                    {record.territory && (
                        <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {record.territory}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'customerType',
            title: 'Type',
            render: (value: string) => {
                if (!value) return 'N/A';
                const colorMap = {
                    BUSINESS: 'bg-blue-100 text-blue-800',
                    ENTERPRISE: 'bg-purple-100 text-purple-800',
                    GOVERNMENT: 'bg-green-100 text-green-800',
                };
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorMap[value as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}`}>
                        {value}
                    </span>
                );
            }
        },
        {
            key: 'totalOrders',
            title: 'Orders',
            render: (value: number) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{value || 0}</div>
                    <div className="text-xs text-gray-500">orders</div>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value: any, record: any) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(record)}
                    className="text-blue-600 hover:text-blue-800"
                >
                    <Edit className="h-4 w-4 mr-1" />
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
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Distribution Customers
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your B2B customers and their information
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button onClick={() => handleOpenModal()} className="inline-flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Customers
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {customers.length}
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
                                <Building className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Enterprise Clients
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {customers.filter((c: { customerType: string; }) => c.customerType === 'ENTERPRISE').length}
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
                                <MapPin className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Active Territories
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {new Set(customers.filter((c: { territory: any; }) => c.territory).map((c: { territory: any; }) => c.territory)).size}
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
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {/* Add more filters here if needed */}
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={customers}
                    columns={customerColumns}
                    loading={isLoading}
                    emptyMessage="No customers found. Add your first customer to get started."
                />
            </div>

            {/* Customer Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                maxWidth="4xl"
            >
                <CustomerForm
                    initialData={editingCustomer}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseModal}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                    isEditing={!!editingCustomer}
                />
            </Modal>
        </div>
    );
};