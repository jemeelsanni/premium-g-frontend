/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { distributionService } from '../../services/distributionService';
import { toast } from 'react-hot-toast';

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
    amount
}) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        paymentMethod: 'BANK_TRANSFER',
        amount: amount
    });

    const payRiteFoodsMutation = useMutation({
        mutationFn: (data: any) => distributionService.payRiteFoods(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', orderId] });

            // Show success with generated numbers
            const { paymentReference, riteFoodsOrderNumber, riteFoodsInvoiceNumber } = response.data;
            toast.success(
                `Payment recorded!\nRef: ${paymentReference}\nOrder: ${riteFoodsOrderNumber}\nInvoice: ${riteFoodsInvoiceNumber}`,
                { duration: 5000 }
            );
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    });

    const resetForm = () => {
        setFormData({
            paymentMethod: 'BANK_TRANSFER',
            amount: amount
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        payRiteFoodsMutation.mutate({
            orderId,
            amount: formData.amount,
            paymentMethod: formData.paymentMethod
            // reference, riteFoodsOrderNumber, and riteFoodsInvoiceNumber will be auto-generated
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Pay Rite Foods"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                        Payment reference, order number, and invoice number will be auto-generated
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                    </label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        required
                        min={0.01}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                    </label>
                    <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CHECK">Check</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={payRiteFoodsMutation.isPending}
                    >
                        <DollarSign className="h-4 w-4 mr-2" />
                        {payRiteFoodsMutation.isPending ? 'Processing...' : 'Record Payment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};