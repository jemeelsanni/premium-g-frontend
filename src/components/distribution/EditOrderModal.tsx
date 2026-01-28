// src/components/distribution/EditOrderModal.tsx
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { distributionService } from '../../services/distributionService';

const orderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    pallets: z.number().min(0, 'Pallets must be non-negative'),
    addonPacks: z.number().min(0, 'Add-on packs must be non-negative').optional(),
    packs: z.number().min(1, 'Packs must be at least 1'),
    amount: z.number().min(0, 'Amount must be positive'),
});

const editOrderSchema = z.object({
    orderItems: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type EditOrderFormData = z.infer<typeof editOrderSchema>;

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentItems: any[];
    supplierCompanyId?: string;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
    isOpen,
    onClose,
    orderId,
    currentItems,
    supplierCompanyId,
}) => {
    const queryClient = useQueryClient();

    // Fetch supplier products if supplier is specified
    const { data: supplierProductsResponse } = useQuery({
        queryKey: ['supplier-products', supplierCompanyId],
        queryFn: () => supplierCompanyId ? distributionService.getSupplierProductsBySupplier(supplierCompanyId, true) : Promise.resolve(null),
        enabled: !!supplierCompanyId && isOpen,
    });

    // Extract products
    const supplierProducts = supplierCompanyId && supplierProductsResponse
        ? (supplierProductsResponse as any).data?.data?.products || (supplierProductsResponse as any).data?.products || []
        : [];

    const products = supplierProducts.map((sp: any) => ({
        ...sp.product,
        supplierCostPerPack: sp.supplierCostPerPack,
        supplierProductId: sp.id,
    }));

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<EditOrderFormData>({
        resolver: zodResolver(editOrderSchema),
        defaultValues: {
            orderItems: currentItems.map(item => ({
                productId: item.productId,
                pallets: item.pallets || 0,
                addonPacks: item.addonPacks || 0,
                packs: item.packs || 0,
                amount: parseFloat(item.amount) || 0,
            })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'orderItems',
    });

    const watchedItems = watch('orderItems');

    // Auto-calculate packs and amount when pallets, addonPacks, or productId changes
    React.useEffect(() => {
        watchedItems.forEach((item, index) => {
            if (!item.productId) return;

            const product = products.find((p: any) => p.id === item.productId);
            if (!product) return;

            const pallets = Number(item.pallets) || 0;
            const addonPacks = Number(item.addonPacks) || 0;
            const packsPerPallet = Number(product.packsPerPallet) || 0;
            const pricePerPack = Number(product.supplierCostPerPack) || 0;

            // Calculate total packs: (pallets × packs per pallet) + add-on packs
            const calculatedPacks = (pallets * packsPerPallet) + addonPacks;

            // Calculate amount
            const calculatedAmount = calculatedPacks * pricePerPack;

            // Update if different
            if (calculatedPacks !== item.packs) {
                setValue(`orderItems.${index}.packs`, calculatedPacks, { shouldValidate: false });
            }

            if (Math.abs(calculatedAmount - item.amount) > 0.01) {
                setValue(`orderItems.${index}.amount`, parseFloat(calculatedAmount.toFixed(2)), { shouldValidate: false });
            }
        });
    }, [watchedItems, products, setValue]);

    const updateOrderMutation = useMutation({
        mutationFn: async (data: EditOrderFormData) => {
            // Calculate totals
            let totalPallets = 0;
            let totalPacks = 0;
            let totalAmount = 0;

            const orderItems = data.orderItems.map(item => {
                totalPallets += Number(item.pallets) || 0;
                totalPacks += Number(item.packs) || 0;
                totalAmount += Number(item.amount) || 0;

                return {
                    productId: item.productId,
                    pallets: Number(item.pallets) || 0,
                    addonPacks: Number(item.addonPacks) || 0,
                    packs: Number(item.packs) || 0,
                    amount: Number(item.amount) || 0,
                };
            });

            // Fetch current order to get amountPaid
            const orderResponse = await distributionService.getOrder(orderId);
            const currentOrder = (orderResponse as any)?.data?.order || (orderResponse as any)?.data || orderResponse;
            const amountPaid = parseFloat(currentOrder.amountPaid || 0);

            // Calculate new balance
            const balance = totalAmount - amountPaid;

            // Determine payment status
            let paymentStatus = 'PENDING';
            if (amountPaid >= totalAmount) {
                paymentStatus = amountPaid > totalAmount ? 'OVERPAID' : 'CONFIRMED';
            } else if (amountPaid > 0) {
                paymentStatus = 'PARTIAL';
            }

            const response = await fetch(`/api/v1/distribution/orders/${orderId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    orderItems,
                    totalPallets,
                    totalPacks,
                    originalAmount: totalAmount,
                    finalAmount: totalAmount,
                    balance,
                    paymentStatus,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update order');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Order updated successfully!');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update order');
        },
    });

    const onSubmit = (data: EditOrderFormData) => {
        updateOrderMutation.mutate(data);
    };

    const addOrderItem = () => {
        append({ productId: '', pallets: 0, addonPacks: 0, packs: 0, amount: 0 });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Order" maxWidth="2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Order Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                            Order Items
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addOrderItem}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                        </Button>
                    </div>

                    {fields.map((field, index) => {
                        const product = products.find((p: any) => p.id === watchedItems[index]?.productId);
                        const packsPerPallet = product?.packsPerPallet || 0;
                        const pricePerPack = product?.supplierCostPerPack || 0;

                        return (
                            <div key={field.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Product */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Product *
                                        </label>
                                        <select
                                            {...register(`orderItems.${index}.productId`)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((prod: any) => (
                                                <option key={prod.id} value={prod.id}>
                                                    {prod.name} - ₦{Number(prod.supplierCostPerPack).toLocaleString()}/pack
                                                </option>
                                            ))}
                                        </select>
                                        {product && (
                                            <p className="mt-1 text-xs text-blue-600">
                                                {packsPerPallet} packs/pallet • ₦{pricePerPack.toLocaleString()}/pack
                                            </p>
                                        )}
                                        {errors.orderItems?.[index]?.productId && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.orderItems[index]?.productId?.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Pallets */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Pallets *
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            {...register(`orderItems.${index}.pallets`, { valueAsNumber: true })}
                                            className="mt-1"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Add-on Packs */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Add-on Packs
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            {...register(`orderItems.${index}.addonPacks`, { valueAsNumber: true })}
                                            className="mt-1"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* Total Packs (Read-only) */}
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
                                    </div>

                                    {/* Amount (Read-only) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Amount (₦)
                                        </label>
                                        <Input
                                            type="number"
                                            {...register(`orderItems.${index}.amount`)}
                                            className="mt-1 bg-gray-100"
                                            readOnly
                                            tabIndex={-1}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span>Total Pallets:</span>
                            <span className="font-semibold">
                                {watchedItems.reduce((sum, item) => sum + (Number(item.pallets) || 0), 0)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Packs:</span>
                            <span className="font-semibold">
                                {watchedItems.reduce((sum, item) => sum + (Number(item.packs) || 0), 0)}
                            </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount:</span>
                            <span>
                                ₦{watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={isSubmitting}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Order
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
