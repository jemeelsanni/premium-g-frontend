// src/components/distribution/AssignTransportModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';

const transportSchema = z.object({
    transporterCompany: z.string().min(1, 'Transporter company is required'),
    driverNumber: z.string().min(1, 'Driver number is required'),
    truckNumber: z.string().optional(),
});

type TransportFormData = z.infer<typeof transportSchema>;

interface AssignTransportModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export const AssignTransportModal: React.FC<AssignTransportModalProps> = ({
    isOpen,
    onClose,
    orderId,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransportFormData>({
        resolver: zodResolver(transportSchema),
    });

    const assignTransportMutation = useMutation({
        mutationFn: async (data: TransportFormData) => {
            const response = await fetch(`/api/v1/distribution/delivery/assign-transport`, {
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
                throw new Error(error.message || 'Failed to assign transport');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Transport assigned successfully! Order is now in transit.');
            reset();
            onClose();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to assign transport');
        },
    });

    const onSubmit = (data: TransportFormData) => {
        assignTransportMutation.mutate(data);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Assign Transport" maxWidth="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <Truck className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-800">Transport Assignment</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Assign transport details for this order. This will update the delivery status to IN_TRANSIT.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transporter Company */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transporter Company <span className="text-red-500">*</span>
                    </label>
                    <Input
                        {...register('transporterCompany')}
                        placeholder="e.g., XYZ Logistics Ltd"
                        className={errors.transporterCompany ? 'border-red-500' : ''}
                    />
                    {errors.transporterCompany && (
                        <p className="mt-1 text-sm text-red-600">{errors.transporterCompany.message}</p>
                    )}
                </div>

                {/* Driver Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                        {...register('driverNumber')}
                        placeholder="e.g., 08012345678"
                        className={errors.driverNumber ? 'border-red-500' : ''}
                    />
                    {errors.driverNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.driverNumber.message}</p>
                    )}
                </div>

                {/* Truck Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Truck/Vehicle Number
                    </label>
                    <Input
                        {...register('truckNumber')}
                        placeholder="e.g., ABC-123-XY"
                    />
                    <p className="mt-1 text-xs text-gray-500">Vehicle plate number or identification</p>
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
                        <Truck className="h-4 w-4 mr-2" />
                        Assign Transport
                    </Button>
                </div>
            </form>
        </Modal>
    );
};