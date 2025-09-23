/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { truckApi, CreateTruckData, UpdateTruckData } from '../../api/truck.api';
import { Truck, Plus, Edit, Trash2, X, Save, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createTruckSchema = z.object({
    truckId: z.string().min(1, 'Truck ID is required'),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    maxPallets: z.number().min(1, 'Max pallets must be at least 1'),
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().optional(),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof createTruckSchema>;

export const TruckManagement = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewingId, setViewingId] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(createTruckSchema),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['trucks'],
        queryFn: () => truckApi.getTrucks(),
    });

    const trucks = data?.data?.trucks || [];
    const viewingTruck = trucks.find((t: any) => t.truckId === viewingId);

    const createMutation = useMutation({
        mutationFn: (data: CreateTruckData) => truckApi.createTruck(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trucks'] });
            setIsCreating(false);
            reset();
            alert('Truck created successfully!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to create truck');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTruckData }) =>
            truckApi.updateTruck(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trucks'] });
            setEditingId(null);
            reset();
            alert('Truck updated successfully!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to update truck');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => truckApi.deleteTruck(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trucks'] });
            alert('Truck deleted successfully!');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to delete truck');
        },
    });

    const onSubmit = (data: FormData) => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (truck: any) => {
        setEditingId(truck.truckId);
        setValue('truckId', truck.truckId);
        setValue('registrationNumber', truck.registrationNumber);
        setValue('maxPallets', truck.maxPallets);
        setValue('make', truck.make || '');
        setValue('model', truck.model || '');
        setValue('year', truck.year || undefined);
        setValue('notes', truck.notes || '');
        setIsCreating(true);
    };

    const handleToggleActive = (truck: any) => {
        updateMutation.mutate({
            id: truck.truckId,
            data: { isActive: !truck.isActive },
        });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this truck? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        reset();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Truck Fleet Management</h1>
                    <p className="text-gray-600 mt-1">Manage your transport fleet and vehicle details</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Truck
                    </button>
                )}
            </div>

            {/* Create/Edit Truck Form */}
            {isCreating && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingId ? 'Edit Truck' : 'Add New Truck'}
                        </h2>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Truck ID * <span className="text-xs text-gray-500">(e.g., TRUCK-001)</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('truckId')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="TRUCK-001"
                                    disabled={!!editingId}
                                />
                                {errors.truckId && (
                                    <p className="text-red-500 text-xs mt-1">{errors.truckId.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Registration Number *
                                </label>
                                <input
                                    type="text"
                                    {...register('registrationNumber')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="ABC-123-XY"
                                />
                                {errors.registrationNumber && (
                                    <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Pallets Capacity *
                                </label>
                                <input
                                    type="number"
                                    {...register('maxPallets', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="12"
                                />
                                {errors.maxPallets && (
                                    <p className="text-red-500 text-xs mt-1">{errors.maxPallets.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Make
                                </label>
                                <input
                                    type="text"
                                    {...register('make')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Toyota"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Model
                                </label>
                                <input
                                    type="text"
                                    {...register('model')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Hiace"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Year
                                </label>
                                <input
                                    type="number"
                                    {...register('year', { valueAsNumber: true })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="2024"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    {...register('notes')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Additional information about the truck..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? 'Update Truck' : 'Create Truck'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Trucks List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Truck Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Capacity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vehicle Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        Loading trucks...
                                    </td>
                                </tr>
                            ) : trucks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No trucks found. Add your first truck to get started.
                                    </td>
                                </tr>
                            ) : (
                                trucks.map((truck: any) => (
                                    <tr key={truck.truckId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Truck className="w-5 h-5 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {truck.truckId}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {truck.registrationNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="text-gray-900">{truck.maxPallets} pallets</div>
                                                <div className="text-xs text-gray-500">
                                                    {truck.currentLoad} loaded, {truck.availableSpace} free
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {truck.make || truck.model ? (
                                                <div>
                                                    {truck.make} {truck.model}
                                                    {truck.year && <div className="text-xs text-gray-500">{truck.year}</div>}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleActive(truck)}
                                                disabled={updateMutation.isPending}
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${truck.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {truck.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setViewingId(truck.truckId)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="View details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(truck)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit truck"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(truck.truckId)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete truck"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Truck Modal */}
            {viewingTruck && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Truck Details</h3>
                            <button
                                onClick={() => setViewingId(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Truck ID</p>
                                <p className="font-semibold">{viewingTruck.truckId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Registration</p>
                                <p className="font-semibold">{viewingTruck.registrationNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Make/Model</p>
                                <p className="font-semibold">
                                    {viewingTruck.make || viewingTruck.model
                                        ? `${viewingTruck.make || ''} ${viewingTruck.model || ''}`.trim()
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Year</p>
                                <p className="font-semibold">{viewingTruck.year || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Capacity</p>
                                <p className="font-semibold">{viewingTruck.maxPallets} pallets</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className={`font-semibold ${viewingTruck.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {viewingTruck.isActive ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            {viewingTruck.notes && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">Notes</p>
                                    <p className="font-semibold">{viewingTruck.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};