/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/TruckManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Truck, Search, TrendingUp } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Truck as TruckType } from '../../types/transport';
import { globalToast } from '../../components/ui/Toast';
import { TruckPerformanceModal } from '../../components/transport/TruckPerformanceModal';


const truckSchema = z.object({
    plateNumber: z.string().min(1, 'Plate number is required'),
    capacity: z.number().min(1, 'Capacity must be greater than 0'),
});

type TruckFormData = z.infer<typeof truckSchema>;

export const TruckManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const [selectedTruckForPerformance, setSelectedTruckForPerformance] = useState<{ id: string, name: string } | null>(null);


    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<TruckFormData>({
        resolver: zodResolver(truckSchema),
        defaultValues: {
            plateNumber: '',
            capacity: 0,
        }
    });

    const { data: trucks, isLoading } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks(),
    });

    const createMutation = useMutation({
        mutationFn: (data: TruckFormData) => transportService.createTruck(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-trucks'] });
            globalToast.success('Truck added successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to add truck');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TruckFormData }) =>
            transportService.updateTruck(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-trucks'] });
            globalToast.success('Truck updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update truck');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => transportService.deleteTruck(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-trucks'] });
            globalToast.success('Truck deleted successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to delete truck');
        }
    });

    const handleOpenModal = (truck?: TruckType) => {
        if (truck) {
            setEditingTruck(truck);
            reset({
                plateNumber: truck.registrationNumber || '',
                capacity: truck.maxPallets || 0,  // ✅ Map maxPallets to capacity
            });
        } else {
            setEditingTruck(null);
            reset({
                plateNumber: '',
                capacity: 0,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTruck(null);
        reset();
    };

    const onSubmit = (data: TruckFormData) => {
        if (editingTruck) {
            updateMutation.mutate({ id: editingTruck.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (truck: TruckType) => {
        if (window.confirm(`Are you sure you want to delete truck ${truck.registrationNumber}?`)) {  // ✅ Change from plateNumber
            deleteMutation.mutate(truck.id);
        }
    };

    const filteredTrucks = Array.isArray(trucks)
        ? trucks.filter(truck =>
            truck.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];
    const truckColumns = [
        {
            key: 'registrationNumber',
            title: 'Registration Number',
            render: (value: string) => (
                <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="font-medium">{value || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'maxPallets',  // ✅ Change from 'capacity'
            title: 'Max Pallets',
            render: (value: number) => `${value?.toLocaleString() || 0} pallets`  // ✅ Add null check
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (value: boolean) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'createdAt',
            title: 'Added Date',
            render: (value: string) => new Date(value).toLocaleDateString()
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value: any, record: TruckType) => (
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(record)}
                        className="p-1"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(record)}
                        className="p-1"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value: any, row: TruckType) => (
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(row)}
                        className="p-1"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTruckForPerformance({
                            id: row.id,
                            name: row.registrationNumber
                        })}
                        className="p-1"
                        title="View Performance"
                    >
                        <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(row)}
                        className="p-1"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Fleet Management
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your truck fleet and vehicle information
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Truck
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Truck className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Trucks
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {trucks?.length || 0}
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
                                        Active Trucks
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {trucks?.filter(truck => truck.isActive).length || 0}
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
                                    <span className="text-purple-600 font-bold text-sm">kg</span>
                                </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Capacity
                                    </dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        {trucks?.reduce((sum, truck) => sum + truck.maxPallets, 0).toLocaleString() || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search trucks by plate number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Trucks Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <Table
                    data={filteredTrucks}
                    columns={truckColumns}
                    loading={isLoading}
                    emptyMessage="No trucks found"
                />
            </div>

            {/* Add/Edit Truck Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingTruck ? 'Edit Truck' : 'Add New Truck'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Plate Number *"
                        {...register('plateNumber')}
                        error={errors.plateNumber?.message}
                        placeholder="e.g., ABC-123-XY"
                    />

                    <Input
                        label="Capacity (kg) *"
                        type="number"
                        {...register('capacity', { valueAsNumber: true })}
                        error={errors.capacity?.message}
                        placeholder="e.g., 5000"
                    />

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
                            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            {editingTruck ? 'Update Truck' : 'Add Truck'}
                        </Button>
                    </div>
                </form>
            </Modal>
            {selectedTruckForPerformance && (
                <TruckPerformanceModal
                    isOpen={!!selectedTruckForPerformance}
                    onClose={() => setSelectedTruckForPerformance(null)}
                    truckId={selectedTruckForPerformance.id}
                    truckName={selectedTruckForPerformance.name}
                />
            )}
        </div>
    );
};


