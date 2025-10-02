/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/distribution/ConfirmPaymentModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';

const confirmSchema = z.object({
    notes: z.string().optional(),
});

type ConfirmFormData = z.infer<typeof confirmSchema>;

interface ConfirmPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderDetails: any;
}

export const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({
    isOpen,
    onClose,
    orderId,
    orderDetails,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<ConfirmFormData>({
        resolver: zodResolver(confirmSchema),
    });

    const confirmPaymentMutation = useMutation({
        mutationFn: async (data: ConfirmFormData) => {
            const response = await fetch(`/api/v1/distribution/payments/confirm`, {
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
                throw new Error(error.message || 'Failed to confirm payment');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Payment confirmed successfully! Ready to send to Rite Foods.');
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to confirm payment');
        },
    });

    const onSubmit = (data: ConfirmFormData) => {
        confirmPaymentMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Payment" maxWidth="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Warning Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-yellow-800">Accountant Confirmation Required</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                By confirming this payment, you verify that the full amount has been received and reconciled.
                                This action will allow the order to proceed to Rite Foods payment stage.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900">Payment Summary</h4>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Customer</p>
                            <p className="font-medium">{orderDetails.customer?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Order Amount</p>
                            <p className="font-medium">₦{orderDetails.finalAmount?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Amount Paid</p>
                            <p className="font-medium text-green-600">₦{orderDetails.amountPaid?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Balance</p>
                            <p className={`font-medium ${orderDetails.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₦{orderDetails.balance?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>

                    {orderDetails.balance === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-sm text-green-800 font-medium">Fully Paid - Ready to Confirm</span>
                        </div>
                    )}
                </div>

                {/* Confirmation Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmation Notes (Optional)
                    </label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any notes about payment reconciliation..."
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
                        disabled={isSubmitting || orderDetails.balance > 0}
                        loading={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
};