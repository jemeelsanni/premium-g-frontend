// src/components/distribution/PayRiteFoodsModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Building } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';

const riteFoodsPaymentSchema = z.object({
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['BANK_TRANSFER', 'CHECK']),
    reference: z.string().min(1, 'Payment reference is required'),
    riteFoodsOrderNumber: z.string().optional(),
    riteFoodsInvoiceNumber: z.string().optional(),
});

type RiteFoodsPaymentFormData = z.infer<typeof riteFoodsPaymentSchema>;

interface PayRiteFoodsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    amount: number;
}

export const PayRiteFoodsModal: React.FC<PayRiteFoodsModalProps> = ({
    isOpen,
    onClose,
    orderId,
    amount,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<RiteFoodsPaymentFormData>({
        resolver: zodResolver(riteFoodsPaymentSchema),
        defaultValues: {
            amount: amount,
            paymentMethod: 'BANK_TRANSFER',
        },
    });

    const payRiteFoodsMutation = useMutation({
        mutationFn: async (data: RiteFoodsPaymentFormData) => {
            const response = await fetch(`/api/v1/distribution/payments/rite-foods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    orderId,
                    ...data,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to record payment to Rite Foods');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Payment to Rite Foods recorded successfully!');
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record payment');
        },
    });

    const onSubmit = (data: RiteFoodsPaymentFormData) => {
        payRiteFoodsMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Pay Rite Foods" maxWidth="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <Building className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-800">Payment to Supplier</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Record payment made to Rite Foods Ltd for this order. This will update the order status
                                to allow for order processing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                        <Input
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                            placeholder="Enter payment amount"
                            className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register('paymentMethod')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                    </select>
                    {errors.paymentMethod && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                    )}
                </div>

                {/* Reference */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Reference <span className="text-red-500">*</span>
                    </label>
                    <Input
                        {...register('reference')}
                        placeholder="e.g., TRX-RF-123456789"
                        className={errors.reference ? 'border-red-500' : ''}
                    />
                    {errors.reference && (
                        <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Bank transaction reference or check number</p>
                </div>

                {/* Rite Foods Order Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rite Foods Order Number
                    </label>
                    <Input
                        {...register('riteFoodsOrderNumber')}
                        placeholder="e.g., RFL-ORD-2024-001"
                    />
                    <p className="mt-1 text-xs text-gray-500">Reference number from Rite Foods (if available)</p>
                </div>

                {/* Rite Foods Invoice Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rite Foods Invoice Number
                    </label>
                    <Input
                        {...register('riteFoodsInvoiceNumber')}
                        placeholder="e.g., RFL-INV-2024-001"
                    />
                    <p className="mt-1 text-xs text-gray-500">Invoice number from Rite Foods (if available)</p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payee:</span>
                            <span className="font-medium">Rite Foods Limited</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Order Amount:</span>
                            <span className="font-medium">₦{amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        loading={isSubmitting}
                    >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Record Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
};