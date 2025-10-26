/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CreateSale.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, ShoppingCart, User, Package, Tag, Plus, Trash2, Edit2, AlertTriangle, CreditCard } from 'lucide-react';
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
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_MONEY', 'CREDIT']),
    // Credit sale fields
    creditDueDate: z.string().optional(),
    creditNotes: z.string().optional(),
    // Partial payment fields
    amountPaid: z.number().optional(),
    initialPaymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_MONEY']).optional(),
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
    const [showPartialPayment, setShowPartialPayment] = useState(false);

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
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<SaleFormData>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            warehouseCustomerId: '',
            paymentMethod: 'CASH',
            creditDueDate: '',
            creditNotes: '',
            amountPaid: 0,
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
    const watchPaymentMethod = watch('paymentMethod');
    const watchAmountPaid = watch('amountPaid');

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

    // Reset partial payment when payment method changes
    useEffect(() => {
        if (watchPaymentMethod !== 'CREDIT') {
            setShowPartialPayment(false);
            setValue('amountPaid', 0);
            setValue('initialPaymentMethod', undefined);
        }
    }, [watchPaymentMethod, setValue]);

    // Calculate days until discount expiry
    const getDaysUntilExpiry = (validUntil?: string): number => {
        if (!validUntil) return 0;
        const today = new Date();
        const expiry = new Date(validUntil);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Add product to cart
    const onAddToCart = (data: ProductItemFormData) => {
        const selectedProduct = products?.find((p: any) => p.id === data.productId);
        if (!selectedProduct) return;

        const originalPrice = currentDiscountInfo?.originalPrice || data.unitPrice;
        const finalPrice = currentDiscountInfo?.finalPrice || data.unitPrice;
        const discountAmount = currentDiscountInfo?.discountAmount || 0;
        const discountPercentage = currentDiscountInfo?.discountPercentage || 0;

        const subtotal = data.quantity * originalPrice;
        const discountTotal = data.quantity * discountAmount;
        const finalTotal = data.quantity * finalPrice;

        const cartItem: CartItem = {
            ...data,
            id: editingItemId || `${Date.now()}-${Math.random()}`,
            productName: selectedProduct.name,
            productNo: selectedProduct.productNo,
            originalUnitPrice: originalPrice,
            discountedUnitPrice: finalPrice,
            discountAmount,
            discountPercentage,
            subtotal,
            discountTotal,
            finalTotal,
            hasDiscount: discountAmount > 0,
            discountInfo: currentDiscountInfo?.hasDiscount ? currentDiscountInfo.discount : undefined
        };

        if (editingItemId) {
            setCart(cart.map(item => item.id === editingItemId ? cartItem : item));
            setEditingItemId(null);
        } else {
            setCart([...cart, cartItem]);
        }

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

    // Create sale mutation
    const createSaleMutation = useMutation({
        mutationFn: async (saleData: SaleFormData) => {
            const receiptNumber = `WHS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            const selectedCustomer = customersData?.data?.customers?.find(
                (c: any) => c.id === saleData.warehouseCustomerId
            );

            const salePromises = cart.map(item => {
                const payload: any = {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitType: item.unitType,
                    unitPrice: item.discountedUnitPrice,
                    paymentMethod: saleData.paymentMethod,
                    warehouseCustomerId: saleData.warehouseCustomerId,
                    customerName: selectedCustomer?.name || '',
                    customerPhone: selectedCustomer?.phone || '',
                    receiptNumber
                };

                // Add credit sale fields
                if (saleData.paymentMethod === 'CREDIT') {
                    payload.creditDueDate = saleData.creditDueDate;
                    payload.creditNotes = saleData.creditNotes;

                    // Add partial payment fields if applicable
                    if (showPartialPayment && saleData.amountPaid && saleData.amountPaid > 0) {
                        payload.amountPaid = saleData.amountPaid;
                        payload.initialPaymentMethod = saleData.initialPaymentMethod;
                    }
                }

                console.log('📤 Sending sale payload:', payload);
                return warehouseService.createSale(payload);
            });

            return Promise.all(salePromises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-sales'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-customers'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-debtors'] });
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

        // Validate credit sale fields
        if (data.paymentMethod === 'CREDIT') {
            if (!data.creditDueDate) {
                globalToast.error('Please specify a due date for credit sale');
                return;
            }

            // Validate partial payment
            if (showPartialPayment) {
                if (!data.amountPaid || data.amountPaid <= 0) {
                    globalToast.error('Please enter a valid partial payment amount');
                    return;
                }

                if (data.amountPaid > cartTotals.total) {
                    globalToast.error('Partial payment cannot exceed total amount');
                    return;
                }

                if (!data.initialPaymentMethod) {
                    globalToast.error('Please select a payment method for partial payment');
                    return;
                }
            }
        }

        createSaleMutation.mutate(data);
    };

    // Check if minimum quantity is met for current item
    const minimumQuantityMet = !currentDiscountInfo?.discount?.minimumQuantity ||
        watchedQuantity >= currentDiscountInfo.discount.minimumQuantity;
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product *
                                </label>
                                <select
                                    {...registerProduct('productId')}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="">Select product</option>
                                    {products?.map((product: any) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} ({product.productNo})
                                        </option>
                                    ))}
                                </select>
                                {productErrors.productId && (
                                    <p className="mt-1 text-sm text-red-600">{productErrors.productId.message}</p>
                                )}
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity *
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    {...registerProduct('quantity', { valueAsNumber: true })}
                                />
                                {productErrors.quantity && (
                                    <p className="mt-1 text-sm text-red-600">{productErrors.quantity.message}</p>
                                )}
                            </div>

                            {/* Unit Type */}
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
                            </div>

                            {/* Unit Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit Price *
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...registerProduct('unitPrice', { valueAsNumber: true })}
                                />
                                {productErrors.unitPrice && (
                                    <p className="mt-1 text-sm text-red-600">{productErrors.unitPrice.message}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-end space-x-2">
                                <Button
                                    type="button"
                                    onClick={handleSubmitProduct(onAddToCart)}
                                    disabled={!watchedCustomerId}
                                    className="flex-1"
                                >
                                    {editingItemId ? <Edit2 className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                                    {editingItemId ? 'Update' : 'Add'}
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

                        {/* Discount Information */}
                        {isCheckingDiscount && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700">Checking for available discounts...</p>
                            </div>
                        )}

                        {currentDiscountInfo?.hasDiscount && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start">
                                    <Tag className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-green-800">
                                            {currentDiscountInfo.discountPercentage.toFixed(1)}% Discount Available!
                                        </h4>
                                        <div className="mt-2 space-y-1 text-sm text-green-700">
                                            <p>
                                                Original Price: <span className="line-through">₦{currentDiscountInfo.originalPrice.toLocaleString()}</span>
                                                {' → '}
                                                <span className="font-semibold">₦{currentDiscountInfo.finalPrice.toLocaleString()}</span>
                                            </p>
                                            <p>
                                                Total Savings: <span className="font-semibold">₦{(currentDiscountInfo.totalSavings || 0).toLocaleString()}</span>
                                            </p>
                                            {currentDiscountInfo.discount?.minimumQuantity && (
                                                <p className="flex items-center">
                                                    {minimumQuantityMet ? '✅' : '⚠️'} Minimum quantity: {currentDiscountInfo.discount.minimumQuantity}
                                                </p>
                                            )}
                                            {daysUntilExpiry !== null && (
                                                <p className={`flex items-center ${daysUntilExpiry < 7 ? 'text-orange-600' : ''}`}>
                                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                                    Expires in {daysUntilExpiry} days
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Display */}
                {cart.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <ShoppingCart className="h-5 w-5 mr-2" />
                                Shopping Cart ({cart.length} items)
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
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                                    <div className="text-sm text-gray-500">{item.productNo}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.quantity} {item.unitType}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.hasDiscount && (
                                                    <span className="line-through text-gray-400 mr-2">
                                                        ₦{item.originalUnitPrice.toLocaleString()}
                                                    </span>
                                                )}
                                                ₦{item.discountedUnitPrice.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.hasDiscount ? (
                                                    <span className="text-sm text-green-600 font-medium">
                                                        -{item.discountPercentage.toFixed(1)}%
                                                        <br />
                                                        <span className="text-xs">(-₦{item.discountTotal.toLocaleString()})</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
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
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                            Subtotal:
                                        </td>
                                        <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">
                                            ₦{cartTotals.subtotal.toLocaleString()}
                                        </td>
                                    </tr>
                                    {cartTotals.discount > 0 && (
                                        <tr className="bg-green-50">
                                            <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-green-700">
                                                Total Discount:
                                            </td>
                                            <td colSpan={2} className="px-6 py-4 text-sm text-green-700">
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
                        <div className="p-6 space-y-4">
                            {/* Payment Method */}
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
                                    <option value="CREDIT">Credit</option>
                                </select>
                                {errors.paymentMethod && (
                                    <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                                )}
                            </div>

                            {/* Credit Sale Fields */}
                            {watchPaymentMethod === 'CREDIT' && (
                                <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center">
                                        <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                                        <h4 className="text-sm font-semibold text-yellow-800">Credit Sale Information</h4>
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Due Date *
                                        </label>
                                        <Input
                                            type="date"
                                            {...register('creditDueDate')}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        {errors.creditDueDate && (
                                            <p className="mt-1 text-sm text-red-600">{errors.creditDueDate.message}</p>
                                        )}
                                    </div>

                                    {/* Credit Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            {...register('creditNotes')}
                                            rows={3}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Any additional notes about this credit sale..."
                                        />
                                    </div>

                                    {/* Partial Payment Option */}
                                    <div className="border-t border-yellow-300 pt-4">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                checked={showPartialPayment}
                                                onChange={(e) => setShowPartialPayment(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm font-medium text-gray-700">
                                                Accept Partial Payment Now
                                            </label>
                                        </div>

                                        {showPartialPayment && (
                                            <div className="space-y-4 pl-6">
                                                {/* Amount Paid */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Amount Paid Now *
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={cartTotals.total}
                                                        {...register('amountPaid', { valueAsNumber: true })}
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Total: ₦{cartTotals.total.toLocaleString()} |
                                                        Remaining: ₦{((cartTotals.total - (watchAmountPaid || 0))).toLocaleString()}
                                                    </p>
                                                    {errors.amountPaid && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.amountPaid.message}</p>
                                                    )}
                                                </div>

                                                {/* Initial Payment Method */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Payment Method for Initial Payment *
                                                    </label>
                                                    <select
                                                        {...register('initialPaymentMethod')}
                                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    >
                                                        <option value="">Select method</option>
                                                        <option value="CASH">Cash</option>
                                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                                        <option value="CHECK">Check</option>
                                                        <option value="CARD">Card</option>
                                                        <option value="MOBILE_MONEY">Mobile Money</option>
                                                    </select>
                                                    {errors.initialPaymentMethod && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.initialPaymentMethod.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/warehouse/sales')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || createSaleMutation.isPending}
                                    loading={isSubmitting || createSaleMutation.isPending}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSubmitting || createSaleMutation.isPending ? 'Recording Sale...' : 'Complete Sale'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};