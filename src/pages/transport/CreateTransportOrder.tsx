/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transportApi, CreateTransportOrderData } from '../../api/transport.api';
import { ArrowLeft, Truck, Calculator } from 'lucide-react';
import apiClient from '../../api/client';

const createTransportOrderSchema = z.object({
    distributionOrderId: z.string().min(1, 'Distribution order is required'),
    orderNumber: z.string().min(1, 'Order number is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    locationId: z.string().min(1, 'Location is required'),
    truckId: z.string().optional(),
    totalOrderAmount: z.number().min(0, 'Amount must be positive'),
    fuelRequired: z.number().min(0, 'Fuel required must be positive'),
    fuelPricePerLiter: z.number().min(0, 'Fuel price must be positive'),
    driverDetails: z.string().optional(),
});

type FormData = z.infer<typeof createTransportOrderSchema>;

export const CreateTransportOrder = () => {
    const navigate = useNavigate();
    const [calculatedCosts, setCalculatedCosts] = useState<{
        totalFuelCost: number;
        estimatedProfit: number;
        profitMargin: number;
    } | null>(null);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(createTransportOrderSchema),
    });

    const fuelRequired = watch('fuelRequired');
    const fuelPricePerLiter = watch('fuelPricePerLiter');
    const totalOrderAmount = watch('totalOrderAmount');
    const selectedDistributionOrderId = watch('distributionOrderId');

    useEffect(() => {
        if (fuelRequired && fuelPricePerLiter && totalOrderAmount) {
            const totalFuelCost = fuelRequired * fuelPricePerLiter;
            const estimatedProfit = totalOrderAmount - totalFuelCost;
            const profitMargin = totalOrderAmount > 0 ? (estimatedProfit / totalOrderAmount) * 100 : 0;

            setCalculatedCosts({
                totalFuelCost,
                estimatedProfit,
                profitMargin,
            });
        }
    }, [fuelRequired, fuelPricePerLiter, totalOrderAmount]);

    // Generate next order number
    const { data: nextOrderNumber } = useQuery({
        queryKey: ['next-transport-order-number'],
        queryFn: async () => {
            const response = await apiClient.get('/transport/orders');
            const orders = response.data?.data?.orders || [];

            if (orders.length === 0) {
                return 'TO-001';
            }

            // Extract numbers and find the highest
            const numbers = orders
                .map((order: any) => {
                    const match = order.orderNumber.match(/TO-(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter((num: number) => !isNaN(num));

            const maxNumber = Math.max(...numbers, 0);
            const nextNumber = maxNumber + 1;

            return `TO-${String(nextNumber).padStart(3, '0')}`;
        },
    });

    // Generate invoice number based on order number
    useEffect(() => {
        if (nextOrderNumber) {
            setValue('orderNumber', nextOrderNumber);
            setValue('invoiceNumber', `INV-${nextOrderNumber.replace('TO-', '')}`);
        }
    }, [nextOrderNumber, setValue]);

    // Fetch distribution orders
    const { data: distributionOrdersData, isLoading: loadingOrders } = useQuery({
        queryKey: ['distribution-orders-for-transport'],
        queryFn: async () => {
            const response = await apiClient.get('/distribution/orders');
            return response.data;
        },
    });

    // Fetch locations
    const { data: locationsData } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const response = await apiClient.get('/admin/locations');
            return response.data;
        },
    });

    // Fetch trucks
    const { data: trucksData } = useQuery({
        queryKey: ['trucks'],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/transport/trucks');
                return response.data;
            } catch (error) {
                console.log('Trucks endpoint error:', error);
                return { data: { trucks: [] } };
            }
        },
    });

    // Auto-fill form when distribution order is selected
    useEffect(() => {
        if (selectedDistributionOrderId && distributionOrdersData?.data?.orders) {
            const selectedOrder = distributionOrdersData.data.orders.find(
                (order: any) => order.id === selectedDistributionOrderId
            );

            if (selectedOrder) {
                setValue('locationId', selectedOrder.locationId);
                setValue('totalOrderAmount', selectedOrder.finalAmount || selectedOrder.totalAmount);
            }
        }
    }, [selectedDistributionOrderId, distributionOrdersData, setValue]);

    const createOrderMutation = useMutation({
        mutationFn: (data: CreateTransportOrderData) => {
            const cleanData = { ...data };

            // Remove empty or undefined fields
            if (!cleanData.truckId || cleanData.truckId === '') {
                delete cleanData.truckId;
            }
            if (!cleanData.distributionOrderId || cleanData.distributionOrderId === '') {
                delete cleanData.distributionOrderId;
            }
            if (!cleanData.invoiceNumber || cleanData.invoiceNumber === '') {
                delete cleanData.invoiceNumber;
            }
            if (!cleanData.driverDetails || cleanData.driverDetails === '') {
                delete cleanData.driverDetails;
            }

            console.log('Clean data being sent to API:', cleanData);

            return transportApi.createOrder(cleanData);
        },
        onSuccess: (response) => {
            console.log('Transport order created:', response);
            alert('Transport order created successfully!');
            navigate('/transport/orders');
        },
        onError: (error: any) => {
            console.error('Transport order creation error:', error);
            console.error('Error response:', error.response?.data);

            const errorMessage = error.response?.data?.message || 'Failed to create order';
            const details = error.response?.data?.details;

            if (details && Array.isArray(details)) {
                const detailMessages = details.map((d: any) => {
                    return `Field: ${d.path || d.param || 'unknown'}\nIssue: ${d.msg || d.message}`;
                }).join('\n\n');

                alert(`${errorMessage}\n\n${detailMessages}`);
            } else {
                alert(errorMessage);
            }
        },
    });

    const onSubmit = (data: FormData) => {
        console.log('Form data being submitted:', data);
        console.log('Distribution Order ID:', data.distributionOrderId);
        console.log('Location ID:', data.locationId);
        console.log('Truck ID:', data.truckId);

        createOrderMutation.mutate(data);
    };

    const distributionOrders = (distributionOrdersData?.data?.orders || []).filter(
        (order: any) => order.status === 'CONFIRMED' && !order.transportOrder
    );

    const trucks = trucksData?.data?.trucks || [];

    if (loadingOrders) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/transport/orders')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Transport Order</h1>
                    <p className="text-gray-600 mt-1">Link transport to a confirmed distribution order</p>
                </div>
            </div>

            {distributionOrders.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800">
                        No available distribution orders. All confirmed orders already have transport or there are no confirmed orders.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5" />
                                Order Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Distribution Order *
                                    </label>
                                    <select
                                        {...register('distributionOrderId')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        disabled={distributionOrders.length === 0}
                                    >
                                        <option value="">Select Distribution Order</option>
                                        {distributionOrders.map((order: any) => (
                                            <option key={order.id} value={order.id}>
                                                {order.orderNumber} - {order.customer?.name} ({order.location?.name}) - ₦{(order.finalAmount || order.totalAmount)?.toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.distributionOrderId && (
                                        <p className="text-red-500 text-xs mt-1">{errors.distributionOrderId.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Order Number * <span className="text-xs text-gray-500">(Auto-generated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('orderNumber')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invoice Number * <span className="text-xs text-gray-500">(Auto-generated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('invoiceNumber')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location * <span className="text-xs text-gray-500">(From distribution order)</span>
                                    </label>
                                    <select
                                        {...register('locationId')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        disabled
                                    >
                                        <option value="">Select Location</option>
                                        {locationsData?.data?.locations?.map((location: any) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Truck (Optional)
                                    </label>
                                    <select
                                        {...register('truckId')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="">No truck assigned</option>
                                        {trucks.map((truck: any) => (
                                            <option key={truck.truckId} value={truck.truckId}>
                                                {truck.truckId} - Capacity: {truck.maxPallets} pallets
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Driver Details (Optional)
                                    </label>
                                    <textarea
                                        {...register('driverDetails')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        rows={2}
                                        placeholder="Driver name, contact, vehicle details..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Financial Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Order Amount (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('totalOrderAmount', { valueAsNumber: true })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fuel Required (Liters) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('fuelRequired', { valueAsNumber: true })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="200.00"
                                    />
                                    {errors.fuelRequired && (
                                        <p className="text-red-500 text-xs mt-1">{errors.fuelRequired.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fuel Price/Liter (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('fuelPricePerLiter', { valueAsNumber: true })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="750.00"
                                    />
                                    {errors.fuelPricePerLiter && (
                                        <p className="text-red-500 text-xs mt-1">{errors.fuelPricePerLiter.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/transport/orders')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createOrderMutation.isPending || distributionOrders.length === 0}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {createOrderMutation.isPending ? 'Creating...' : 'Create Transport Order'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Estimation</h3>
                        {calculatedCosts ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-gray-600">Revenue</span>
                                    <span className="font-semibold text-gray-900">
                                        ₦{totalOrderAmount?.toLocaleString() || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-gray-600">Fuel Cost</span>
                                    <span className="font-semibold text-red-600">
                                        -₦{calculatedCosts.totalFuelCost.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="text-sm text-gray-600">Est. Profit</span>
                                    <span className={`font-semibold ${calculatedCosts.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₦{calculatedCosts.estimatedProfit.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-medium text-gray-700">Margin</span>
                                    <span className="text-lg font-bold text-indigo-600">
                                        {calculatedCosts.profitMargin.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Select distribution order and enter fuel details
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};