/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CreateSale.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, ShoppingCart, User, Package, Tag, Plus, Trash2, Edit2 } from 'lucide-react';
import { warehouseService } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { globalToast } from '../../components/ui/Toast';

const productItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitType: z.enum(['PALLETS', 'PACKS', 'UNITS']),
    unitPrice: z.number().min(0.01, 'Unit price must be greater than 0'),
});

const saleSchema = z.object({
    warehouseCustomerId: z.string().min(1, 'Customer is required'),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_MONEY']),
});

type ProductItemFormData = z.infer<typeof productItemSchema>;
type SaleFormData = z.infer<typeof saleSchema>;

interface CartItem extends ProductItemFormData {
    id: string;
    productName: string;
    productNo: string;
    originalUnitPrice: number;
    discountedUnitPrice: number;
    discountAmount: number;
    discountPercentage: number;
    subtotal: number;
    discountTotal: number;
    finalTotal: number;
    hasDiscount: boolean;
    discountInfo?: any;
}

interface DiscountInfo {
    hasDiscount: boolean;
    originalPrice: number;
    finalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    totalSavings?: number;
    discount?: { // ✅ Make entire discount object optional
        minimumQuantity?: number;
        validUntil?: string;
    };
}

export const CreateSale: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
    const [currentDiscountInfo, setCurrentDiscountInfo] = useState<DiscountInfo | null>(null);

    // Product item form
    const {
        register: registerProduct,
        handleSubmit: handleSubmitProduct,
        watch: watchProduct,
        setValue: setValueProduct,
        reset: resetProduct,
        formState: { errors: productErrors }
    } = useForm<ProductItemFormData>({
        resolver: zodResolver(productItemSchema),
        defaultValues: {
            productId: '',
            quantity: 1,
            unitType: 'PACKS',
            unitPrice: 0,
        }
    });

    // Sale form
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<SaleFormData>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            warehouseCustomerId: '',
            paymentMethod: 'CASH',
        }
    });

    // Fetch products
    const { data: products } = useQuery({
        queryKey: ['warehouse-products'],
        queryFn: () => warehouseService.getProducts(),
    });

    // Fetch customers
    const { data: customersData } = useQuery({
        queryKey: ['warehouse-customers'],
        queryFn: () => warehouseService.getCustomers(1, 100),
    });

    // Watch form values
    const watchedCustomerId = watch('warehouseCustomerId');
    const watchedProductId = watchProduct('productId');
    const watchedQuantity = watchProduct('quantity');
    const watchedUnitPrice = watchProduct('unitPrice');

    // Auto-populate unit price when product is selected
    useEffect(() => {
        if (watchedProductId && products) {
            const selectedProduct = products.find((p: any) => p.id === watchedProductId);
            if (selectedProduct && selectedProduct.pricePerPack) {
                setValueProduct('unitPrice', selectedProduct.pricePerPack);
            }
        }
    }, [watchedProductId, products, setValueProduct]);

    // Check discount for current product being added/edited
    useEffect(() => {
        const checkDiscount = async () => {
            if (watchedCustomerId && watchedProductId && watchedQuantity > 0 && watchedUnitPrice > 0) {
                setIsCheckingDiscount(true);
                try {
                    const result = await warehouseService.checkDiscount({
                        warehouseCustomerId: watchedCustomerId,
                        productId: watchedProductId,
                        quantity: watchedQuantity,
                        unitPrice: watchedUnitPrice
                    });

                    console.log('📊 Discount Check Result:', {
                        quantity: watchedQuantity,
                        hasDiscount: result.data?.hasDiscount,
                        minimumRequired: result.data?.discount?.minimumQuantity,
                        discountPercentage: result.data?.discountPercentage,
                        validUntil: result.data?.discount?.validUntil
                    });

                    if (result.data) {
                        setCurrentDiscountInfo(result.data);
                    }
                } catch (error) {
                    console.error('Error checking discount:', error);
                    setCurrentDiscountInfo(null);
                } finally {
                    setIsCheckingDiscount(false);
                }
            } else {
                setCurrentDiscountInfo(null);
            }
        };

        const timeoutId = setTimeout(checkDiscount, 500);
        return () => clearTimeout(timeoutId);
    }, [watchedCustomerId, watchedProductId, watchedQuantity, watchedUnitPrice]);

    // Add or update item in cart
    const handleAddToCart = (data: ProductItemFormData) => {
        const selectedProduct = products?.find((p: any) => p.id === data.productId);
        if (!selectedProduct) return;

        // Check if minimum quantity is met and discount is valid
        const minimumQuantityMet = !currentDiscountInfo?.discount?.minimumQuantity ||
            data.quantity >= currentDiscountInfo.discount.minimumQuantity;
        const isDiscountValid = !currentDiscountInfo?.discount?.validUntil ||
            new Date(currentDiscountInfo.discount.validUntil) >= new Date();

        // ✅ Ensure this is always a boolean
        const shouldApplyDiscount = Boolean(currentDiscountInfo?.hasDiscount && minimumQuantityMet && isDiscountValid);

        const originalUnitPrice = data.unitPrice;
        const discountedUnitPrice = shouldApplyDiscount && currentDiscountInfo ? currentDiscountInfo.finalPrice : data.unitPrice;
        const discountAmount = shouldApplyDiscount && currentDiscountInfo ? currentDiscountInfo.discountAmount : 0;
        const discountPercentage = shouldApplyDiscount && currentDiscountInfo ? currentDiscountInfo.discountPercentage : 0;

        const subtotal = data.quantity * originalUnitPrice;
        const discountTotal = data.quantity * discountAmount;
        const finalTotal = data.quantity * discountedUnitPrice;

        const cartItem: CartItem = {
            id: editingItemId || `item-${Date.now()}`,
            productId: data.productId,
            productName: selectedProduct.name,
            productNo: selectedProduct.productNo,
            quantity: data.quantity,
            unitType: data.unitType,
            unitPrice: data.unitPrice,
            originalUnitPrice,
            discountedUnitPrice,
            discountAmount,
            discountPercentage,
            subtotal,
            discountTotal,
            finalTotal,
            hasDiscount: shouldApplyDiscount, // ✅ Now guaranteed to be boolean
            discountInfo: shouldApplyDiscount && currentDiscountInfo ? currentDiscountInfo.discount : undefined
        };

        if (editingItemId) {
            // Update existing item
            setCart(cart.map(item => item.id === editingItemId ? cartItem : item));
            setEditingItemId(null);
        } else {
            // Add new item
            setCart([...cart, cartItem]);
        }

        // Reset form
        resetProduct({
            productId: '',
            quantity: 1,
            unitType: 'PACKS',
            unitPrice: 0,
        });
        setCurrentDiscountInfo(null);
        globalToast.success(editingItemId ? 'Item updated!' : 'Item added to cart!');
    };

    // Edit cart item
    const handleEditItem = (item: CartItem) => {
        setEditingItemId(item.id);
        setValueProduct('productId', item.productId);
        setValueProduct('quantity', item.quantity);
        setValueProduct('unitType', item.unitType);
        setValueProduct('unitPrice', item.unitPrice);
    };

    // Remove item from cart
    const handleRemoveItem = (itemId: string) => {
        setCart(cart.filter(item => item.id !== itemId));
        globalToast.success('Item removed from cart');
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingItemId(null);
        resetProduct({
            productId: '',
            quantity: 1,
            unitType: 'PACKS',
            unitPrice: 0,
        });
        setCurrentDiscountInfo(null);
    };

    // Calculate cart totals
    const cartTotals = cart.reduce(
        (acc, item) => ({
            subtotal: acc.subtotal + item.subtotal,
            discount: acc.discount + item.discountTotal,
            total: acc.total + item.finalTotal
        }),
        { subtotal: 0, discount: 0, total: 0 }
    );

    // Create sale mutation - Now creates multiple sales with same receipt number
    const createSaleMutation = useMutation({
        mutationFn: async (saleData: SaleFormData) => {
            // Generate a unique receipt number for all items
            const receiptNumber = `WHS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            // Create a sale for each cart item with the same receipt number
            // Find selected customer to get their name
            const selectedCustomer = customersData?.data?.customers?.find(
                (c: any) => c.id === saleData.warehouseCustomerId
            );

            const salePromises = cart.map(item =>
                warehouseService.createSale({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitType: item.unitType,
                    unitPrice: item.unitPrice,
                    paymentMethod: saleData.paymentMethod,
                    warehouseCustomerId: saleData.warehouseCustomerId,
                    customerName: selectedCustomer?.name || 'Unknown Customer',
                    receiptNumber
                })
            );

            // Execute all sales
            return Promise.all(salePromises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-sales'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            globalToast.success(`Sale recorded successfully with ${cart.length} item(s)!`);
            navigate('/warehouse/sales');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to record sale');
        }
    });

    const onSubmit = (data: SaleFormData) => {
        if (cart.length === 0) {
            globalToast.error('Please add at least one product to the cart');
            return;
        }
        createSaleMutation.mutate(data);
    };

    // Check if minimum quantity is met for current item
    const minimumQuantityMet = !currentDiscountInfo?.discount?.minimumQuantity ||
        watchedQuantity >= currentDiscountInfo.discount.minimumQuantity;
    const isDiscountValid = !currentDiscountInfo?.discount?.validUntil ||
        new Date(currentDiscountInfo.discount.validUntil) >= new Date();

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
                            Add products to cart and complete the sale
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Selection */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Customer Information
                        </h3>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer *
                        </label>
                        <select
                            {...register('warehouseCustomerId')}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select a customer</option>
                            {customersData?.data?.customers?.map((customer: any) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.warehouseCustomerId && (
                            <p className="mt-1 text-sm text-red-600">{errors.warehouseCustomerId.message}</p>
                        )}
                    </div>
                </div>

                {/* Add Product to Cart */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Package className="h-5 w-5 mr-2" />
                            {editingItemId ? 'Edit Product' : 'Add Product to Cart'}
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
                                    {...registerProduct('productId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">Select a product</option>
                                    {products?.map((product: any) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - {product.productNo}
                                            {product.pricePerPack && ` (₦${product.pricePerPack.toLocaleString()})`}
                                        </option>
                                    ))}
                                </select>
                                {productErrors.productId && (
                                    <p className="mt-1 text-sm text-red-600">{productErrors.productId.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit Type *
                                </label>
                                <select
                                    {...registerProduct('unitType')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="PALLETS">Pallets</option>
                                    <option value="PACKS">Packs</option>
                                    <option value="UNITS">Units</option>
                                </select>
                                {productErrors.unitType && (
                                    <p className="mt-1 text-sm text-red-600">{productErrors.unitType.message}</p>
                                )}
                            </div>

                            <Input
                                label="Quantity *"
                                type="number"
                                {...registerProduct('quantity', { valueAsNumber: true })}
                                error={productErrors.quantity?.message}
                                placeholder="Enter quantity"
                            />

                            <Input
                                label="Unit Price (₦) *"
                                type="number"
                                step="0.01"
                                {...registerProduct('unitPrice', { valueAsNumber: true })}
                                error={productErrors.unitPrice?.message}
                                placeholder="Auto-filled from product"
                            />
                        </div>

                        {/* Discount Information */}
                        {currentDiscountInfo?.hasDiscount && watchedCustomerId && (
                            <div className={`border rounded-md p-4 ${!minimumQuantityMet || !isDiscountValid
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-green-50 border-green-200'
                                }`}>
                                <div className="flex items-center mb-2">
                                    <Tag className="h-4 w-4 mr-2" />
                                    <span className="text-sm font-medium">
                                        {!minimumQuantityMet || !isDiscountValid ? 'Discount Available (Not Applied)' : 'Discount Will Be Applied'}
                                    </span>
                                </div>

                                {!minimumQuantityMet && currentDiscountInfo.discount?.minimumQuantity && (
                                    <p className="text-xs text-yellow-700 mb-2">
                                        ⚠️ Need {currentDiscountInfo.discount.minimumQuantity} units minimum
                                    </p>
                                )}

                                {!isDiscountValid && currentDiscountInfo.discount?.validUntil && (
                                    <p className="text-xs text-yellow-700 mb-2">
                                        ⚠️ Discount expired on {new Date(currentDiscountInfo.discount.validUntil).toLocaleDateString()}
                                    </p>
                                )}

                                {minimumQuantityMet && isDiscountValid && (
                                    <div className="text-xs space-y-1">
                                        <p>Discount: <strong>{(currentDiscountInfo.discountPercentage ?? 0).toFixed(1)}%</strong></p>
                                        <p>Savings: <strong>₦{((currentDiscountInfo.totalSavings ?? 0) || (watchedQuantity * (currentDiscountInfo.discountAmount ?? 0))).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong></p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Add/Update Button */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={handleSubmitProduct(handleAddToCart)}
                                disabled={isCheckingDiscount || !watchedCustomerId}
                                className="inline-flex items-center"
                            >
                                {editingItemId ? (
                                    <>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Update Item
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add to Cart
                                    </>
                                )}
                            </Button>
                            {editingItemId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Shopping Cart */}
                {cart.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Shopping Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cart.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                                                    <p className="text-xs text-gray-500">{item.productNo}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.quantity} {item.unitType}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.hasDiscount ? (
                                                    <div>
                                                        <p className="text-sm line-through text-gray-400">
                                                            ₦{(item.originalUnitPrice ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-sm font-medium text-green-600">
                                                            ₦{(item.discountedUnitPrice ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-900">
                                                        ₦{(item.unitPrice ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.hasDiscount ? (
                                                    <div>
                                                        <p className="text-xs text-green-600 font-medium">
                                                            -{(item.discountPercentage ?? 0).toFixed(1)}%
                                                        </p>
                                                        <p className="text-xs text-green-600">
                                                            -₦{(item.discountTotal ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No discount</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">
                                                    ₦{(item.finalTotal ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditItem(item)}
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Payment & Summary */}
                {cart.length > 0 && (
                    <>
                        {/* Payment Method */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method *
                                </label>
                                <select
                                    {...register('paymentMethod')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CHECK">Check</option>
                                    <option value="CARD">Card</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                </select>
                                {errors.paymentMethod && (
                                    <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Cart Summary */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">
                                        ₦{cartTotals.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {cartTotals.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600 font-medium">Total Discounts</span>
                                        <span className="font-semibold text-green-600">
                                            -₦{cartTotals.discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-xl font-bold border-t-2 pt-4">
                                    <span>Total Payable</span>
                                    <span className={cartTotals.discount > 0 ? 'text-green-600' : 'text-gray-900'}>
                                        ₦{cartTotals.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {cartTotals.discount > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                                        <p className="text-sm text-green-800">
                                            🎉 <strong>Total Savings: ₦{cartTotals.discount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/warehouse/sales')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || cart.length === 0}
                        className="inline-flex items-center"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Recording Sale...' : `Complete Sale (${cart.length} items)`}
                    </Button>
                </div>
            </form>
        </div>
    );
};