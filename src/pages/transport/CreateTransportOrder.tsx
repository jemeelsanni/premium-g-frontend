/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/CreateTransportOrder.tsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, MapPin } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';

const transportOrderSchema = z.object({
    orderNumber: z.string().min(1, 'Order number is required'),
    clientName: z.string().min(1, 'Client name is required'),
    clientPhone: z.string().optional(),
    pickupLocation: z.string().min(1, 'Pickup location is required'),
    deliveryAddress: z.string().min(1, 'Delivery address is required'),  // ✅ Changed from deliveryLocation
    locationId: z.string().min(1, 'Location is required'),
    totalOrderAmount: z.number().min(1, 'Order amount must be greater than 0'),
    fuelRequired: z.number().min(0, 'Fuel required must be 0 or greater'),  // ✅ Added
    fuelPricePerLiter: z.number().min(0, 'Fuel price must be 0 or greater'),  // ✅ Added
    truckId: z.string().optional(),
    driverDetails: z.string().optional(),
});

type TransportOrderFormData = z.infer<typeof transportOrderSchema>;

export const CreateTransportOrder: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<TransportOrderFormData>({
        resolver: zodResolver(transportOrderSchema),
        defaultValues: {
            orderNumber: `TO-${Date.now()}`,  // Auto-generate
            clientName: '',
            clientPhone: '',
            pickupLocation: '',
            deliveryAddress: '',
            locationId: '',
            totalOrderAmount: 0,
            fuelRequired: 0,  // ✅ Added
            fuelPricePerLiter: 0,  // ✅ Added
            truckId: '',
            driverDetails: '',
        }
    });


    // Fetch trucks for dropdown
    const { data: trucks } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks(),
    });

    // Fetch existing order if editing
    const { data: existingOrder, isLoading: loadingOrder } = useQuery({
        queryKey: ['transport-order', id],
        queryFn: () => transportService.getOrder(id!),
        enabled: isEditing,
    });

    // Set form values when editing
    useEffect(() => {
        if (existingOrder && isEditing) {
            setValue('clientName', existingOrder.clientName);
            setValue('pickupLocation', existingOrder.pickupLocation);
            setValue('deliveryAddress', existingOrder.deliveryAddress);  // ✅ Changed from deliveryLocation
            setValue('totalOrderAmount', existingOrder.totalOrderAmount);
            setValue('truckId', existingOrder.truckId || '');
            setValue('fuelRequired', existingOrder.fuelRequired || 0);  // ✅ Added
            setValue('fuelPricePerLiter', existingOrder.fuelPricePerLiter || 0);  // ✅ Added
            setValue('locationId', existingOrder.locationId || '');  // ✅ Added
        }
    }, [existingOrder, isEditing, setValue]);

    // Create/Update mutations
    const createMutation = useMutation({
        mutationFn: (data: TransportOrderFormData) => transportService.createOrder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            globalToast.success('Transport order created successfully!');
            navigate('/transport/orders');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create transport order');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: TransportOrderFormData) => transportService.updateOrder(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transport-order', id] });
            globalToast.success('Transport order updated successfully!');
            navigate('/transport/orders');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update transport order');
        }
    });

    const onSubmit = (data: TransportOrderFormData) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    if (isEditing && loadingOrder) {
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
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/transport/orders')}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            {isEditing ? 'Edit Transport Order' : 'Create New Transport Order'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {isEditing ? 'Update transport order details' : 'Fill in the details to create a new transport order'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Client Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Input
                                    label="Order Number *"
                                    {...register('orderNumber')}
                                    error={errors.orderNumber?.message}
                                    placeholder="TO-xxxxx"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <Input
                                    label="Client Name *"
                                    {...register('clientName')}
                                    error={errors.clientName?.message}
                                    placeholder="Enter client name"
                                />
                            </div>

                            <Input
                                label="Client Phone (Optional)"
                                {...register('clientPhone')}
                                error={errors.clientPhone?.message}
                                placeholder="Enter phone number"
                            />

                            <Input
                                label="Total Order Amount (₦) *"
                                type="number"
                                step="0.01"
                                {...register('totalOrderAmount', { valueAsNumber: true })}
                                error={errors.totalOrderAmount?.message}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* Route Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <MapPin className="h-5 w-5 mr-2" />
                            Route Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Input
                                label="Pickup Location *"
                                {...register('pickupLocation')}
                                error={errors.pickupLocation?.message}
                                placeholder="Enter pickup address"
                            />

                            <Input
                                label="Delivery Address *"
                                {...register('deliveryAddress')}
                                error={errors.deliveryAddress?.message}
                                placeholder="Enter delivery address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Location *
                            </label>
                            <select
                                {...register('locationId')}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Select a location</option>
                                {/* You'll need to fetch locations and map them here */}
                            </select>
                            {errors.locationId && (
                                <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fuel & Transport Details */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Fuel & Transport Details</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Input
                                label="Fuel Required (Liters) *"
                                type="number"
                                step="0.01"
                                {...register('fuelRequired', { valueAsNumber: true })}
                                error={errors.fuelRequired?.message}
                                placeholder="0.00"
                            />

                            <Input
                                label="Fuel Price Per Liter (₦) *"
                                type="number"
                                step="0.01"
                                {...register('fuelPricePerLiter', { valueAsNumber: true })}
                                error={errors.fuelPricePerLiter?.message}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assign Truck (Optional)
                                </label>
                                <select
                                    {...register('truckId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">Select a truck</option>
                                    {trucks?.filter(truck => truck.isActive).map((truck) => (
                                        <option key={truck.id} value={truck.truckId}>  {/* ✅ Use truckId as value */}
                                            {truck.registrationNumber} - {truck.maxPallets} pallets  {/* ✅ Changed from capacity */}
                                        </option>
                                    ))}
                                </select>
                                {errors.truckId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.truckId.message}</p>
                                )}
                            </div>

                            <Input
                                label="Driver Details (Optional)"
                                {...register('driverDetails')}
                                error={errors.driverDetails?.message}
                                placeholder="Enter driver information"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/transport/orders')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        className="inline-flex items-center"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? 'Update Order' : 'Create Order'}
                    </Button>
                </div>
            </form>        </div>
    );
};