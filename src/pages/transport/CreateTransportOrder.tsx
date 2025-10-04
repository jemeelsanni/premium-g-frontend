/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/CreateTransportOrder.tsx - ENHANCED WITH AUTO-CALCULATION

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Calculator, Info, DollarSign, Fuel, TrendingUp } from 'lucide-react';
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

    const [showCalculations, setShowCalculations] = useState(true);

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
            invoiceNumber: ''
        }
    });

    // Watch form fields for real-time calculations
    const fuelRequired = watch('fuelRequired') || 0;
    const fuelPricePerLiter = watch('fuelPricePerLiter') || 0;
    const totalOrderAmount = watch('totalOrderAmount') || 0;
    const locationId = watch('locationId');

    // Fetch locations for dropdown
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => transportService.getLocations()
    });

    // Fetch trucks for dropdown
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

    // Fetch location-specific rates for calculations
    const { data: locationRates } = useQuery({
        queryKey: ['location-rates', locationId],
        queryFn: async () => {
            if (!locationId) return null;
            // Fetch haulage and salary rates for the selected location
            const response = await transportService.getLocationRates(locationId);
            return response.data;
        },
        enabled: !!locationId
    });

    // Pre-fill form when editing
    useEffect(() => {
        if (existingOrder && isEditing) {
            setValue('orderNumber', existingOrder.orderNumber);
            setValue('clientName', existingOrder.clientName);
            setValue('clientPhone', existingOrder.clientPhone || '');
            setValue('pickupLocation', existingOrder.pickupLocation);
            setValue('deliveryAddress', existingOrder.deliveryAddress);
            setValue('locationId', existingOrder.locationId);
            setValue('totalOrderAmount', existingOrder.totalOrderAmount);
            setValue('fuelRequired', existingOrder.fuelRequired);
            setValue('fuelPricePerLiter', existingOrder.fuelPricePerLiter);
            setValue('truckId', existingOrder.truckId || '');
            setValue('driverDetails', existingOrder.driverDetails || '');
            setValue('invoiceNumber', existingOrder.invoiceNumber || '');
        }
    }, [existingOrder, isEditing, setValue]);

    // ============================================
    // REAL-TIME CALCULATION LOGIC
    // ============================================
    const calculations = React.useMemo(() => {
        // Default rates (will be overridden by location-specific rates)
        const DEFAULT_DRIVER_WAGES = 5000;
        const DEFAULT_TRIP_ALLOWANCE = 2000;
        const DEFAULT_MOTOR_BOY_WAGES = 3000;
        const DEFAULT_SERVICE_CHARGE_PERCENT = 10;

        // Use location-specific rates if available
        const driverWages = locationRates?.salaryRate?.driverRate || DEFAULT_DRIVER_WAGES;
        const tripAllowance = locationRates?.salaryRate?.tripAllowance || DEFAULT_TRIP_ALLOWANCE;
        const motorBoyWages = locationRates?.salaryRate?.motorBoyRate || DEFAULT_MOTOR_BOY_WAGES;
        const baseHaulageRate = locationRates?.haulageRate?.rate || totalOrderAmount;

        // Calculate costs
        const estimatedFuelCost = fuelRequired * fuelPricePerLiter;
        const totalWages = driverWages + tripAllowance + motorBoyWages;
        const serviceChargeExpense = (DEFAULT_SERVICE_CHARGE_PERCENT / 100) * baseHaulageRate;
        const totalTripExpenses = estimatedFuelCost + totalWages + serviceChargeExpense;

        // Calculate profitability
        const revenue = totalOrderAmount;
        const grossProfit = revenue - estimatedFuelCost - totalWages;
        const netProfit = revenue - totalTripExpenses;
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
            estimatedFuelCost,
            driverWages,
            tripAllowance,
            motorBoyWages,
            totalWages,
            serviceChargeExpense,
            totalTripExpenses,
            revenue,
            grossProfit,
            netProfit,
            profitMargin,
            hasLocationRates: !!locationRates
        };
    }, [fuelRequired, fuelPricePerLiter, totalOrderAmount, locationRates]);

    // Create/Update mutations
    const createMutation = useMutation({
        mutationFn: (data: TransportOrderFormData) => transportService.createOrder(data),
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
            transportService.updateOrder(id, data),
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
        if (isEditing && id) {
            updateMutation.mutate({ id, data });
        } else {
            createMutation.mutate(data);
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
                    <Button
                        variant="outline"
                        onClick={() => navigate('/transport/orders')}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            {isEditing ? 'Edit Transport Order' : 'Create Transport Order'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {isEditing ? 'Update order details' : 'Enter order information to create a new transport order'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Form Fields */}
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

                        {/* Route Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
                            <div className="grid grid-cols-1 gap-4">
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

                                <Select
                                    options={[]} label="Delivery Location *"
                                    {...register('locationId')}
                                    error={errors.locationId?.message}                                >
                                    <option value="">Select location</option>
                                    {locations?.data?.locations?.map((location: any) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </Select>

                                {locationRates && (
                                    <div className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium">Location rates loaded:</p>
                                            <p>Base haulage rate: ₦{locationRates.haulageRate?.rate?.toLocaleString()}</p>
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
                                    label="Fuel Required (Liters) *"
                                    type="number"
                                    step="0.01"
                                    {...register('fuelRequired', { valueAsNumber: true })}
                                    error={errors.fuelRequired?.message}
                                    placeholder="250"
                                />

                                <Input
                                    label="Fuel Price per Liter (₦) *"
                                    type="number"
                                    step="0.01"
                                    {...register('fuelPricePerLiter', { valueAsNumber: true })}
                                    error={errors.fuelPricePerLiter?.message}
                                    placeholder="500"
                                />
                            </div>
                        </div>

                        {/* Truck & Driver Details */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Truck & Driver Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    options={[]} label="Assign Truck"
                                    {...register('truckId')}
                                    error={errors.truckId?.message}                                >
                                    <option value="">Select truck (optional)</option>
                                    {trucks?.data?.trucks?.map((truck: any) => (
                                        <option key={truck.id} value={truck.id}>
                                            {truck.plateNumber} - {truck.capacity}kg
                                        </option>
                                    ))}
                                </Select>

                                <Input
                                    label="Driver Details"
                                    {...register('driverDetails')}
                                    error={errors.driverDetails?.message}
                                    placeholder="Driver name and contact"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Real-Time Calculations */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-4">
                            {/* Calculation Preview Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg shadow-lg overflow-hidden">
                                <div className="bg-blue-600 px-4 py-3">
                                    <div className="flex items-center justify-between">
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
                                </div>

                                {showCalculations && (
                                    <div className="p-4 space-y-4">
                                        {/* Revenue */}
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-600 flex items-center">
                                                    <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
                                                    Total Revenue
                                                </span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    ₦{calculations.revenue.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expenses Breakdown */}
                                        <div className="bg-white rounded-lg p-3 shadow-sm space-y-2">
                                            <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Trip Expenses</p>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600 flex items-center">
                                                    <Fuel className="h-3 w-3 mr-1 text-orange-500" />
                                                    Fuel Cost
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    ₦{calculations.estimatedFuelCost.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Driver Wages</span>
                                                <span className="font-semibold text-gray-900">
                                                    ₦{calculations.driverWages.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Trip Allowance</span>
                                                <span className="font-semibold text-gray-900">
                                                    ₦{calculations.tripAllowance.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Motor Boy Wages</span>
                                                <span className="font-semibold text-gray-900">
                                                    ₦{calculations.motorBoyWages.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Service Charge (10%)</span>
                                                <span className="font-semibold text-gray-900">
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
                                            <p className="text-xs font-semibold text-green-800 uppercase mb-2 flex items-center">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Profitability
                                            </p>

                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700">Gross Profit</span>
                                                <span className="font-semibold text-gray-900">
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
                                                <span className={`text-lg font-bold ${calculations.profitMargin >= 15 ? 'text-green-700' :
                                                    calculations.profitMargin >= 10 ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                    {calculations.profitMargin.toFixed(2)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Warnings/Alerts */}
                                        {calculations.profitMargin < 10 && calculations.revenue > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-2">
                                                        <p className="text-xs text-yellow-800">
                                                            <span className="font-medium">Low profit margin:</span> Consider adjusting the order amount or reducing costs.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!calculations.hasLocationRates && locationId && (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                <div className="flex">
                                                    <Info className="h-5 w-5 text-orange-400 flex-shrink-0" />
                                                    <p className="ml-2 text-xs text-orange-800">
                                                        Using default rates. Select a location to load specific pricing.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {calculations.revenue > 0 && calculations.profitMargin >= 15 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <p className="ml-2 text-xs text-green-800">
                                                        <span className="font-medium">Great margin!</span> This order has healthy profitability.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
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