/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import { warehouseService } from '../../services/warehouseService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WarehouseSale } from '../../types/warehouse';

const editSaleSchema = z.object({
    warehouseCustomerId: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_MONEY', 'CREDIT']),
    paymentStatus: z.enum(['PAID', 'CREDIT', 'PARTIAL']),
    creditDueDate: z.string().optional(),
    creditNotes: z.string().optional(),
    amountPaid: z.number().optional(),
});

type EditSaleFormData = z.infer<typeof editSaleSchema>;

interface EditSaleModalProps {
    sale: WarehouseSale;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
    sale,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const queryClient = useQueryClient();

    // Fetch customers for dropdown
    const { data: customersData } = useQuery({
        queryKey: ['warehouse-customers'],
        queryFn: () => warehouseService.getCustomers({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditSaleFormData>({
        resolver: zodResolver(editSaleSchema),
        defaultValues: {
            warehouseCustomerId: sale.warehouseCustomerId || '',
            customerName: sale.customerName || '',
            customerPhone: sale.customerPhone || '',
            paymentMethod: (sale.paymentMethod as any) || 'CASH',
            paymentStatus: sale.paymentStatus || 'PAID',
            creditDueDate: sale.creditDueDate || '',
            creditNotes: sale.creditNotes || '',
            amountPaid: sale.debtor?.amountPaid || 0,
        },
    });

    // Reset form when sale changes
    useEffect(() => {
        if (isOpen) {
            reset({
                warehouseCustomerId: sale.warehouseCustomerId || '',
                customerName: sale.customerName || '',
                customerPhone: sale.customerPhone || '',
                paymentMethod: (sale.paymentMethod as any) || 'CASH',
                paymentStatus: sale.paymentStatus || 'PAID',
                creditDueDate: sale.creditDueDate || '',
                creditNotes: sale.creditNotes || '',
                amountPaid: sale.debtor?.amountPaid || 0,
            });
        }
    }, [sale, isOpen, reset]);

    const watchPaymentStatus = watch('paymentStatus');

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: EditSaleFormData) => {
            // Since the API might use the first saleId for updates
            const saleId = sale.saleIds[0];
            return warehouseService.updateSale(saleId, data);
        },
        onSuccess: () => {
            toast.success('Sale updated successfully');
            queryClient.invalidateQueries({ queryKey: ['warehouse-sale'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse-sales'] });
            onSuccess?.();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update sale');
        },
    });

    const onSubmit = (data: EditSaleFormData) => {
        updateMutation.mutate(data);
    };

    if (!isOpen) return null;

    // Debug: Check if sale data exists
    if (!sale) {
        console.error('EditSaleModal: Sale data is missing');
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={onClose}
            />

            {/* Modal container */}
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Modal panel */}
                <div className="relative w-full max-w-2xl overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Edit Sale - Receipt #{sale.receiptNumber}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Sale Summary */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                                <span className="text-gray-600">Sale Date:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {new Date(sale.createdAt).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="ml-2 font-semibold text-gray-900">
                                    ₦{sale.totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Items:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {sale.itemsCount} item{sale.itemsCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Sales Officer:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {sale.salesOfficerUser?.username || sale.salesOfficer || '—'}
                                </span>
                            </div>
                        </div>

                        {/* Items List */}
                        {sale.items && sale.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-2">Products in this sale:</p>
                                <div className="space-y-1">
                                    {sale.items.map((item: any, index: number) => (
                                        <div key={item.id || index} className="flex justify-between text-xs text-gray-600">
                                            <span>
                                                {item.product?.name || 'Unknown Product'}
                                                <span className="text-gray-400 ml-1">
                                                    ({item.quantity} {item.unitType?.toLowerCase() || 'units'})
                                                </span>
                                            </span>
                                            <span className="font-medium">
                                                ₦{(item.totalAmount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
                        <div className="space-y-4">
                            {/* Customer Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer (Optional - for walk-in customers)
                                </label>
                                <select
                                    {...register('warehouseCustomerId')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Walk-in Customer (No customer record)</option>
                                    {customersData?.data?.customers?.map((customer: any) => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.name}
                                            {customer.phone ? ` - ${customer.phone}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.warehouseCustomerId && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.warehouseCustomerId.message}
                                    </p>
                                )}
                            </div>

                            {/* Walk-in Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Customer Name (Walk-in)"
                                    {...register('customerName')}
                                    placeholder="Optional for walk-in customers"
                                />
                                <Input
                                    label="Customer Phone (Walk-in)"
                                    {...register('customerPhone')}
                                    placeholder="Optional"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method *
                                </label>
                                <select
                                    {...register('paymentMethod')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CHECK">Check</option>
                                    <option value="CARD">Card</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                    <option value="CREDIT">Credit</option>
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Status *
                                </label>
                                <select
                                    {...register('paymentStatus')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="PAID">Paid</option>
                                    <option value="CREDIT">Credit</option>
                                    <option value="PARTIAL">Partial Payment</option>
                                </select>
                            </div>

                            {/* Credit/Partial Payment Fields */}
                            {(watchPaymentStatus === 'CREDIT' ||
                                watchPaymentStatus === 'PARTIAL') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            {...register('creditDueDate')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {watchPaymentStatus === 'PARTIAL' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Amount Paid
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                {...register('amountPaid', {
                                                    valueAsNumber: true,
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                            <p className="mt-1 text-sm text-gray-500">
                                                Total Amount: ₦
                                                {sale.totalAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Credit Notes
                                        </label>
                                        <textarea
                                            {...register('creditNotes')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Optional notes about this credit sale..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Sale'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
