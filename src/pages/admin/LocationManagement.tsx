/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/LocationManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/formatters';

interface LocationFormData {
    name: string;
    address: string;
    fuelAdjustment: number;
    driverWagesPerTrip: number;
}

export const LocationManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingLocation, setEditingLocation] = useState<any>(null);
    const [formData, setFormData] = useState<LocationFormData>({
        name: '',
        address: '',
        fuelAdjustment: 0,
        driverWagesPerTrip: 0,
    });

    const queryClient = useQueryClient();
    const pageSize = 10;

    const { data: locationsData, isLoading } = useQuery({
        queryKey: ['admin-locations', currentPage, searchTerm],
        queryFn: () =>
            adminService.getLocations({
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined,
            }),
    });

    const createMutation = useMutation({
        mutationFn: (data: LocationFormData) => adminService.createLocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
            globalToast.success('Location created successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create location');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LocationFormData> }) =>
            adminService.updateLocation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
            globalToast.success('Location updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update location');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteLocation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
            globalToast.success('Location deleted successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to delete location');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLocation) {
            updateMutation.mutate({ id: editingLocation.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (location: any) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            address: location.address || '',
            fuelAdjustment: location.fuelAdjustment || 0,
            driverWagesPerTrip: location.driverWagesPerTrip || 0,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
        setFormData({
            name: '',
            address: '',
            fuelAdjustment: 0,
            driverWagesPerTrip: 0,
        });
    };

    const locationColumns = [
        {
            key: 'name',
            title: 'Location',
            render: (value: string) => (
                <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900">{value}</span>
                </div>
            ),
        },
        {
            key: 'address',
            title: 'Address',
            render: (value: string) => (
                <span className="text-gray-600">{value || 'N/A'}</span>
            ),
        },
        {
            key: 'fuelAdjustment',
            title: 'Fuel Adjustment',
            render: (value: number) => (
                <span className="text-gray-900">{formatCurrency(value || 0)}</span>
            ),
        },
        {
            key: 'driverWagesPerTrip',
            title: 'Driver Wages/Trip',
            render: (value: number) => (
                <span className="text-gray-900 font-medium">{formatCurrency(value || 0)}</span>
            ),
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (value: boolean) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${value
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_: any, record: any) => (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage delivery and pickup locations
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Location
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                    />
                </div>
            </div>

            {/* Locations Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <Table
                    columns={locationColumns}
                    data={locationsData?.data?.locations || []}
                    emptyMessage="No locations found"
                />
            )}

            {/* Pagination */}
            {locationsData?.data?.pagination && (
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
                            disabled={currentPage >= locationsData.data.pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                <span className="font-medium">{locationsData.data.pagination.totalPages}</span>
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
                                disabled={currentPage >= locationsData.data.pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Location Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingLocation ? 'Edit Location' : 'Create New Location'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Location Name *"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Ikeja Depot"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Full address"
                        />
                    </div>

                    <Input
                        label="Fuel Adjustment (₦)"
                        type="number"
                        step="0.01"
                        value={formData.fuelAdjustment}
                        onChange={(e) =>
                            setFormData({ ...formData, fuelAdjustment: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="e.g., 50.00"
                    />

                    <Input
                        label="Driver Wages Per Trip (₦)"
                        type="number"
                        step="0.01"
                        value={formData.driverWagesPerTrip}
                        onChange={(e) =>
                            setFormData({ ...formData, driverWagesPerTrip: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="e.g., 15000.00"
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            {editingLocation ? 'Update Location' : 'Create Location'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};