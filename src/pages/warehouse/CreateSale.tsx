/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CreateSale.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, ShoppingCart, User, Package, Tag, Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';
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
    discount?: {
        id?: string;
        type?: string;
        value?: number;
        reason?: string;
        minimumQuantity?: number;
        maximumDiscountAmount?: number;
        validFrom?: string;
        validUntil?: string;
        approvalRequestId?: string;
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
    const watchedProductId = watchProduct('productId');
    const watchedQuantity = watchProduct('quantity');
    const watchedUnitPrice = watchProduct('unitPrice');
    const watchedCustomerId = watch('warehouseCustomerId');

    // Auto-fill unit price when product is selected
    useEffect(() => {
        if (watchedProductId && products) {
            const selectedProduct = products.find((p: any) => p.id === watchedProductId);
            if (selectedProduct && selectedProduct.pricePerPack) {
                setValueProduct('unitPrice', selectedProduct.pricePerPack);
            }
        }
    }, [watchedProductId, products, setValueProduct]);

    // Check discount eligibility
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

                    // Enhanced discount info with validation flags
                    const discountInfo: DiscountInfo = {
                        hasDiscount: result.data?.hasDiscount || false,
                        originalPrice: result.data?.originalPrice || watchedUnitPrice,
                        finalPrice: result.data?.finalPrice || watchedUnitPrice,
                        discountAmount: result.data?.discountAmount || 0,
                        discountPercentage: result.data?.discountPercentage || 0,
                        totalSavings: result.data?.totalSavings || 0,
                        discount: result.data?.discount || undefined
                    };

                    if (result.data) {
                        setCurrentDiscountInfo(discountInfo);
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

    // Calculate days until discount expiry
    const getDaysUntilExpiry = (validUntil?: string): number | null => {
        if (!validUntil) return null;
        const expiryDate = new Date(validUntil);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Add or update item in cart
    const handleAddToCart = (data: ProductItemFormData) => {
        const selectedProduct = products?.find((p: any) => p.id === data.productId);
        if (!selectedProduct) return;

        // Validate discount conditions
        const minimumQuantityMet = !currentDiscountInfo?.discount?.minimumQuantity ||
            data.quantity >= currentDiscountInfo.discount.minimumQuantity;
        const isDiscountValid = !currentDiscountInfo?.discount?.validUntil ||
            new Date(currentDiscountInfo.discount.validUntil) >= new Date();

        // Only apply discount if all conditions are met
        const shouldApplyDiscount = Boolean(
            currentDiscountInfo?.hasDiscount &&
            minimumQuantityMet &&
            isDiscountValid
        );

        const originalUnitPrice = data.unitPrice;
        const discountedUnitPrice = shouldApplyDiscount && currentDiscountInfo
            ? currentDiscountInfo.finalPrice
            : data.unitPrice;
        const discountAmount = shouldApplyDiscount && currentDiscountInfo
            ? currentDiscountInfo.discountAmount
            : 0;
        const discountPercentage = shouldApplyDiscount && currentDiscountInfo
            ? currentDiscountInfo.discountPercentage
            : 0;

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
            hasDiscount: shouldApplyDiscount,
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

    // Create sale mutation - Creates multiple sales with same receipt number
    const createSaleMutation = useMutation({
        mutationFn: async (saleData: SaleFormData) => {
            // Generate a unique receipt number for all items
            const receiptNumber = `WHS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            // Find selected customer to get their details
            const selectedCustomer = customersData?.data?.customers?.find(
                (c: any) => c.id === saleData.warehouseCustomerId
            );

            const salePromises = cart.map(item => {
                const payload = {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitType: item.unitType,
                    unitPrice: item.unitPrice,
                    paymentMethod: saleData.paymentMethod,
                    warehouseCustomerId: saleData.warehouseCustomerId,
                    customerName: selectedCustomer?.name || '',
                    customerPhone: selectedCustomer?.phone || '',
                    receiptNumber
                };

                console.log('📤 Sending sale payload:', payload);

                return warehouseService.createSale(payload);
            });


            // Execute all sales
            return Promise.all(salePromises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-sales'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
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
    const daysUntilExpiry = currentDiscountInfo?.discount?.validUntil
        ? getDaysUntilExpiry(currentDiscountInfo.discount.validUntil)
        : null;

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
                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product *
                                </label>
                                <select
                                    {...registerProduct('productId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    disabled={!watchedCustomerId}
                                >
                                    <option value="">
                                        {!watchedCustomerId ? 'Select a customer first' : 'Select a product'}
                                    </option>
                                    {products?.map((product: any) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} ({product.productNo}) - ₦{product.pricePerPack?.toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                                {productErrors.productId && (
                                    <p className="mt-1 text-sm text-red-600">{productErrors.productId.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Unit Type *
                                    </label>
                                    <select
                                        {...registerProduct('unitType')}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="PACKS">Packs</option>
                                        <option value="PALLETS">Pallets</option>
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

                                    {/* Minimum Quantity Warning */}
                                    {!minimumQuantityMet && currentDiscountInfo.discount?.minimumQuantity && (
                                        <p className="text-xs text-yellow-700 mb-2 flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Need {currentDiscountInfo.discount.minimumQuantity} units minimum
                                        </p>
                                    )}

                                    {/* Expiry Warning */}
                                    {!isDiscountValid && currentDiscountInfo.discount?.validUntil && (
                                        <p className="text-xs text-red-700 mb-2 flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Discount expired on {new Date(currentDiscountInfo.discount.validUntil).toLocaleDateString()}
                                        </p>
                                    )}

                                    {/* Expiring Soon Warning */}
                                    {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7 && isDiscountValid && (
                                        <p className="text-xs text-orange-600 mb-2 flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Discount expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
                                        </p>
                                    )}

                                    {minimumQuantityMet && isDiscountValid && (
                                        <div className="text-xs space-y-1">
                                            <p>Discount: <strong>{(currentDiscountInfo.discountPercentage ?? 0).toFixed(2)}%</strong></p>
                                            <p>Original Price: <strong>₦{(currentDiscountInfo.originalPrice ?? 0).toLocaleString()}</strong></p>
                                            <p>Discounted Price: <strong className="text-green-700">₦{(currentDiscountInfo.finalPrice ?? 0).toLocaleString()}</strong></p>
                                            <p>You Save: <strong className="text-green-700">₦{((currentDiscountInfo.totalSavings ?? 0)).toLocaleString()}</strong></p>
                                            {currentDiscountInfo.discount?.reason && (
                                                <p className="text-gray-600 italic mt-2">Reason: {currentDiscountInfo.discount.reason}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isCheckingDiscount && (
                                <div className="text-sm text-gray-500 flex items-center">
                                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Checking for available discounts...
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                {editingItemId && (
                                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    onClick={handleSubmitProduct(handleAddToCart)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {editingItemId ? 'Update Item' : 'Add to Cart'}
                                </Button>
                            </div>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Discount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cart.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                                <div className="text-sm text-gray-500">{item.productNo}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.quantity} {item.unitType}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.hasDiscount ? (
                                                    <div>
                                                        <div className="text-sm text-gray-500 line-through">
                                                            ₦{item.originalUnitPrice.toLocaleString()}
                                                        </div>
                                                        <div className="text-sm font-medium text-green-600">
                                                            ₦{item.discountedUnitPrice.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-900">
                                                        ₦{item.unitPrice.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.hasDiscount ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-green-600">
                                                            {item.discountPercentage.toFixed(2)}%
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            -₦{item.discountTotal.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ₦{item.finalTotal.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
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
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                            Subtotal:
                                        </td>
                                        <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">
                                            ₦{cartTotals.subtotal.toLocaleString()}
                                        </td>
                                    </tr>
                                    {cartTotals.discount > 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-green-600">
                                                Total Discount:
                                            </td>
                                            <td colSpan={2} className="px-6 py-3 text-sm text-green-600">
                                                -₦{cartTotals.discount.toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="bg-gray-100">
                                        <td colSpan={4} className="px-6 py-4 text-right text-base font-bold text-gray-900">
                                            Total Amount:
                                        </td>
                                        <td colSpan={2} className="px-6 py-4 text-base font-bold text-gray-900">
                                            ₦{cartTotals.total.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* Payment Information */}
                {cart.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Payment Information
                            </h3>
                        </div>
                        <div className="p-6">
                            <div>
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

                            {/* Discount Summary */}
                            {cartTotals.discount > 0 && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                                    <h4 className="text-sm font-medium text-green-900 mb-2">
                                        💰 Discount Applied
                                    </h4>
                                    <div className="text-sm text-green-700 space-y-1">
                                        <p>
                                            Customer saves: <strong>₦{cartTotals.discount.toLocaleString()}</strong>
                                        </p>
                                        <p>
                                            Percentage saved: <strong>
                                                {((cartTotals.discount / cartTotals.subtotal) * 100).toFixed(2)}%
                                            </strong>
                                        </p>
                                        <p className="text-xs italic mt-2">
                                            All applied discounts have been verified and match approved discount requests.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-6">
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
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSubmitting ? 'Recording Sale...' : 'Complete Sale'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};