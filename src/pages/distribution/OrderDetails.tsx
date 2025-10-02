/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    DollarSign,
    Calendar,
    MapPin,
    User,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        paymentMethod: 'CASH',
        reference: '',
        paidBy: '',
        notes: ''
    });

    const { data: orderResponse, isLoading } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionService.getOrder(id!),
        enabled: !!id,
    });

    const { data: paymentsResponse } = useQuery({
        queryKey: ['order-payments', id],
        queryFn: () => distributionService.getPaymentHistory(id!),
        enabled: !!id,
    });

    const recordPaymentMutation = useMutation({
        mutationFn: (data: any) => distributionService.recordPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', id] });
            queryClient.invalidateQueries({ queryKey: ['order-payments', id] });
            toast.success('Payment recorded successfully!');
            setIsPaymentModalOpen(false);
            resetPaymentForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to record payment');
        }
    });

    const confirmPaymentMutation = useMutation({
        mutationFn: () => distributionService.confirmPayment(id!, 'Payment confirmed by accountant'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', id] });
            toast.success('Payment confirmed successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to confirm payment');
        }
    });

    const resetPaymentForm = () => {
        setPaymentData({
            amount: 0,
            paymentMethod: 'CASH',
            reference: '',
            paidBy: '',
            notes: ''
        });
    };

    const handleRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) return;

        recordPaymentMutation.mutate({
            orderId: id,
            ...paymentData
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const order = orderResponse?.data;
    const payments = paymentsResponse || [];

    if (!order) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">Order not found</p>
                <Button onClick={() => navigate('/distribution/orders')} className="mt-4">
                    Back to Orders
                </Button>
            </div>
        );
    }

    const balance = parseFloat(order.balance || 0);
    const amountPaid = parseFloat(order.amountPaid || 0);
    const totalAmount = parseFloat(order.finalAmount || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Button
                    variant="outline"
                    onClick={() => navigate('/distribution/orders')}
                    className="flex items-center"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Order #{order.orderNumber || order.id.slice(-8)}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Created on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Information */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start space-x-3">
                                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Customer</div>
                                    <div className="text-sm text-gray-600">{order.customer?.name}</div>
                                    {order.customer?.email && (
                                        <div className="text-sm text-gray-500">{order.customer.email}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Location</div>
                                    <div className="text-sm text-gray-600">{order.location?.name}</div>
                                    {order.location?.address && (
                                        <div className="text-sm text-gray-500">{order.location.address}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Order Details</div>
                                    <div className="text-sm text-gray-600">
                                        {order.totalPallets} pallets • {order.totalPacks} packs
                                    </div>
                                </div>
                            </div>

                            {order.remark && (
                                <div className="pt-4 border-t">
                                    <div className="text-sm font-medium text-gray-900 mb-1">Remarks</div>
                                    <div className="text-sm text-gray-600">{order.remark}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Pallets
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Packs
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.orderItems?.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.product?.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {item.pallets}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {item.packs}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                ₦{parseFloat(item.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                                <Button
                                    size="sm"
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    disabled={balance <= 0}
                                >
                                    Record Payment
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            {payments.length > 0 ? (
                                <div className="space-y-4">
                                    {payments.map((payment: any) => (
                                        <div key={payment.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                                            <div className="flex items-start space-x-3">
                                                <div className="p-2 bg-green-100 rounded-full">
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        ₦{parseFloat(payment.amount).toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {payment.paymentMethod} • {payment.paidBy}
                                                    </div>
                                                    {payment.reference && (
                                                        <div className="text-xs text-gray-500">
                                                            Ref: {payment.reference}
                                                        </div>
                                                    )}
                                                    {payment.notes && (
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            {payment.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No payments recorded yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Summary Sidebar */}
                <div className="space-y-6">
                    {/* Payment Status */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Payment Summary</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Amount</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    ₦{totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Amount Paid</span>
                                <span className="text-sm font-semibold text-green-600">
                                    ₦{amountPaid.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="text-sm font-medium text-gray-900">Balance</span>
                                <span className={`text-lg font-bold ${balance <= 0 ? 'text-green-600' : 'text-orange-600'
                                    }`}>
                                    ₦{balance.toLocaleString()}
                                </span>
                            </div>

                            {/* Payment Status Badge */}
                            <div className="pt-4">
                                <span className={`w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg ${order.paymentStatus === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-800'
                                    : order.paymentStatus === 'PARTIALLY_PAID'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {order.paymentStatus === 'CONFIRMED' && <CheckCircle className="h-4 w-4 mr-2" />}
                                    {order.paymentStatus === 'PARTIALLY_PAID' && <Clock className="h-4 w-4 mr-2" />}
                                    {order.paymentStatus === 'PENDING' && <AlertCircle className="h-4 w-4 mr-2" />}
                                    {order.paymentStatus}
                                </span>
                            </div>

                            {/* Confirm Payment Button (Admin only) */}
                            {order.paymentStatus !== 'CONFIRMED' && balance <= 0 && (
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => confirmPaymentMutation.mutate()}
                                    disabled={confirmPaymentMutation.isPending}
                                >
                                    {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Order Timeline</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Created</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                {order.paymentConfirmedAt && (
                                    <div className="flex items-start space-x-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">Payment Confirmed</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(order.paymentConfirmedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start space-x-3">
                                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Last Updated</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(order.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Record Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Record Payment"
            >
                <form onSubmit={handleRecordPayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (₦)
                        </label>
                        <Input
                            type="number"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            max={balance}
                            min={0}
                            step="0.01"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Remaining balance: ₦{balance.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                        </label>
                        <select
                            value={paymentData.paymentMethod}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="CASH">Cash</option>
                            <option value="TRANSFER">Bank Transfer</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="POS">POS</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference (Optional)
                        </label>
                        <Input
                            type="text"
                            value={paymentData.reference}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                            placeholder="Transaction reference or cheque number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paid By
                        </label>
                        <Input
                            type="text"
                            value={paymentData.paidBy}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, paidBy: e.target.value }))}
                            placeholder="Customer name or representative"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Additional notes about the payment"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPaymentModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={recordPaymentMutation.isPending}
                        >
                            {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};