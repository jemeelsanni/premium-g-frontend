// src/components/distribution/UpdateRiteFoodsStatusModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';

const rflStatusSchema = z.object({
    riteFoodsStatus: z.enum(['ORDER_RAISED', 'PROCESSING', 'LOADED', 'DISPATCHED']),
    orderRaisedAt: z.string().optional(),
    loadedDate: z.string().optional(),
});

type RFLStatusFormData = z.infer<typeof rflStatusSchema>;

interface UpdateRiteFoodsStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentStatus?: string;
}

export const UpdateRiteFoodsStatusModal: React.FC<UpdateRiteFoodsStatusModalProps> = ({
    isOpen,
    onClose,
    orderId,
    currentStatus,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<RFLStatusFormData>({
        resolver: zodResolver(rflStatusSchema),
    });

    const selectedStatus = watch('riteFoodsStatus');

    const updateStatusMutation = useMutation({
        mutationFn: async (data: RFLStatusFormData) => {
            const response = await fetch(`/api/v1/distribution/payments/rite-foods/status`, {
                method: 'PUT',
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
                throw new Error(error.message || 'Failed to update status');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Rite Foods status updated successfully!');
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update status');
        },
    });

    const onSubmit = (data: RFLStatusFormData) => {
        updateStatusMutation.mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Rite Foods Status" maxWidth="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                        Current Status: <span className="font-semibold">{currentStatus || 'N/A'}</span>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        {...register('riteFoodsStatus')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Select status...</option>
                        <option value="ORDER_RAISED">Order Raised</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="LOADED">Loaded (Ready for Transport)</option>
                        <option value="DISPATCHED">Dispatched</option>
                    </select>
                    {errors.riteFoodsStatus && (
                        <p className="mt-1 text-sm text-red-600">{errors.riteFoodsStatus.message}</p>
                    )}
                </div>

                {selectedStatus === 'ORDER_RAISED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order Raised Date
                        </label>
                        <Input type="datetime-local" {...register('orderRaisedAt')} />
                    </div>
                )}

                {selectedStatus === 'LOADED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loaded Date
                        </label>
                        <Input type="datetime-local" {...register('loadedDate')} />
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
                        <FileText className="h-4 w-4 mr-2" />
                        Update Status
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

