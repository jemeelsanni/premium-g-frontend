// src/components/distribution/PriceAdjustmentModal.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import apiClient from '@/services/api';

interface OrderItem {
    id: string;
    productId: string;
    product?: {
        id: string;
        name: string;
    };
    pallets: number;
    packs: number;
    amount: number;
}

interface PriceAdjustmentModalProps {
    orderId: string;
    currentAmount: number;
    orderItems: OrderItem[];
    onClose: () => void;
}

interface ItemPriceUpdate {
    itemId: string;
    productName: string;
    pallets: number;
    packs: number;
    oldPricePerPack: number;
    newPricePerPack: number;
    oldAmount: number;
    newAmount: number;
}

export const PriceAdjustmentModal = ({
    orderId,
    currentAmount,
    orderItems,
    onClose
}: PriceAdjustmentModalProps) => {
    const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
    const [reason, setReason] = useState('');
    const [invoiceRef, setInvoiceRef] = useState('');

    const queryClient = useQueryClient();

    // Initialize item prices from current order items
    useEffect(() => {
        const initialPrices: Record<string, number> = {};
        orderItems.forEach(item => {
            // Calculate current price per pack
            const pricePerPack = item.packs > 0 ? item.amount / item.packs : 0;
            initialPrices[item.id] = Number(pricePerPack.toFixed(2));
        });
        setItemPrices(initialPrices);
    }, [orderItems]);

    // Calculate new total and changes
    const calculateTotals = () => {
        let newTotal = 0;
        const changes: ItemPriceUpdate[] = [];

        orderItems.forEach(item => {
            const newPricePerPack = itemPrices[item.id] || 0;
            const oldPricePerPack = item.packs > 0 ? item.amount / item.packs : 0;
            const newAmount = item.packs * newPricePerPack;

            newTotal += newAmount;

            // Track if price changed
            if (Math.abs(newPricePerPack - oldPricePerPack) > 0.01) {
                changes.push({
                    itemId: item.id,
                    productName: item.product?.name || 'Unknown Product',
                    pallets: item.pallets,
                    packs: item.packs,
                    oldPricePerPack: Number(oldPricePerPack.toFixed(2)),
                    newPricePerPack: Number(newPricePerPack.toFixed(2)),
                    oldAmount: item.amount,
                    newAmount: Number(newAmount.toFixed(2))
                });
            }
        });

        return { newTotal, changes };
    };

    const { newTotal, changes } = calculateTotals();
    const hasChanges = changes.length > 0;

    const adjustmentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post(
                `/distribution/orders/${orderId}/price-adjustments`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success('Price adjustment created successfully');
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            onClose();
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || 'Failed to create price adjustment';
            toast.error(errorMessage);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasChanges) {
            toast.error('No price changes detected');
            return;
        }

        if (!reason.trim()) {
            toast.error('Please provide a reason for the price adjustment');
            return;
        }

        adjustmentMutation.mutate({
            adjustedAmount: newTotal,
            adjustmentType: 'SUPPLIER_PRICE_CHANGE',
            reason: reason.trim(),
            supplierInvoiceReference: invoiceRef.trim() || undefined,
            itemChanges: changes // Send detailed item-level changes
        });
    };

    const handlePriceChange = (itemId: string, value: string) => {
        const price = parseFloat(value) || 0;
        setItemPrices(prev => ({
            ...prev,
            [itemId]: price
        }));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Adjust Order Prices" maxWidth="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Items with Price Inputs */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Prices</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pallets</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Packs</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Price/Pack (₦)</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount (₦)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orderItems.map((item) => {
                                    const pricePerPack = itemPrices[item.id] || 0;
                                    const amount = item.packs * pricePerPack;
                                    const oldPricePerPack = item.packs > 0 ? item.amount / item.packs : 0;
                                    const hasChanged = Math.abs(pricePerPack - oldPricePerPack) > 0.01;

                                    return (
                                        <tr key={item.id} className={hasChanged ? 'bg-yellow-50' : ''}>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {item.product?.name || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-700">
                                                {item.pallets}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-700">
                                                {item.packs}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={pricePerPack}
                                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                    className={`text-center ${hasChanged ? 'border-yellow-400 bg-yellow-50' : ''}`}
                                                />
                                                {hasChanged && (
                                                    <p className="text-xs text-yellow-700 mt-1 text-center">
                                                        Was: ₦{oldPricePerPack.toFixed(2)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <div className={`font-medium ${hasChanged ? 'text-yellow-700' : 'text-gray-900'}`}>
                                                    ₦{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                {hasChanged && (
                                                    <div className="text-xs text-gray-500 line-through">
                                                        ₦{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                        Total:
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <div className={`font-bold text-base ${hasChanges ? 'text-yellow-700' : 'text-gray-900'}`}>
                                            ₦{newTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        {hasChanges && (
                                            <div className="text-xs text-gray-600 line-through">
                                                ₦{currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {hasChanges && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800">
                                Total Adjustment: ₦{(newTotal - currentAmount).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                                {changes.length} item{changes.length > 1 ? 's' : ''} updated
                            </p>
                        </div>
                    )}
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Price Adjustment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Explain why prices are being adjusted (e.g., supplier price increase, market changes, etc.)"
                        required
                    />
                </div>

                {/* Supplier Invoice Reference */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Invoice Reference (Optional)
                    </label>
                    <Input
                        type="text"
                        value={invoiceRef}
                        onChange={(e) => setInvoiceRef(e.target.value)}
                        placeholder="Enter supplier invoice reference if applicable"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={adjustmentMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={adjustmentMutation.isPending || !hasChanges}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
                    >
                        {adjustmentMutation.isPending ? 'Saving...' : 'Save Price Adjustment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
