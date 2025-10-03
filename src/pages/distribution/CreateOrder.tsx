/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    pallets: z.number().min(0, 'Pallets must be non-negative'),
    packs: z.number().min(1, 'Packs must be at least 1'),
    amount: z.number().min(0, 'Amount must be positive'),
});

const orderSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    deliveryLocation: z.string().min(1, 'Delivery location is required'),
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
        formState: { errors }
    } = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            customerId: '',
            deliveryLocation: '',
            orderItems: [{ productId: '', pallets: 0, packs: 1, amount: 0 }],
            remark: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'orderItems'
    });

    // Fetch customers
    const { data: customersResponse, isLoading: loadingCustomers, error: customersError } = useQuery({
        queryKey: ['distribution-customers-all'],
        queryFn: async () => {
            try {
                const response = await distributionService.getCustomers(1, 1000);
                console.log('Customers Response:', response);
                return response;
            } catch (error) {
                console.error('Error fetching customers:', error);
                throw error;
            }
        },
    });

    // Fetch products
    const { data: productsResponse, isLoading: loadingProducts, error: productsError } = useQuery({
        queryKey: ['distribution-products'],
        queryFn: async () => {
            try {
                const response = await distributionService.getProducts();
                console.log('Products Response:', response);
                return response;
            } catch (error) {
                console.error('Error fetching products:', error);
                throw error;
            }
        },
    });

    // Fetch locations for reference (optional - for location suggestions)
    const { data: locationsResponse } = useQuery({
        queryKey: ['distribution-locations'],
        queryFn: async () => {
            try {
                const response = await distributionService.getLocations();
                console.log('Locations Response:', response);
                return response;
            } catch (error) {
                console.error('Error fetching locations:', error);
                return null;
            }
        },
    });

    // Fetch existing order if editing
    const { data: existingOrder, isLoading: loadingOrder } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionService.getOrder(id!),
        enabled: isEditing,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => {
            console.log('Sending to API:', data);
            return distributionService.createOrder(data);
        },
        onSuccess: (response) => {
            console.log('Order created successfully:', response);
            toast.success('Order created successfully!');
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            navigate('/distribution/orders');
        },
        onError: (error: any) => {
            console.error('Create order error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message
                || error.response?.data?.error
                || error.message
                || 'Failed to create order';
            toast.error(errorMessage);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => distributionService.updateOrder(id!, data),
        onSuccess: () => {
            toast.success('Order updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            queryClient.invalidateQueries({ queryKey: ['distribution-order', id] });
            navigate('/distribution/orders');
        },
        onError: (error: any) => {
            console.error('Update order error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update order';
            toast.error(errorMessage);
        },
    });

    // Load existing order data for editing
    useEffect(() => {
        if (isEditing && existingOrder) {
            const order = (existingOrder as any).data?.order || (existingOrder as any).data || existingOrder;

            setValue('customerId', order.customerId);
            setValue('deliveryLocation', order.deliveryLocation || '');
            setValue('remark', order.remark || '');

            if (order.orderItems && order.orderItems.length > 0) {
                setValue('orderItems', order.orderItems.map((item: any) => ({
                    productId: item.productId,
                    pallets: item.pallets || 0,
                    packs: item.packs || 1,
                    amount: item.amount || 0,
                })));
            }
        }
    }, [existingOrder, isEditing, setValue]);


    const onSubmit = (data: OrderFormData) => {
        // Format the data exactly as the backend expects
        const orderData = {
            customerId: data.customerId,
            deliveryLocation: data.deliveryLocation.trim(), // Backend will find/create location
            orderItems: data.orderItems.map(item => ({
                productId: item.productId,
                pallets: Number(item.pallets) || 0,
                packs: Number(item.packs) || 0,
                amount: Number(item.amount) || 0
            })),
            remark: data.remark?.trim() || ''
        };

        console.log('📤 Submitting order data:', JSON.stringify(orderData, null, 2));

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
        } else {
            toast.error('Order must have at least one item');
        }
    };

    // Calculate totals
    const watchedItems = watch('orderItems');
    const totalAmount = watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalPacks = watchedItems.reduce((sum, item) => sum + (Number(item.packs) || 0), 0);
    const totalPallets = watchedItems.reduce((sum, item) => sum + (Number(item.pallets) || 0), 0);

    // Extract data from nested API responses
    let customers: any[] = [];
    let products: any[] = [];
    let locations: any[] = [];

    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            // Only trigger on productId or pallets changes
            if (!name || (!name.includes('.productId') && !name.includes('.pallets'))) {
                return;
            }

            // Extract the index from the field name (e.g., "orderItems.0.productId" -> 0)
            const match = name.match(/orderItems\.(\d+)\./);
            if (!match) return;

            const index = parseInt(match[1]);
            const item = value.orderItems?.[index];

            if (!item?.productId) return;

            // Find the selected product
            const selectedProduct = products?.find((p: any) => p.id === item.productId);
            if (!selectedProduct) return;

            const pallets = Number(item.pallets) || 0;
            const packsPerPallet = Number(selectedProduct.packsPerPallet) || 0;
            const pricePerPack = parseFloat(selectedProduct.costPerPack || 0);

            // Validate maximum pallets
            if (pallets > 12) {
                setValue(`orderItems.${index}.pallets`, 12, { shouldValidate: false });
                toast.error('Maximum 12 pallets allowed per product');
                return;
            }

            // Calculate total packs
            const calculatedPacks = pallets * packsPerPallet;

            // Calculate amount
            const calculatedAmount = calculatedPacks * pricePerPack;

            // Get current values
            const currentPacks = Number(item.packs) || 0;
            const currentAmount = Number(item.amount) || 0;

            // Only update if different (prevents infinite loop)
            if (calculatedPacks !== currentPacks) {
                setValue(`orderItems.${index}.packs`, calculatedPacks, { shouldValidate: false });
            }

            if (Math.abs(calculatedAmount - currentAmount) > 0.01) {
                setValue(`orderItems.${index}.amount`, parseFloat(calculatedAmount.toFixed(2)), { shouldValidate: false });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, products, setValue]);


    if (customersResponse) {
        if ((customersResponse as any).data?.customers) {
            customers = (customersResponse as any).data.customers;
        } else if ((customersResponse as any).customers) {
            customers = (customersResponse as any).customers;
        } else if (Array.isArray((customersResponse as any).data)) {
            customers = (customersResponse as any).data;
        } else if (Array.isArray(customersResponse)) {
            customers = customersResponse;
        }
    }

    if (productsResponse) {
        if ((productsResponse as any).data?.products) {
            products = (productsResponse as any).data.products;
        } else if ((productsResponse as any).products) {
            products = (productsResponse as any).products;
        } else if (Array.isArray((productsResponse as any).data)) {
            products = (productsResponse as any).data;
        } else if (Array.isArray(productsResponse)) {
            products = productsResponse;
        }
    }

    if (locationsResponse) {
        if ((locationsResponse as any).data?.locations) {
            locations = (locationsResponse as any).data.locations;
        } else if ((locationsResponse as any).locations) {
            locations = (locationsResponse as any).locations;
        } else if (Array.isArray(locationsResponse)) {
            locations = locationsResponse;
        }
    }

    console.log('Extracted customers:', customers.length);
    console.log('Extracted products:', products.length);
    console.log('Extracted locations:', locations.length);

    if (loadingOrder) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (customersError || productsError) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
                    {customersError && <p className="text-red-600 text-sm">Failed to load customers</p>}
                    {productsError && <p className="text-red-600 text-sm">Failed to load products</p>}
                    <Button onClick={() => navigate('/distribution/orders')} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
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
                            type="button"
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

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs">
                    <p className="font-semibold text-blue-800 mb-2">📊 Debug Info:</p>
                    <p className="text-blue-600">✓ Customers: {customers.length}</p>
                    <p className="text-blue-600">✓ Products: {products.length}</p>
                    <p className="text-blue-600">✓ Locations (optional): {locations.length}</p>
                    {customers.length === 0 && <p className="text-red-600 mt-2">⚠️ No customers found</p>}
                    {products.length === 0 && <p className="text-red-600 mt-2">⚠️ No products found</p>}
                </div>
            )}

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
                            {loadingCustomers ? (
                                <div className="mt-1 p-2 text-sm text-gray-500">Loading customers...</div>
                            ) : (
                                <>
                                    <select
                                        {...register('customerId')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        disabled={customers.length === 0}
                                    >
                                        <option value="">
                                            {customers.length === 0 ? 'No customers available' : 'Select Customer'}
                                        </option>
                                        {customers.map((customer: any) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                    {customers.length === 0 && (
                                        <p className="mt-1 text-xs text-orange-600">
                                            No customers found. Please create customers first.
                                        </p>
                                    )}
                                </>
                            )}
                            {errors.customerId && (
                                <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                            )}
                        </div>

                        {/* Delivery Location - Text Input with Suggestions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Delivery Location *
                            </label>
                            <Input
                                type="text"
                                {...register('deliveryLocation')}
                                placeholder="Enter delivery location"
                                className="mt-1"
                                list="locations-datalist"
                            />
                            {/* Optional: Provide suggestions from locations table */}
                            {locations.length > 0 && (
                                <datalist id="locations-datalist">
                                    {locations.map((location: any) => (
                                        <option key={location.id} value={location.name} />
                                    ))}
                                </datalist>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Type the delivery location address
                            </p>
                            {errors.deliveryLocation && (
                                <p className="mt-1 text-sm text-red-600">{errors.deliveryLocation.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Remarks (Optional)
                        </label>
                        <textarea
                            {...register('remark')}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Add any special instructions or notes"
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
                            disabled={products.length === 0}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    {products.length === 0 && (
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                                ⚠️ No products available. Please add products to the system first.
                            </p>
                        </div>
                    )}

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
                                        disabled={products.length === 0}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((product: any) => (
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
                                        Pallets (Max: 12) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="12"
                                        {...register(`orderItems.${index}.pallets`, {
                                            valueAsNumber: true
                                        })}
                                        className="mt-1"
                                        placeholder="0-12"
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (val > 12) {
                                                setValue(`orderItems.${index}.pallets`, 12);
                                                toast.error('Maximum 12 pallets allowed');
                                            }
                                        }}
                                    />
                                </div>

                                {/* Packs - Read-only */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Total Packs
                                    </label>
                                    <Input
                                        type="number"
                                        {...register(`orderItems.${index}.packs`)}
                                        className="mt-1 bg-gray-100"
                                        readOnly
                                        tabIndex={-1}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Auto-calculated
                                    </p>
                                </div>

                                {/* Amount - Read-only with formatted display */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Amount (₦)
                                    </label>
                                    <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm">
                                        ₦{(Number(watchedItems[index]?.amount) || 0).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </div>
                                    <input
                                        type="hidden"
                                        {...register(`orderItems.${index}.amount`)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Auto-calculated
                                    </p>
                                </div>

                                {/* Remove Button */}
                                <div className="flex items-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => removeOrderItem(index)}
                                        disabled={fields.length === 1}
                                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Pallets:</span>
                            <span className="font-medium">{totalPallets}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Packs:</span>
                            <span className="font-medium">{totalPacks}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t">
                            <span>Total Amount:</span>
                            <span>₦{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
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
                        disabled={
                            createMutation.isPending ||
                            updateMutation.isPending ||
                            products.length === 0 ||
                            customers.length === 0
                        }
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {createMutation.isPending || updateMutation.isPending
                            ? 'Saving...'
                            : isEditing
                                ? 'Update Order'
                                : 'Create Order'}
                    </Button>
                </div>
            </form>
        </div>
    );
};