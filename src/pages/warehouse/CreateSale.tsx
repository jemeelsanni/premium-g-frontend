/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CreateSale.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, ShoppingCart, User, Package } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { globalToast } from '../../components/ui/Toast';

const saleSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
    customerName: z.string().min(1, 'Customer name is required'),
});

type SaleFormData = z.infer<typeof saleSchema>;

export const CreateSale: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<SaleFormData>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            productId: '',
            quantity: 1,
            unitPrice: 0,
            customerName: '',
        }
    });

    // Fetch products for dropdown
    const { data: products } = useQuery({
        queryKey: ['distribution-products'],
        queryFn: () => distributionService.getProducts(),
    });

    // Fetch recent customers for suggestions
    const { data: recentCustomers } = useQuery({
        queryKey: ['warehouse-customers-recent'],
        queryFn: () => warehouseService.getCustomers(1, 10),
    });

    // Watch form values for calculations
    const watchedQuantity = watch('quantity');
    const watchedUnitPrice = watch('unitPrice');
    const totalAmount = (watchedQuantity || 0) * (watchedUnitPrice || 0);

    // Create sale mutation
    const createSaleMutation = useMutation({
        mutationFn: (data: SaleFormData) => warehouseService.createSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-sales'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            globalToast.success('Sale recorded successfully!');
            navigate('/warehouse/sales');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to record sale');
        }
    });

    const onSubmit = (data: SaleFormData) => {
        createSaleMutation.mutate(data);
    };

    // Auto-fill customer name from suggestions
    const handleCustomerSelect = (customerName: string) => {
        setValue('customerName', customerName);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/warehouse/sales')}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            Record New Sale
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Record a new warehouse sale transaction
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Product Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Package className="h-5 w-5 mr-2" />
                            Product Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Product Selection */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product *
                                </label>
                                <select
                                    {...register('productId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">Select a product</option>
                                    {products?.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.productId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.productId.message}</p>
                                )}
                            </div>

                            <Input
                                label="Quantity *"
                                type="number"
                                {...register('quantity', { valueAsNumber: true })}
                                error={errors.quantity?.message}
                                placeholder="Enter quantity"
                            />

                            <Input
                                label="Unit Price (₦) *"
                                type="number"
                                step="0.01"
                                {...register('unitPrice', { valueAsNumber: true })}
                                error={errors.unitPrice?.message}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Sale Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Sale Summary</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-700">Quantity:</span>
                                    <span className="ml-2 font-medium">{watchedQuantity || 0}</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Unit Price:</span>
                                    <span className="ml-2 font-medium">₦{(watchedUnitPrice || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-blue-700">Total Amount:</span>
                                    <span className="ml-2 font-bold text-lg text-blue-900">₦{totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Customer Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <Input
                                label="Customer Name *"
                                {...register('customerName')}
                                error={errors.customerName?.message}
                                placeholder="Enter customer name"
                                list="customers"
                            />

                            {/* Customer suggestions datalist */}
                            <datalist id="customers">
                                {recentCustomers?.data?.map((customer) => (
                                    <option key={customer.id} value={customer.name} />
                                ))}
                            </datalist>
                        </div>

                        {/* Recent Customers Quick Select */}
                        {recentCustomers?.data && recentCustomers.data.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recent Customers
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {recentCustomers.data.slice(0, 6).map((customer) => (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => handleCustomerSelect(customer.name)}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                                        >
                                            {customer.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction Summary */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Transaction Summary
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-medium text-gray-900">Total Amount:</span>
                                <span className="font-bold text-2xl text-green-600">
                                    ₦{totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                {watchedQuantity || 0} × ₦{(watchedUnitPrice || 0).toLocaleString()} per unit
                            </div>
                        </div>

                        {/* Payment Method Note */}
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Payment Processing
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            This transaction will be recorded as a cash sale. Ensure payment has been
                                            received before completing this sale record.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/warehouse/sales')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={isSubmitting || createSaleMutation.isPending}
                        className="inline-flex items-center"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Record Sale
                    </Button>
                </div>
            </form>
        </div>
    );
};