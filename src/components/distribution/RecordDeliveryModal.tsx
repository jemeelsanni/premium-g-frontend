// src/components/distribution/RecordDeliveryModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { distributionService } from '../../services/distributionService';

const deliverySchema = z.object({
    deliveryStatus: z.enum(['FULLY_DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED']),
    deliveredPallets: z.number().min(0).optional(),
    deliveredPacks: z.number().min(0).optional(),
    deliveredBy: z.string().min(1, 'Delivered by is required'),
    deliveryNotes: z.string().optional(),
    nonDeliveryReason: z.string().optional(),
    partialDeliveryReason: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface RecordDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    totalPallets: number;
    totalPacks: number;
}

export const RecordDeliveryModal: React.FC<RecordDeliveryModalProps> = ({
    isOpen,
    onClose,
    orderId,
    totalPallets,
    totalPacks,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<DeliveryFormData>({
        resolver: zodResolver(deliverySchema),
        defaultValues: {
            deliveryStatus: 'FULLY_DELIVERED',
            deliveredPallets: totalPallets,
            deliveredPacks: totalPacks,
            deliveredBy: '',
            deliveryNotes: '',
            nonDeliveryReason: '',
            partialDeliveryReason: '',
        },
    });

    const deliveryStatus = watch('deliveryStatus');

    const recordDeliveryMutation = useMutation({
        mutationFn: async (data: DeliveryFormData) => {
            return distributionService.recordDelivery({ orderId, ...data });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Delivery recorded successfully!');
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record delivery');
        },
    });

    const onSubmit = (data: DeliveryFormData) => {
        recordDeliveryMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Record Delivery" maxWidth="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Order Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Total Pallets:</span>
                            <span className="ml-2 font-medium">{totalPallets}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Total Packs:</span>
                            <span className="ml-2 font-medium">{totalPacks}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register('deliveryStatus')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="FULLY_DELIVERED">Fully Delivered</option>
                        <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                        <option value="FAILED">Delivery Failed</option>
                    </select>
                    {errors.deliveryStatus && (
                        <p className="mt-1 text-sm text-red-600">{errors.deliveryStatus.message}</p>
                    )}
                </div>

                {/* Conditional Fields for Partial Delivery */}
                {(deliveryStatus === 'FULLY_DELIVERED' || deliveryStatus === 'PARTIALLY_DELIVERED') && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivered Pallets
                                </label>
                                <Input
                                    type="number"
                                    {...register('deliveredPallets', { valueAsNumber: true })}
                                    placeholder="0"
                                    min="0"
                                    max={totalPallets}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivered Packs
                                </label>
                                <Input
                                    type="number"
                                    {...register('deliveredPacks', { valueAsNumber: true })}
                                    placeholder="0"
                                    min="0"
                                    max={totalPacks}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Delivered By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivered By <span className="text-red-500">*</span>
                    </label>
                    <Input
                        {...register('deliveredBy')}
                        placeholder="Name of person who delivered"
                        className={errors.deliveredBy ? 'border-red-500' : ''}
                    />
                    {errors.deliveredBy && (
                        <p className="mt-1 text-sm text-red-600">{errors.deliveredBy.message}</p>
                    )}
                </div>

                {/* Delivery Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Notes
                    </label>
                    <textarea
                        {...register('deliveryNotes')}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any notes about the delivery..."
                    />
                </div>

                {/* Partial Delivery Reason */}
                {deliveryStatus === 'PARTIALLY_DELIVERED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Partial Delivery
                        </label>
                        <textarea
                            {...register('partialDeliveryReason')}
                            rows={3}
                            className="block w-full px-3 py-2 border border-yellow-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="Explain why only partial delivery was made..."
                        />
                        <div className="mt-2 flex items-start">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-xs text-yellow-700">
                                Partial deliveries require explanation and may need follow-up action.
                            </p>
                        </div>
                    </div>
                )}

                {/* Failed Delivery Reason */}
                {deliveryStatus === 'FAILED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Delivery Failure <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('nonDeliveryReason')}
                            rows={3}
                            className="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                            placeholder="Explain why delivery failed..."
                        />
                        <div className="mt-2 flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-xs text-red-700">
                                Failed deliveries require immediate attention and rescheduling.
                            </p>
                        </div>
                    </div>
                )}

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
                        className={
                            deliveryStatus === 'FULLY_DELIVERED'
                                ? 'bg-green-600 hover:bg-green-700'
                                : deliveryStatus === 'PARTIALLY_DELIVERED'
                                    ? 'bg-yellow-600 hover:bg-yellow-700'
                                    : 'bg-red-600 hover:bg-red-700'
                        }
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Record Delivery
                    </Button>
                </div>
            </form>
        </Modal>
    );
};