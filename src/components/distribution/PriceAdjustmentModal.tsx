// src/components/distribution/PriceAdjustmentModal.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import apiClient from '@/services/api'; // Import the configured axios instance

interface PriceAdjustmentModalProps {
    orderId: string;
    currentAmount: number;
    onClose: () => void;
}

export const PriceAdjustmentModal = ({ orderId, currentAmount, onClose }: PriceAdjustmentModalProps) => {
    const [adjustedAmount, setAdjustedAmount] = useState('');
    const [reason, setReason] = useState('');
    const [invoiceRef, setInvoiceRef] = useState('');

    const queryClient = useQueryClient();

    const adjustmentMutation = useMutation({
        mutationFn: async (data: any) => {
            // ✅ FIXED - Use apiClient which has auth interceptor
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

        if (!adjustedAmount || !reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        const amount = parseFloat(adjustedAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        adjustmentMutation.mutate({
            adjustedAmount: amount,
            adjustmentType: 'RITE_FOODS_PRICE_CHANGE',
            reason: reason.trim(),
            riteFoodsInvoiceReference: invoiceRef.trim() || undefined,
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Price Adjustment">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Amount
                    </label>
                    <Input
                        type="text"
                        value={`₦${currentAmount.toLocaleString()}`}
                        disabled
                        className="bg-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Amount <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        value={adjustedAmount}
                        onChange={(e) => setAdjustedAmount(e.target.value)}
                        placeholder="Enter new amount"
                        required
                    />
                    {adjustedAmount && (
                        <p className="text-xs text-gray-500 mt-1">
                            Difference: ₦{(parseFloat(adjustedAmount) - currentAmount).toLocaleString()}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Explain reason for Rite Foods price change"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rite Foods Invoice Reference (Optional)
                    </label>
                    <Input
                        type="text"
                        value={invoiceRef}
                        onChange={(e) => setInvoiceRef(e.target.value)}
                        placeholder="Enter invoice reference"
                    />
                </div>

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
                        disabled={adjustmentMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {adjustmentMutation.isPending ? 'Saving...' : 'Save Adjustment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};