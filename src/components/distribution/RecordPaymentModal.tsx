// src/components/distribution/RecordPaymentModal.tsx
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { distributionService } from '../../services/distributionService';

const paymentSchema = z.object({
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    paymentMethod: z.enum(['BANK_TRANSFER', 'CASH', 'CHECK', 'WHATSAPP_TRANSFER', 'POS', 'MOBILE_MONEY']),
    reference: z.string().optional(),
    paidBy: z.string().optional(),
    receivedBy: z.string().min(1, 'Received by is required'),
    notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    balance: number;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
    isOpen,
    onClose,
    orderId,
    balance,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: balance,
            paymentMethod: 'BANK_TRANSFER',
            receivedBy: '',
            reference: '',
            paidBy: '',
            notes: '',
        },
    });

    const recordPaymentMutation = useMutation({
        mutationFn: async (data: PaymentFormData) => {
            return distributionService.recordPayment({ orderId, ...data });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Payment recorded successfully!');
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record payment');
        },
    });

    const onSubmit: SubmitHandler<PaymentFormData> = (data) => {
        recordPaymentMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Record Payment" maxWidth="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Balance Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Outstanding Balance</p>
                            <p className="text-2xl font-bold text-blue-900">₦{balance.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('amount', { valueAsNumber: true })}
                        placeholder="Enter payment amount"
                        className={errors.amount ? 'border-red-500' : ''}
                    />
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
                        <option value="CASH">Cash</option>
                        <option value="CHECK">Check</option>
                        <option value="WHATSAPP_TRANSFER">WhatsApp Transfer</option>
                        <option value="POS">POS</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                    </select>
                    {errors.paymentMethod && (
                        <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                    )}
                </div>

                {/* Reference */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reference Number
                    </label>
                    <Input
                        {...register('reference')}
                        placeholder="e.g., TRX123456789"
                    />
                </div>

                {/* Paid By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paid By (Customer Rep)
                    </label>
                    <Input
                        {...register('paidBy')}
                        placeholder="Name of person who made payment"
                    />
                </div>

                {/* Received By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Received By <span className="text-red-500">*</span>
                    </label>
                    <Input
                        {...register('receivedBy')}
                        placeholder="Your name"
                        className={errors.receivedBy ? 'border-red-500' : ''}
                    />
                    {errors.receivedBy && (
                        <p className="mt-1 text-sm text-red-600">{errors.receivedBy.message}</p>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any additional notes about this payment..."
                    />
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