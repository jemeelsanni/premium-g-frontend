/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/CreateTransportOrder.tsx - FIXED VERSION

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Calculator } from 'lucide-react';
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
    deliveryAddress: z.string().min(1, 'Delivery address is required'),
    locationId: z.string().min(1, 'Location is required'),
    totalOrderAmount: z.number().min(1, 'Order amount must be greater than 0'),
    fuelRequired: z.number().min(0, 'Fuel required must be 0 or greater'),
    fuelPricePerLiter: z.number().min(0, 'Fuel price must be 0 or greater'),
    truckId: z.string().optional(),
    driverDetails: z.string().optional(),
    invoiceNumber: z.string().optional(),
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
        watch,
        formState: { errors, isSubmitting }
    } = useForm<TransportOrderFormData>({
        resolver: zodResolver(transportOrderSchema),
        defaultValues: {
            orderNumber: `TO-${Date.now()}`,
            clientName: '',
            clientPhone: '',
            pickupLocation: '',
            deliveryAddress: '',
            locationId: '',
            totalOrderAmount: 0,
            fuelRequired: 0,
            fuelPricePerLiter: 0,
            truckId: '',
            driverDetails: '',
            invoiceNumber: '',
        }
    });

    const fuelRequired = watch('fuelRequired');
    const fuelPrice = watch('fuelPricePerLiter');
    const estimatedFuelCost = fuelRequired * fuelPrice;

    // Fetch trucks for dropdown
    const { data: trucks } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks(),
    });

    // ✅ Fetch locations for dropdown
    const { data: locations, isLoading: loadingLocations } = useQuery({
        queryKey: ['transport-locations'],
        queryFn: () => transportService.getLocations(),
    });

    // Fetch existing order if editing
    const { data: existingOrder, isLoading: loadingOrder } = useQuery({
        queryKey: ['transport-order', id],
        queryFn: () => transportService.getOrder(id!),
        enabled: isEditing,
    });

    // Populate form when editing
    useEffect(() => {
        if (existingOrder) {
            setValue('orderNumber', existingOrder.orderNumber);
            setValue('clientName', existingOrder.clientName);
            setValue('clientPhone', existingOrder.clientPhone || '');
            setValue('pickupLocation', existingOrder.pickupLocation);
            setValue('deliveryAddress', existingOrder.deliveryAddress);
            setValue('locationId', existingOrder.locationId);
            setValue('totalOrderAmount', parseFloat(existingOrder.totalOrderAmount.toString()));
            setValue('fuelRequired', parseFloat(existingOrder.fuelRequired.toString()));
            setValue('fuelPricePerLiter', parseFloat(existingOrder.fuelPricePerLiter.toString()));
            setValue('truckId', existingOrder.truckId || '');
            setValue('driverDetails', existingOrder.driverDetails || '');
            setValue('invoiceNumber', existingOrder.invoiceNumber || '');
        }
    }, [existingOrder, setValue]);

    const createMutation = useMutation({
        mutationFn: (data: TransportOrderFormData) => transportService.createOrder(data),
        onSuccess: () => {
            globalToast.success('Transport order created successfully!');
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            navigate('/transport/orders');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create transport order');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: TransportOrderFormData) => transportService.updateOrder(id!, data),
        onSuccess: () => {
            globalToast.success('Transport order updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transport-order', id] });
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
                            {isEditing ? 'Update transport order details' : 'Create a new transport contract with auto-calculated costs'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Order Information */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Number <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    {...register('orderNumber')}
                                    error={errors.orderNumber?.message}
                                    placeholder="TO-123456"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Invoice Number
                                </label>
                                <Input
                                    {...register('invoiceNumber')}
                                    placeholder="INV-123456"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    {...register('clientName')}
                                    error={errors.clientName?.message}
                                    placeholder="Enter client name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client Phone
                                </label>
                                <Input
                                    {...register('clientPhone')}
                                    placeholder="+234 XXX XXX XXXX"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location Information */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Location Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Location <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    {...register('pickupLocation')}
                                    error={errors.pickupLocation?.message}
                                    placeholder="Enter pickup location"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Address <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    {...register('deliveryAddress')}
                                    error={errors.deliveryAddress?.message}
                                    placeholder="Enter delivery address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Destination Location <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('locationId')}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    disabled={loadingLocations}
                                >
                                    <option value="">Select destination location</option>
                                    {locations?.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.locationId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial Details */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Order Amount (₦) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register('totalOrderAmount', { valueAsNumber: true })}
                                    error={errors.totalOrderAmount?.message}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fuel Required (Liters) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register('fuelRequired', { valueAsNumber: true })}
                                    error={errors.fuelRequired?.message}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fuel Price Per Liter (₦) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    {...register('fuelPricePerLiter', { valueAsNumber: true })}
                                    error={errors.fuelPricePerLiter?.message}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex items-center">
                                <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center">
                                        <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">Estimated Fuel Cost</p>
                                            <p className="text-lg font-bold text-blue-900">
                                                ₦{estimatedFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Details */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign Truck
                                </label>
                                <select
                                    {...register('truckId')}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">Select truck (optional)</option>
                                    {trucks?.map((truck) => (
                                        <option key={truck.truckId} value={truck.truckId}>
                                            {truck.registrationNumber || truck.truckId} - {truck.maxPallets} pallets
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Driver Details
                                </label>
                                <Input
                                    {...register('driverDetails')}
                                    placeholder="Driver name and contact"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <Calculator className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Auto-Calculated Costs
                                </h3>
                                <p className="mt-2 text-sm text-yellow-700">
                                    Upon creation, the system will automatically calculate driver wages, trip allowances,
                                    service charges (10%), and profit margins based on the selected location's rates.
                                    You'll see a detailed cost breakdown after submitting.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/transport/orders')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Saving...' : isEditing ? 'Update Order' : 'Create Order'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};