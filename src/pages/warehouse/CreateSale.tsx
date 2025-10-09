/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/warehouse/CreateSale.tsx
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Save,
    ArrowLeft,
    ShoppingCart,
    User,
    Package,
    Plus,
    Trash2,
    Calculator,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';

import { warehouseService, CreateSaleResponse } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { globalToast } from '../../components/ui/Toast';
import { Product } from '../../types/warehouse';

type WarehousePaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD' | 'MOBILE_MONEY';

type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BULK_DISCOUNT';

const DEFAULT_DISCOUNT_PERCENT = 5;
const generateReceiptNumber = () => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomSegment = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `WHS-${dateStr}-${randomSegment}`;
};

const DEFAULT_DISCOUNT_VALIDITY_DAYS = 7;

const paymentMethodOptions = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHECK', label: 'Cheque' },
    { value: 'CARD', label: 'Card' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' }
] as const;

const saleItemSchema = z
    .object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Unit price cannot be negative'),
        unitType: z.enum(['PALLETS', 'PACKS', 'UNITS']),
        applyDiscount: z.boolean(),
        requestDiscountApproval: z.boolean(),
        requestedDiscountPercent: z
            .number()
            .min(0, 'Discount percentage cannot be negative')
            .max(50, 'Discount percentage cannot exceed 50')
            .optional(),
        discountReason: z.string().optional()
    })
    .refine(
        (item) => {
            if (!item.requestDiscountApproval) {
                return true;
            }
            return Boolean(item.discountReason && item.discountReason.trim().length > 0);
        },
        {
            message: 'Discount reason is required when requesting approval',
            path: ['discountReason']
        }
    )
    .refine(
        (item) => {
            if (!item.requestDiscountApproval) {
                return true;
            }
            return item.requestedDiscountPercent !== undefined && item.requestedDiscountPercent > 0;
        },
        {
            message: 'Provide the discount percentage you are requesting',
            path: ['requestedDiscountPercent']
        }
    );

const saleSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    paymentMethod: z.enum(paymentMethodOptions.map((method) => method.value) as [string, ...string[]]),
    items: z.array(saleItemSchema).min(1, 'Add at least one product to proceed')
});

type SaleFormData = z.infer<typeof saleSchema>;

export const CreateSale: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        control,
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<SaleFormData>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            customerId: '',
            customerName: '',
            customerPhone: '',
            paymentMethod: 'CASH',
            items: [
                {
                    productId: '',
                    quantity: 1,
                    unitPrice: 0,
                    unitType: 'PACKS' as const,
                    applyDiscount: false,
                    requestDiscountApproval: false,
                    requestedDiscountPercent: DEFAULT_DISCOUNT_PERCENT,
                    discountReason: ''
                }
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });

    const { data: productsData } = useQuery<{ data: { products: Product[] } }>({
        queryKey: ['warehouse-products'],
        queryFn: () => warehouseService.getProducts(),
        select: (data) => ({ data: { products: data?.data?.products || [] } })
    });
    const products = useMemo(() => productsData?.data.products ?? [], [productsData]);
    const productIndex = useMemo(() => {
        const map = new Map<string, Product>();
        products.forEach((product) => map.set(product.id, product));
        return map;
    }, [products]);

    const { data: customersQuery } = useQuery({
        queryKey: ['warehouse-customers-select'],
        queryFn: () => warehouseService.getCustomers(1, 100),
        select: (response) => response.data.customers || []
    });

    const watchedItems = useWatch({ control, name: 'items' });
    const watchedCustomerPhone = watch('customerPhone');
    const selectedCustomerId = watch('customerId');

    type SessionDiscountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
    const [sessionDiscountRequests, setSessionDiscountRequests] = useState<Map<string, { requestId: string; status: SessionDiscountStatus }>>(() => new Map());

    useEffect(() => {
        setSessionDiscountRequests(new Map());
    }, [selectedCustomerId]);

    const pendingDiscountItems = useMemo(
        () => (watchedItems || []).filter((item) => item.requestDiscountApproval),
        [watchedItems]
    );
    const saleHasPendingDiscount = pendingDiscountItems.length > 0;

    const {
        data: pendingDiscountRequests,
        refetch: refetchPendingDiscounts
    } = useQuery({
        queryKey: ['warehouse-discount-requests', 'pending', selectedCustomerId],
        queryFn: () => warehouseService.getDiscountRequests(1, 100, 'PENDING'),
        select: (response) => response?.data?.requests || [],
        enabled: Boolean(selectedCustomerId),
        refetchInterval: saleHasPendingDiscount ? 5000 : false
    });

    const {
        data: approvedDiscountRequests,
        refetch: refetchApprovedDiscounts
    } = useQuery({
        queryKey: ['warehouse-discount-requests', 'approved', selectedCustomerId],
        queryFn: () => warehouseService.getDiscountRequests(1, 100, 'APPROVED'),
        select: (response) => response?.data?.requests || [],
        enabled: Boolean(selectedCustomerId),
        refetchInterval: saleHasPendingDiscount ? 5000 : false
    });

    const pendingRequestsForCustomer = useMemo(
        () => (pendingDiscountRequests || []).filter((request: any) => request.warehouseCustomerId === selectedCustomerId),
        [pendingDiscountRequests, selectedCustomerId]
    );

    const approvedRequestsForCustomer = useMemo(
        () =>
            (approvedDiscountRequests || [])
                .filter(
                    (request: any) =>
                        request.warehouseCustomerId === selectedCustomerId &&
                        request.status === 'APPROVED'
                ),
        [approvedDiscountRequests, selectedCustomerId]
    );


    const approvedDiscountMap = useMemo(() => {
        const map = new Map<string, any>();
        approvedRequestsForCustomer.forEach((request: any) => {
            if (request.productId) {
                map.set(request.productId, request);
            }
        });
        return map;
    }, [approvedRequestsForCustomer]);

    useEffect(() => {
        setSessionDiscountRequests((prev) => {
            if (!selectedCustomerId) {
                return prev;
            }

            const next = new Map(prev);
            let changed = false;

            pendingRequestsForCustomer.forEach((request: any) => {
                if (!request.productId) return;
                const existing = next.get(request.productId);
                if (!existing || existing.status !== 'PENDING' || existing.requestId !== request.id) {
                    next.set(request.productId, { requestId: request.id, status: 'PENDING' });
                    changed = true;
                }
            });

            approvedRequestsForCustomer.forEach((request: any) => {
                if (!request.productId) return;
                const existing = next.get(request.productId);
                if (!existing || existing.status !== 'APPROVED' || existing.requestId !== request.id) {
                    next.set(request.productId, { requestId: request.id, status: 'APPROVED' });
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [pendingRequestsForCustomer, approvedRequestsForCustomer, selectedCustomerId]);

    const getRequestStatus = useCallback((productId?: string): SessionDiscountStatus | undefined => {
        if (!productId) return undefined;
        const session = sessionDiscountRequests.get(productId);
        if (session) return session.status;
        const approvedRequest = approvedRequestsForCustomer.find(
            (req: any) => req.productId === productId && req.status === 'APPROVED'
        );
        if (approvedRequest) {
            return 'APPROVED';
        }
        if (pendingRequestsForCustomer.some((request: any) => request.productId === productId)) {
            return 'PENDING';
        }
        return undefined;
    }, [sessionDiscountRequests, approvedDiscountMap, pendingRequestsForCustomer]);

    const awaitingApprovalItems = pendingDiscountItems.filter((item) => {
        if (!item?.productId) return false;
        return getRequestStatus(item.productId) === 'PENDING';
    });

    const awaitingApproval = awaitingApprovalItems.length > 0;
    const hasApprovedDiscount = (watchedItems || []).some((item) => getRequestStatus(item?.productId) === 'APPROVED');

    const awaitingCustomerSelection = useMemo(
        () => !selectedCustomerId && pendingDiscountItems.length > 0,
        [selectedCustomerId, pendingDiscountItems.length]
    );

    const hasRequestableLines = pendingDiscountItems.some((item) => {
        if (!item?.productId) {
            return true;
        }
        const status = getRequestStatus(item.productId);
        return !status || status === 'REJECTED';
    });

    const selectedCustomer = useMemo(() => (
        customersQuery?.find((customer: any) => customer.id === selectedCustomerId)
    ), [customersQuery, selectedCustomerId]);

    useEffect(() => {
        if (selectedCustomer) {
            setValue('customerName', selectedCustomer.name, { shouldDirty: true });
            if (selectedCustomer.phone && !watchedCustomerPhone) {
                setValue('customerPhone', selectedCustomer.phone, { shouldDirty: true });
            }
        } else {
            setValue('customerName', '', { shouldDirty: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomer]);

    useEffect(() => {
        if (!selectedCustomerId) return;

        (watchedItems || []).forEach((item) => {
            const productId = item?.productId;
            if (!productId) return;

            const approved = approvedDiscountMap.get(productId);
            if (approved && approved.status === 'APPROVED') {
                return 'APPROVED';
            }

            // ❌ Remove any automatic toggling of applyDiscount or requestDiscountApproval here
        });
    }, [approvedDiscountMap, watchedItems, selectedCustomerId, setValue]);


    useEffect(() => {
        if (selectedCustomerId) {
            refetchApprovedDiscounts();
        }
    }, [pendingRequestsForCustomer.length, selectedCustomerId, refetchApprovedDiscounts]);

    const lineCalculations = useMemo(() => {
        return (watchedItems || []).map((item) => {
            const quantity = Number(item?.quantity || 0);
            const unitPrice = Number(item?.unitPrice || 0);

            if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
                return {
                    rawTotal: 0,
                    discountPercent: 0,
                    discountAmount: 0,
                    netTotal: 0
                };
            }

            const rawTotal = quantity * unitPrice;
            const productId = item?.productId;
            const approvedRequest = productId ? approvedDiscountMap.get(productId) : undefined;
            const shouldApplyApprovedDiscount = Boolean(item?.applyDiscount && approvedRequest);

            const discountPercent = shouldApplyApprovedDiscount
                ? Number(approvedRequest?.requestedDiscountValue || 0)
                : 0;

            const discountAmount = rawTotal * (discountPercent / 100);
            const netTotal = rawTotal - discountAmount;

            return {
                rawTotal,
                discountPercent,
                discountAmount,
                netTotal
            };
        });
    }, [watchedItems, approvedDiscountMap]);

    const overallTotal = useMemo(() => (
        lineCalculations.reduce((sum, line) => sum + (Number.isFinite(line.netTotal) ? line.netTotal : 0), 0)
    ), [lineCalculations]);

    const totalDiscountAmount = useMemo(() => (
        lineCalculations.reduce((sum, line) => sum + (Number.isFinite(line.discountAmount) ? line.discountAmount : 0), 0)
    ), [lineCalculations]);

    const createSaleMutation = useMutation<CreateSaleResponse[], any, SaleFormData>({
        mutationFn: async (data: SaleFormData) => {
            const results: CreateSaleResponse[] = [];
            const receiptNumber = generateReceiptNumber();

            for (const item of data.items) {
                const payload = {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitType: item.unitType,
                    unitPrice: item.unitPrice,
                    paymentMethod: data.paymentMethod as WarehousePaymentMethod,
                    customerName: data.customerName || selectedCustomer?.name || '',
                    customerPhone: data.customerPhone || undefined,
                    warehouseCustomerId: data.customerId,
                    applyDiscount: item.applyDiscount ?? false,
                    requestDiscountApproval: item.requestDiscountApproval ?? false,
                    discountReason: item.requestDiscountApproval ? item.discountReason : undefined,
                    requestedDiscountPercent: item.requestDiscountApproval ? item.requestedDiscountPercent : undefined,
                    receiptNumber
                };

                const response = await warehouseService.createSale(payload);
                results.push(response);
            }
            return results;
        },
        onSuccess: (responses) => {
            queryClient.invalidateQueries({ queryKey: ['warehouse-sales'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-inventory'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-discount-requests'] });
            refetchPendingDiscounts();
            refetchApprovedDiscounts();

            const hasPendingApproval = responses?.some((response) => response?.pendingApproval);
            const receiptNumber = responses?.[0]?.data?.sale?.receiptNumber;

            if (hasPendingApproval) {
                globalToast.error('Sale recorded but awaiting discount approval. Mark payment as pending until approval is granted.');
            } else {
                const successMessage = receiptNumber
                    ? `Sale recorded successfully! Record #: \${receiptNumber}`
                    : 'Sale recorded successfully!';
                globalToast.success(successMessage);
            }
            navigate('/warehouse/sales');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to record sale');
        }
    });

    const requestDiscountMutation = useMutation({
        mutationFn: async () => {
            if (pendingDiscountItems.length === 0) {
                globalToast.error('Enable “Request discount approval” for at least one product first.');
                return false;
            }

            if (!selectedCustomerId) {
                globalToast.error('Select a customer before submitting a discount request.');
                return false;
            }

            const now = new Date();
            const validFrom = now.toISOString();
            const validUntil = new Date(now.getTime() + DEFAULT_DISCOUNT_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

            const newlySubmittedRequests: Array<{ productId: string; requestId?: string }> = [];

            for (const item of pendingDiscountItems) {
                if (!item.requestedDiscountPercent || item.requestedDiscountPercent <= 0) {
                    throw new Error('Provide a discount percentage for each product requesting approval.');
                }
                const response = await warehouseService.createDiscountRequest({
                    warehouseCustomerId: selectedCustomerId,
                    productId: item.productId,
                    requestedDiscountType: 'PERCENTAGE' as DiscountType,
                    requestedDiscountValue: item.requestedDiscountPercent,
                    minimumQuantity: item.quantity,
                    validFrom,
                    validUntil,
                    reason: item.discountReason || 'Discount requested during warehouse sale preparation',
                    businessJustification: `Requested while preparing sale on ${now.toLocaleString()}`
                });
                if (item.productId) {
                    const requestId = response?.data?.discountRequest?.id ?? '';
                    newlySubmittedRequests.push({ productId: item.productId, requestId });
                }
            }

            if (newlySubmittedRequests.length === 0) {
                globalToast.success('Discount request already pending or approved for the selected products.');
                return false;
            }

            setSessionDiscountRequests((prev) => {
                const next = new Map(prev);
                newlySubmittedRequests.forEach(({ productId, requestId }) => {
                    next.set(productId, {
                        requestId: requestId || '',
                        status: 'PENDING'
                    });
                });
                return next;
            });

            return true;
        },
        onSuccess: (created) => {
            if (!created) {
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['warehouse-discount-requests'] });
            refetchPendingDiscounts();
            refetchApprovedDiscounts();
            globalToast.success('Discount request submitted. Wait for approval before recording the sale.');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || 'Failed to submit discount request';
            if (message.includes('already pending or approved')) {
                globalToast.success(message);
            } else {
                globalToast.error(message);
            }
        }
    });

    const disableRequestButton = requestDiscountMutation.isPending || !selectedCustomerId || !hasRequestableLines;

    const handleProductSelect = (index: number, productId: string) => {
        const product = productIndex.get(productId);
        const pricePerPack = Number(product?.pricePerPack ?? 0);
        const sanitizedPrice = Number.isFinite(pricePerPack) && pricePerPack > 0
            ? parseFloat(pricePerPack.toFixed(2))
            : 0;

        setValue(`items.${index}.unitPrice`, sanitizedPrice, {
            shouldValidate: true,
            shouldTouch: true
        });
    };

    const handleRequestDiscountToggle = (index: number, checked: boolean) => {
        if (checked && !watch(`items.${index}.requestedDiscountPercent`)) {
            setValue(`items.${index}.requestedDiscountPercent`, DEFAULT_DISCOUNT_PERCENT, {
                shouldDirty: true
            });
        }

        if (!checked) {
            setValue(`items.${index}.discountReason`, '', {
                shouldDirty: true
            });
            setValue(`items.${index}.requestedDiscountPercent`, undefined, {
                shouldDirty: true
            });
        }
    };

    const onSubmit = (data: SaleFormData) => {
        const awaitingApproval = watchedItems.some(
            (item) => item.requestDiscountApproval && getRequestStatus(item.productId) !== 'APPROVED'
        );

        if (awaitingApproval) {
            globalToast.error('Please wait for discount approval before recording the sale.');
            return;
        }

        createSaleMutation.mutate(data);
    };

    const customerIdField = register('customerId');

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
                            Capture sales, apply discounts, and keep inventory in sync.
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
                        <div className="space-y-6">
                            {fields.map((field, index) => {
                                const item = watchedItems?.[index];
                                const selectedProduct = item?.productId
                                    ? productIndex.get(item.productId)
                                    : undefined;
                                const calculations = lineCalculations[index];
                                const lineTotal = calculations?.netTotal ?? 0;
                                const discountAmount = calculations?.discountAmount ?? 0;
                                const discountPercent = calculations?.discountPercent ?? 0;
                                const productId = item?.productId;
                                const requestStatus = getRequestStatus(productId);
                                const hasApprovedDiscountForProduct = requestStatus === 'APPROVED';
                                const submittedForProduct = requestStatus === 'PENDING';
                                const isApproved = hasApprovedDiscountForProduct;

                                const productError = errors.items?.[index]?.productId?.message;
                                const quantityError = errors.items?.[index]?.quantity?.message;
                                const unitPriceError = errors.items?.[index]?.unitPrice?.message;
                                const discountReasonError = errors.items?.[index]?.discountReason?.message;
                                const requestedDiscountError = errors.items?.[index]?.requestedDiscountPercent?.message;

                                return (
                                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <span className="font-medium text-gray-700">
                                                    Product {index + 1}
                                                </span>
                                                {selectedProduct?.productNo && (
                                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                                        SKU: {selectedProduct.productNo}
                                                    </span>
                                                )}
                                            </div>
                                            {fields.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product *
                                                </label>
                                                <select
                                                    {...register(`items.${index}.productId` as const, {
                                                        onChange: (event) => {
                                                            handleProductSelect(index, event.target.value);
                                                        }
                                                    })}
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                >
                                                    <option value="">Select a product</option>
                                                    {products.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.name}
                                                            {product.pricePerPack
                                                                ? ` (₦${Number(product.pricePerPack).toLocaleString()} per pack)`
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {productError && (
                                                    <p className="mt-1 text-sm text-red-600">{productError}</p>
                                                )}
                                            </div>

                                            <Input
                                                label="Quantity (packs) *"
                                                type="number"
                                                min={1}
                                                {...register(`items.${index}.quantity` as const, {
                                                    valueAsNumber: true
                                                })}
                                                error={quantityError}
                                                placeholder="Enter quantity"
                                            />

                                            <Input
                                                label="Unit Price (₦) *"
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                {...register(`items.${index}.unitPrice` as const, {
                                                    valueAsNumber: true
                                                })}
                                                error={unitPriceError}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        {selectedProduct && (
                                            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-900">
                                                <div className="flex items-center space-x-2">
                                                    <Package className="h-4 w-4" />
                                                    <span>{selectedProduct.name}</span>
                                                </div>
                                                {selectedProduct.description && (
                                                    <p className="mt-1 text-blue-800">{selectedProduct.description}</p>
                                                )}
                                                {selectedProduct.pricePerPack && (
                                                    <p className="mt-2">
                                                        Listed price per pack:{' '}
                                                        <span className="font-semibold">
                                                            ₦{Number(selectedProduct.pricePerPack).toLocaleString()}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4">
                                            <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    {...register(`items.${index}.applyDiscount` as const)}
                                                />
                                                <span>Apply existing customer discount</span>
                                            </label>

                                            <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    {...register(`items.${index}.requestDiscountApproval` as const, {
                                                        onChange: (event) => {
                                                            handleRequestDiscountToggle(index, event.target.checked);
                                                        }
                                                    })}
                                                />
                                                <span>Request discount approval</span>
                                            </label>
                                        </div>

                                        {item?.requestDiscountApproval && (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <Input
                                                    label="Requested Discount (%)"
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    step="0.5"
                                                    {...register(`items.${index}.requestedDiscountPercent` as const, {
                                                        valueAsNumber: true
                                                    })}
                                                    error={requestedDiscountError}
                                                    placeholder="e.g. 5"
                                                    helpText="Max 50%. Approval required before it applies."
                                                />

                                                <Input
                                                    label="Minimum Quantity"
                                                    type="number"
                                                    min={1}
                                                    value={item?.quantity || 1}
                                                    readOnly
                                                    disabled
                                                />

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Discount Justification *
                                                    </label>
                                                    <textarea
                                                        {...register(`items.${index}.discountReason` as const)}
                                                        rows={3}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                        placeholder="Explain why this discount is needed"
                                                    />
                                                    {discountReasonError && (
                                                        <p className="mt-1 text-sm text-red-600">{discountReasonError}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3 text-sm">
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Calculator className="h-4 w-4" />
                                                <span>Line total</span>
                                            </div>
                                            <span className="text-lg font-semibold text-gray-900">
                                                ₦{lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        {submittedForProduct && !isApproved && item?.requestedDiscountPercent && (
                                            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-800">
                                                Discount request of {Number(item.requestedDiscountPercent).toLocaleString()}% submitted and awaiting approval.
                                            </div>
                                        )}

                                        {isApproved && discountAmount > 0 && (
                                            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-800">
                                                Approved discount of {discountPercent}% reduces this line by ₦{discountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-start">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    append({
                                        productId: '',
                                        quantity: 1,
                                        unitPrice: 0,
                                        unitType: 'PACKS',
                                        applyDiscount: false,
                                        requestDiscountApproval: false,
                                        requestedDiscountPercent: DEFAULT_DISCOUNT_PERCENT,
                                        discountReason: ''
                                    })
                                }
                                className="inline-flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add another product
                            </Button>
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
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <Select
                                    label="Customer *"
                                    placeholder={customersQuery && customersQuery.length > 0 ? 'Select a customer' : 'Loading customers...'}
                                    options={(customersQuery || []).map((customer: any) => ({
                                        value: customer.id,
                                        label: customer.name
                                    }))}
                                    value={selectedCustomerId}
                                    name={customerIdField.name}
                                    ref={customerIdField.ref}
                                    onBlur={customerIdField.onBlur}
                                    onChange={(event) => {
                                        customerIdField.onChange(event);
                                        setValue('customerId', event.target.value, { shouldDirty: true, shouldValidate: true });
                                    }}
                                    error={errors.customerId?.message}
                                />
                            </div>

                            <Input
                                label="Customer Phone"
                                {...register('customerPhone')}
                                error={errors.customerPhone?.message}
                                placeholder="Optional"
                            />
                        </div>

                        {!selectedCustomerId && customersQuery && customersQuery.length > 0 && (
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                                Select the customer before recording the sale or submitting a discount request.
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
                    <div className="p-6 space-y-6">
                        {awaitingCustomerSelection && (
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                                Select a customer before requesting approvals. Discount toggles stay disabled until the customer is chosen.
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Select
                                label="Payment Method *"
                                options={paymentMethodOptions.map((option) => ({
                                    value: option.value,
                                    label: option.label
                                }))}
                                placeholder="Select payment method"
                                error={errors.paymentMethod?.message as string | undefined}
                                {...register('paymentMethod')}
                            />

                            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                                <div className="text-sm text-gray-600">Total payable</div>
                                <div className="mt-1 text-2xl font-semibold text-green-600">
                                    ₦{overallTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                                {totalDiscountAmount > 0 && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Includes ₦{totalDiscountAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} approved discount.
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    Calculated automatically as you adjust product quantity or pricing.
                                </p>
                            </div>
                        </div>

                        {saleHasPendingDiscount && awaitingApproval && (
                            <div className="space-y-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                                <div className="flex items-start">
                                    <AlertTriangle className="mr-3 h-5 w-5 text-yellow-500" />
                                    <div>
                                        This sale includes discount requests awaiting supervisor approval. Wait for approval before recording the sale. Until then, treat this transaction as unpaid.
                                    </div>
                                </div>
                            </div>
                        )}

                        {saleHasPendingDiscount && !awaitingApproval && hasRequestableLines && selectedCustomerId && (
                            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                                You have selected discounts to request. Submit them for approval before recording the sale.
                            </div>
                        )}

                        {saleHasPendingDiscount && !awaitingApproval && hasApprovedDiscount && (
                            <div className="flex items-start justify-between rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                                <div className="flex items-start">
                                    <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                                    <div>
                                        All requested discounts have been approved. The payable amount reflects the approved pricing.
                                    </div>
                                </div>
                                <Button variant="outline" disabled className="text-green-600">
                                    Discount Approved
                                </Button>
                            </div>
                        )}

                        {saleHasPendingDiscount && (
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => requestDiscountMutation.mutate()}
                                    loading={requestDiscountMutation.isPending}
                                    disabled={disableRequestButton}
                                >
                                    Make Discount Request
                                </Button>
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                            Ensure the payment has been collected or approved before you complete this record.
                        </div>
                    </div>
                </div>

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
                        disabled={awaitingApproval || hasRequestableLines || isSubmitting || createSaleMutation.isPending}
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
