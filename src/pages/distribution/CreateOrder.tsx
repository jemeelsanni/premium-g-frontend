/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/CreateOrder.tsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

const orderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const orderSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    locationId: z.string().min(1, 'Location is required'),
    orderItems: z.array(orderItemSchema).min(1, 'At least one item is required'),
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
            orderItems: [{ productId: '', quantity: 1, unitPrice: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'orderItems'
    });

    // Fetch data for dropdowns
    const { data: customers } = useQuery({
        queryKey: ['distribution-customers-all'],
        queryFn: () => distributionService.getCustomers(1, 1000),
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

    // Set form values when editing
    useEffect(() => {
        if (existingOrder && isEditing) {
            setValue('customerId', existingOrder.customerId);
            setValue('locationId', existingOrder.locationId);
            if (existingOrder.orderItems) {
                setValue('orderItems', existingOrder.orderItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })));
            }
        }
    }, [existingOrder, isEditing, setValue]);

    // Create/Update mutations
    const createMutation = useMutation({
        mutationFn: (data: OrderFormData) => distributionService.createOrder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Order created successfully!');
            navigate('/distribution/orders');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create order');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: OrderFormData) => distributionService.updateOrder(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            queryClient.invalidateQueries({ queryKey: ['distribution-order', id] });
            toast.success('Order updated successfully!');
            navigate('/distribution/orders');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update order');
        }
    });

    const onSubmit = (data: OrderFormData) => {
        if (isEditing) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const watchedItems = watch('orderItems');
    const totalAmount = watchedItems.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
    );

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
                        onClick={() => navigate('/distribution/orders')}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            {isEditing ? 'Edit Order' : 'Create New Order'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {isEditing ? 'Update order details and items' : 'Fill in the details to create a new distribution order'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Customer Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer *
                                </label>
                                <select
                                    {...register('customerId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">Select a customer</option>
                                    {customers?.data?.map((customer) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name} - {customer.territory}
                                        </option>
                                    ))}
                                </select>
                                {errors.customerId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                                )}
                            </div>

                            {/* Location Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Location *
                                </label>
                                <select
                                    {...register('locationId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">Select a location</option>
                                    {locations?.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name} - {location.address}
                                        </option>
                                    ))}
                                </select>
                                {errors.locationId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.locationId.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                                className="inline-flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
                                    {/* Product */}
                                    <div className="col-span-5">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Product
                                        </label>
                                        <select
                                            {...register(`orderItems.${index}.productId`)}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="">Select product</option>
                                            {products?.map((product) => (
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

                                    {/* Quantity */}
                                    <div className="col-span-2">
                                        <Input
                                            label="Quantity"
                                            type="number"
                                            {...register(`orderItems.${index}.quantity`, { valueAsNumber: true })}
                                            error={errors.orderItems?.[index]?.quantity?.message}
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="col-span-3">
                                        <Input
                                            label="Unit Price (₦)"
                                            type="number"
                                            step="0.01"
                                            {...register(`orderItems.${index}.unitPrice`, { valueAsNumber: true })}
                                            error={errors.orderItems?.[index]?.unitPrice?.message}
                                        />
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Total
                                        </label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                                            ₦{((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                            className="p-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {errors.orderItems && (
                            <p className="mt-4 text-sm text-red-600">
                                {errors.orderItems.message}
                            </p>
                        )}

                        {/* Order Summary */}
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                                <span className="text-xl font-bold text-blue-600">
                                    ₦{totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
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
                        loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        className="inline-flex items-center"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? 'Update Order' : 'Create Order'}
                    </Button>
                </div>
            </form>
        </div>
    );
};