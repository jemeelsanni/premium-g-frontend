/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/CreateTransportOrder.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Calculator, Fuel, TrendingUp, MapPin, User } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';

const transportOrderSchema = z.object({
    orderNumber: z.string().min(1, 'Order number is required'),
    clientName: z.string().min(1, 'Client name is required'),
    clientPhone: z.string().optional(),
    pickupLocation: z.string().optional(),
    locationId: z.string().min(1, 'Location is required'),
    totalOrderAmount: z.number().min(1, 'Order amount must be greater than 0'),
    fuelCostPerLitre: z.number().min(0, 'Fuel cost per litre must be 0 or greater'),
    tripAllowance: z.number().min(0).optional(),
    truckId: z.string().optional().or(z.literal('')),
    driverDetails: z.string().optional(),
    invoiceNumber: z.string().optional(),
});

type TransportOrderFormData = z.infer<typeof transportOrderSchema>;

export const CreateTransportOrder: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const [showCalculations, setShowCalculations] = useState(true);
    const [selectedLocationData, setSelectedLocationData] = useState<any>(null);

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
            locationId: '',
            totalOrderAmount: 0,
            fuelCostPerLitre: 0,
            tripAllowance: 0,
            truckId: undefined,
            driverDetails: '',
            invoiceNumber: ''
        }
    });

    const fuelCostPerLitre = watch('fuelCostPerLitre') || 0;
    const totalOrderAmount = watch('totalOrderAmount') || 0;
    const locationId = watch('locationId');
    const tripAllowance = watch('tripAllowance') || 0;

    // Fetch locations (includes per-trip cost data)
    const { data: locations } = useQuery({
        queryKey: ['transport-locations'],
        queryFn: () => transportService.getLocations()
    });

    // Fetch trucks
    const { data: trucks } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks()
    });

    // Fetch existing order if editing
    const { data: existingOrder, isLoading: loadingOrder } = useQuery({
        queryKey: ['transport-order', id],
        queryFn: () => transportService.getOrder(id!),
        enabled: isEditing
    });

    // When location changes, find the location data to auto-populate costs
    useEffect(() => {
        if (locationId && locations) {
            const loc = locations.find((l: any) => l.id === locationId);
            setSelectedLocationData(loc || null);
        } else {
            setSelectedLocationData(null);
        }
    }, [locationId, locations]);

    // Pre-fill form when editing
    useEffect(() => {
        if (existingOrder && isEditing) {
            setValue('orderNumber', existingOrder.orderNumber);
            setValue('clientName', existingOrder.clientName);
            setValue('clientPhone', existingOrder.clientPhone || '');
            setValue('pickupLocation', existingOrder.pickupLocation || '');
            setValue('locationId', existingOrder.locationId);
            setValue('totalOrderAmount', existingOrder.totalOrderAmount);
            setValue('fuelCostPerLitre', existingOrder.fuelPricePerLiter || 0);
            setValue('tripAllowance', existingOrder.tripAllowance || 0);
            setValue('truckId', existingOrder.truckId || '');
            setValue('driverDetails', existingOrder.driverDetails || '');
            setValue('invoiceNumber', existingOrder.invoiceNumber || '');
        }
    }, [existingOrder, isEditing, setValue]);

    // Real-time calculations using location rates
    const calculations = React.useMemo(() => {
        const fuelRequired = selectedLocationData ? Number(selectedLocationData.fuelRequired) : 0;
        const driverWages = selectedLocationData ? Number(selectedLocationData.driverWages) : 0;

        const estimatedFuelCost = fuelRequired * fuelCostPerLitre;
        const serviceChargePercent = 10;
        const serviceChargeExpense = (totalOrderAmount * serviceChargePercent) / 100;
        const totalWages = driverWages + Number(tripAllowance);
        const totalTripExpenses = estimatedFuelCost + totalWages + serviceChargeExpense;

        const grossProfit = totalOrderAmount - estimatedFuelCost - totalWages;
        const netProfit = totalOrderAmount - totalTripExpenses;
        const profitMargin = totalOrderAmount > 0 ? (netProfit / totalOrderAmount) * 100 : 0;

        return {
            fuelRequired,
            fuelCostPerLitre,
            driverWages,
            estimatedFuelCost,
            serviceChargeExpense,
            totalWages,
            totalTripExpenses,
            grossProfit,
            netProfit,
            profitMargin,
        };
    }, [fuelCostPerLitre, totalOrderAmount, tripAllowance, selectedLocationData]);

    const createMutation = useMutation({
        mutationFn: (data: TransportOrderFormData) => transportService.createOrder(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            globalToast.success('Transport order created successfully!');
            navigate('/transport/orders');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create order');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TransportOrderFormData }) =>
            transportService.updateOrder(id, data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            queryClient.invalidateQueries({ queryKey: ['transport-order', id] });
            globalToast.success('Transport order updated successfully!');
            navigate('/transport/orders');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update order');
        }
    });

    const onSubmit = (data: TransportOrderFormData) => {
        const submitData = {
            ...data,
            truckId: data.truckId?.trim() || undefined,
            clientPhone: data.clientPhone?.trim() || undefined,
            driverDetails: data.driverDetails?.trim() || undefined,
            invoiceNumber: data.invoiceNumber?.trim() || undefined,
            tripAllowance: data.tripAllowance || 0,
        };
        if (isEditing) {
            updateMutation.mutate({ id: id!, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    if (loadingOrder) {
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
                    <Button variant="outline" onClick={() => navigate('/transport/orders')} className="p-2">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            {isEditing ? 'Edit Transport Order' : 'Create Transport Order'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Select a location to auto-populate cost rates
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Order Number *"
                                    {...register('orderNumber')}
                                    error={errors.orderNumber?.message}
                                    placeholder="TO-12345"
                                />
                                <Input
                                    label="Client Name *"
                                    {...register('clientName')}
                                    error={errors.clientName?.message}
                                    placeholder="Enter client name"
                                />
                                <Input
                                    label="Client Phone"
                                    {...register('clientPhone')}
                                    error={errors.clientPhone?.message}
                                    placeholder="+234 XXX XXX XXXX"
                                />
                                <Input
                                    label="Invoice Number"
                                    {...register('invoiceNumber')}
                                    error={errors.invoiceNumber?.message}
                                    placeholder="INV-12345"
                                />
                            </div>
                        </div>

                        {/* Route & Location */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Route & Location</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    label="Pickup Location (optional)"
                                    {...register('pickupLocation')}
                                    error={errors.pickupLocation?.message}
                                    placeholder="Enter pickup address"
                                />
                                <Select
                                    label="Delivery Location *"
                                    options={[
                                        { value: '', label: 'Select location' },
                                        ...(locations?.map(location => ({
                                            value: location.id,
                                            label: location.name
                                        })) || [])
                                    ]}
                                    {...register('locationId')}
                                    error={errors.locationId?.message}
                                />

                                {/* Auto-populated location rates banner */}
                                {selectedLocationData && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            Rates loaded for {selectedLocationData.name}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Fuel className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Fuel required</p>
                                                    <p className="font-medium text-gray-900">
                                                        {Number(selectedLocationData.fuelRequired).toLocaleString()} litres
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Driver wages</p>
                                                    <p className="font-medium text-gray-900">
                                                        ₦{Number(selectedLocationData.driverWages).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Total Order Amount (₦) *"
                                    type="number"
                                    step="0.01"
                                    {...register('totalOrderAmount', { valueAsNumber: true })}
                                    error={errors.totalOrderAmount?.message}
                                    placeholder="500000"
                                />
                                <Input
                                    label="Fuel Cost per Litre (₦) *"
                                    type="number"
                                    step="0.01"
                                    {...register('fuelCostPerLitre', { valueAsNumber: true })}
                                    error={errors.fuelCostPerLitre?.message}
                                    placeholder="650"
                                />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trip Allowance (₦)
                                        <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register('tripAllowance', { valueAsNumber: true })}
                                        error={errors.tripAllowance?.message}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Truck & Driver */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Truck & Driver Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Assign Truck"
                                    options={[
                                        { value: '', label: 'Select truck (optional)' },
                                        ...(trucks?.map(truck => ({
                                            value: truck.truckId,
                                            label: `${truck.registrationNumber} - ${truck.maxPallets} pallets`
                                        })) || [])
                                    ]}
                                    {...register('truckId')}
                                    error={errors.truckId?.message}
                                />
                                <Input
                                    label="Driver Details"
                                    {...register('driverDetails')}
                                    error={errors.driverDetails?.message}
                                    placeholder="Driver name and contact"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Cost Breakdown */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-lg overflow-hidden">
                                <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
                                    <h3 className="text-white font-semibold flex items-center">
                                        <Calculator className="h-5 w-5 mr-2" />
                                        Cost Breakdown
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCalculations(!showCalculations)}
                                        className="text-white hover:text-blue-100"
                                    >
                                        {showCalculations ? '−' : '+'}
                                    </button>
                                </div>

                                {showCalculations && (
                                    <div className="p-4 space-y-4">
                                        {!selectedLocationData && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                                Select a location to see cost breakdown
                                            </div>
                                        )}

                                        {/* Revenue */}
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    ₦{totalOrderAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expenses */}
                                        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                                            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Trip Expenses</p>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <Fuel className="h-3 w-3 text-orange-500" />
                                                    Fuel ({calculations.fuelRequired}L × ₦{calculations.fuelCostPerLitre.toLocaleString()})
                                                </span>
                                                <span className="font-medium">
                                                    ₦{calculations.estimatedFuelCost.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <User className="h-3 w-3 text-blue-500" />
                                                    Driver wages
                                                </span>
                                                <span className="font-medium">
                                                    ₦{calculations.driverWages.toLocaleString()}
                                                </span>
                                            </div>

                                            {Number(tripAllowance) > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-500">Trip allowance</span>
                                                    <span className="font-medium">
                                                        ₦{Number(tripAllowance).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Service charge (10%)</span>
                                                <span className="font-medium">
                                                    ₦{calculations.serviceChargeExpense.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                                                <span className="font-medium text-gray-700">Total Expenses</span>
                                                <span className="font-bold text-red-600">
                                                    ₦{calculations.totalTripExpenses.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Profitability */}
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 space-y-2">
                                            <p className="text-xs font-semibold text-green-800 uppercase flex items-center">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Profitability
                                            </p>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700">Gross Profit</span>
                                                <span className="font-semibold">
                                                    ₦{calculations.grossProfit.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-green-800">Net Profit</span>
                                                <span className="text-lg font-bold text-green-700">
                                                    ₦{calculations.netProfit.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-green-800">Profit Margin</span>
                                                <span className={`text-lg font-bold ${
                                                    calculations.profitMargin >= 15 ? 'text-green-700' :
                                                    calculations.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {calculations.profitMargin.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>

                                        {totalOrderAmount > 0 && calculations.profitMargin < 10 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                                                <span className="font-medium">Low profit margin.</span> Consider adjusting the order amount or reducing costs.
                                            </div>
                                        )}
                                        {totalOrderAmount > 0 && calculations.profitMargin >= 15 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                                                <span className="font-medium">Great margin!</span> This order has healthy profitability.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="bg-white shadow rounded-lg p-4 space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isEditing ? 'Update Order' : 'Create Order'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/transport/orders')}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
