/* eslint-disable @typescript-eslint/no-explicit-any */
// components/distribution/PriceAdjustmentModal.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

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
            const response = await fetch(`/api/v1/distribution/orders/${orderId}/price-adjustments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create price adjustment');
            return response.json();
        },
        onSuccess: () => {
            toast.success('Price adjustment created successfully');
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create price adjustment');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!adjustedAmount || !reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        adjustmentMutation.mutate({
            adjustedAmount: parseFloat(adjustedAmount),
            adjustmentType: 'RITE_FOODS_PRICE_CHANGE',
            reason: reason.trim(),
            riteFoodsInvoiceReference: invoiceRef.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">Price Adjustment</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Current Amount</label>
                        <input
                            type="text"
                            value={`₦${currentAmount.toLocaleString()}`}
                            disabled
                            className="w-full px-3 py-2 border rounded bg-gray-100"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            New Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={adjustedAmount}
                            onChange={(e) => setAdjustedAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new amount"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Explain reason for Rite Foods price change"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Rite Foods Invoice Reference (Optional)
                        </label>
                        <input
                            type="text"
                            value={invoiceRef}
                            onChange={(e) => setInvoiceRef(e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter invoice reference"
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={adjustmentMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {adjustmentMutation.isPending ? 'Saving...' : 'Save Adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};