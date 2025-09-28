/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { distributionService, CreateOrderData } from '../../services/distributionService'; // ✅ FIXED IMPORT
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

// ✅ UPDATED SCHEMA to match backend expectations
const orderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    pallets: z.number().min(0, 'Pallets must be non-negative'),
    packs: z.number().min(1, 'Packs must be at least 1'),
    amount: z.number().min(0, 'Amount must be positive'),
});

const orderSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    locationId: z.string().min(1, 'Location is required'),
    orderItems: z.array(orderItemSchema).min(1, 'At least one item is required'),
    remark: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export const CreateOrder: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEditing = Boolean(id);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            customerId: '',
            locationId: '',
            orderItems: [{ productId: '', pallets: 0, packs: 1, amount: 0 }], // ✅ UPDATED
            remark: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'orderItems'
    });

    // ✅ FIXED API CALLS
    const { data: customersData } = useQuery({
        queryKey: ['distribution-customers-all'],
        queryFn: () => distributionService.getCustomers({ limit: 1000 }),
    });

    const { data: products } = useQuery({
        queryKey: ['distribution-products'],
        queryFn: () => distributionService.getProducts(),
    });

    const { data: locations } = useQuery({
        queryKey: ['distribution-locations'],
        queryFn: () => distributionService.getLocations(),
    });

    // Fetch existing order if editing
    const { data: existingOrder, isLoading: loadingOrder } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionService.getOrder(id!),
        enabled: isEditing,
    });

    // ✅ FIXED MUTATIONS
    const createMutation = useMutation({
        mutationFn: (data: CreateOrderData) => distributionService.createOrder(data),
        onSuccess: () => {
            toast.success('Order created successfully!');
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            navigate('/distribution/orders');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create order');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: CreateOrderData) => distributionService.updateOrder(id!, data),
        onSuccess: () => {
            toast.success('Order updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            queryClient.invalidateQueries({ queryKey: ['distribution-order', id] });
            navigate('/distribution/orders');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update order');
        },
    });

    // Load existing order data for editing
    useEffect(() => {
        if (isEditing && existingOrder) {
            setValue('customerId', existingOrder.customerId);
            setValue('locationId', existingOrder.locationId);
            setValue('remark', existingOrder.remark || '');

            // ✅ HANDLE ORDER ITEMS with correct structure
            if (existingOrder.orderItems && existingOrder.orderItems.length > 0) {
                setValue('orderItems', existingOrder.orderItems.map(item => ({
                    productId: item.productId,
                    pallets: item.pallets || 0,
                    packs: item.packs || 1,
                    amount: item.amount || 0,
                })));
            }
        }
    }, [existingOrder, isEditing, setValue]);

    const onSubmit = (data: OrderFormData) => {
        const orderData: CreateOrderData = {
            customerId: data.customerId,
            locationId: data.locationId,
            orderItems: data.orderItems,
            remark: data.remark || undefined,
        };

        if (isEditing) {
            updateMutation.mutate(orderData);
        } else {
            createMutation.mutate(orderData);
        }
    };

    const addOrderItem = () => {
        append({ productId: '', pallets: 0, packs: 1, amount: 0 });
    };

    const removeOrderItem = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    // Calculate totals
    const watchedItems = watch('orderItems');
    const totalAmount = watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPacks = watchedItems.reduce((sum, item) => sum + (item.packs || 0), 0);
    const totalPallets = watchedItems.reduce((sum, item) => sum + (item.pallets || 0), 0);

    if (loadingOrder) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/distribution/orders')}
                            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold leading-7 text-gray-900">
                                {isEditing ? 'Edit Order' : 'Create New Order'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {isEditing ? 'Update order details' : 'Add a new distribution order'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Customer Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Customer *
                            </label>
                            <select
                                {...register('customerId')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Select Customer</option>
                                {customersData?.data?.map((customer: any) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            {errors.customerId && (
                                <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                            )}
                        </div>

                        {/* Location Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Delivery Location *
                            </label>
                            <select
                                {...register('locationId')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Select Location</option>
                                {locations?.map((location: any) => (
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

                    {/* Remark */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Remark
                        </label>
                        <textarea
                            {...register('remark')}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Additional notes or instructions..."
                        />
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addOrderItem}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 gap-4 sm:grid-cols-6 p-4 border border-gray-200 rounded-lg">
                                {/* Product */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Product *
                                    </label>
                                    <select
                                        {...register(`orderItems.${index}.productId`)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Select Product</option>
                                        {products?.map((product: any) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.orderItems?.[index]?.productId && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.orderItems[index]?.productId?.message}
                                        </p>
                                    )}
                                </div>

                                {/* Pallets */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Pallets
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        {...register(`orderItems.${index}.pallets`, { valueAsNumber: true })}
                                        className="mt-1"
                                    />
                                    {errors.orderItems?.[index]?.pallets && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.orderItems[index]?.pallets?.message}
                                        </p>
                                    )}
                                </div>

                                {/* Packs */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Packs *
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        {...register(`orderItems.${index}.packs`, { valueAsNumber: true })}
                                        className="mt-1"
                                    />
                                    {errors.orderItems?.[index]?.packs && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.orderItems[index]?.packs?.message}
                                        </p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Amount (₦) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...register(`orderItems.${index}.amount`, { valueAsNumber: true })}
                                        className="mt-1"
                                    />
                                    {errors.orderItems?.[index]?.amount && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.orderItems[index]?.amount?.message}
                                        </p>
                                    )}
                                </div>

                                {/* Remove Button */}
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeOrderItem(index)}
                                        disabled={fields.length === 1}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-md font-medium text-gray-900 mb-2">Order Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Total Pallets:</span>
                                <span className="ml-2 font-medium">{totalPallets}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Packs:</span>
                                <span className="ml-2 font-medium">{totalPacks}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="ml-2 font-medium">₦{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/distribution/orders')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                {isEditing ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {isEditing ? 'Update Order' : 'Create Order'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};