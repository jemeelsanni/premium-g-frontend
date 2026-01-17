// src/components/distribution/UpdateSupplierStatusModal.tsx
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
import { distributionService } from '../../services/distributionService';

const supplierStatusSchema = z.object({
    supplierStatus: z.enum(['ORDER_RAISED', 'PROCESSING', 'LOADED', 'DISPATCHED']),
    orderRaisedAt: z.string().optional(),
    loadedDate: z.string().optional(),
});

type SupplierStatusFormData = z.infer<typeof supplierStatusSchema>;

interface UpdateSupplierStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentStatus?: string;
    supplierName?: string;
}

export const UpdateSupplierStatusModal: React.FC<UpdateSupplierStatusModalProps> = ({
    isOpen,
    onClose,
    orderId,
    currentStatus,
    supplierName = 'Supplier'
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<SupplierStatusFormData>({
        resolver: zodResolver(supplierStatusSchema),
    });

    const selectedStatus = watch('supplierStatus');

    const updateStatusMutation = useMutation({
        mutationFn: async (data: SupplierStatusFormData) => {
            return distributionService.updateSupplierStatus({
                orderId,
                supplierStatus: data.supplierStatus,
                orderRaisedAt: data.orderRaisedAt,
                loadedDate: data.loadedDate
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success(`${supplierName} status updated successfully!`);
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update status');
        },
    });

    const onSubmit = (data: SupplierStatusFormData) => {
        updateStatusMutation.mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update ${supplierName} Status`} maxWidth="lg">
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
                        {...register('supplierStatus')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Select status...</option>
                        <option value="ORDER_RAISED">Order Raised</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="LOADED">Loaded (Ready for Transport)</option>
                        <option value="DISPATCHED">Dispatched</option>
                    </select>
                    {errors.supplierStatus && (
                        <p className="mt-1 text-sm text-red-600">{errors.supplierStatus.message}</p>
                    )}
                </div>

                {selectedStatus === 'ORDER_RAISED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order Raised Date
                        </label>
                        <Input type="datetime-local" {...register('orderRaisedAt')} />
                        <p className="mt-1 text-xs text-gray-500">
                            When this status is set, price adjustments will be permanently locked
                        </p>
                    </div>
                )}

                {selectedStatus === 'LOADED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loaded Date
                        </label>
                        <Input type="datetime-local" {...register('loadedDate')} />
                        <p className="mt-1 text-xs text-gray-500">
                            Products are ready for pickup/dispatch
                        </p>
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
