/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    DollarSign,
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
import { DistributionOrder } from '../../types';

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
        receivedBy: '',  // ✅ Add receivedBy field
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
            receivedBy: '',  // ✅ Add receivedBy field
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

    // ✅ FIX: Handle potentially nested API response structure
    // Backend might return { data: { order: {...} } } or just the order directly
    let order: DistributionOrder | null = null;

    if (orderResponse) {
        // Check if response has nested data.order structure
        if ((orderResponse as any).data?.order) {
            order = (orderResponse as any).data.order;
        } else if ((orderResponse as any).data) {
            order = (orderResponse as any).data;
        } else {
            // Response is the order directly
            order = orderResponse as any;
        }
    }

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

    // ✅ FIX: Safely handle payment-related fields that might not exist in type
    const balance = parseFloat((order as any).balance || 0);
    const amountPaid = parseFloat((order as any).amountPaid || 0);
    const totalAmount = parseFloat((order as any).finalAmount || order.finalAmount || 0);
    const paymentStatus = (order as any).paymentStatus || 'PENDING';

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
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                    }`}>
                    {order.status}
                </span>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Customer Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Customer</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                            {order.customer?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {(order.customer as any)?.phone || 'No phone'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {(order.customer as any)?.email || 'No email'}
                        </p>
                    </div>
                </div>

                {/* Location Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Location</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                            {(order.location as any)?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {(order.location as any)?.address || 'No address'}
                        </p>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Package className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Pallets:</span>
                            <span className="font-medium">{order.totalPallets || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Packs:</span>
                            <span className="font-medium">{order.totalPacks || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pallets
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Packs
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.orderItems?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {item.product?.name || 'Unknown Product'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.pallets || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.packs || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                        ₦{parseFloat(item.amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                        <span className={`w-full flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg ${paymentStatus === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : paymentStatus === 'PARTIAL'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}>
                            {paymentStatus === 'CONFIRMED' && <CheckCircle className="h-4 w-4 mr-2" />}
                            {paymentStatus === 'PENDING' && <Clock className="h-4 w-4 mr-2" />}
                            {paymentStatus}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={balance <= 0}
                            className="flex-1"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Payment
                        </Button>
                        {paymentStatus !== 'CONFIRMED' && balance <= 0 && (
                            <Button
                                size="sm"
                                onClick={() => confirmPaymentMutation.mutate()}
                                className="flex-1"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Payment
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                </div>
                <div className="p-6">
                    {payments.length > 0 ? (
                        <div className="space-y-4">
                            {payments.map((payment: any) => (
                                <div
                                    key={payment.id}
                                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            ₦{parseFloat(payment.amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {payment.paymentMethod} • {new Date(payment.createdAt).toLocaleString()}
                                        </p>
                                        {payment.reference && (
                                            <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        By {payment.paidBy || 'Unknown'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">
                            No payment history available
                        </p>
                    )}
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
                        <label className="block text-sm font-medium text-gray-700">
                            Amount *
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={paymentData.amount}
                            onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
                            required
                            className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Outstanding balance: ₦{balance.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Payment Method *
                        </label>
                        <select
                            value={paymentData.paymentMethod}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CHECK">Check</option>
                            <option value="POS">POS</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Reference
                        </label>
                        <Input
                            type="text"
                            value={paymentData.reference}
                            onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Paid By *
                        </label>
                        <Input
                            type="text"
                            value={paymentData.paidBy}
                            onChange={(e) => setPaymentData({ ...paymentData, paidBy: e.target.value })}
                            required
                            placeholder="Name of person who paid"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Received By *
                        </label>
                        <Input
                            type="text"
                            value={paymentData.receivedBy}
                            onChange={(e) => setPaymentData({ ...paymentData, receivedBy: e.target.value })}
                            required
                            placeholder="Name of person who received payment"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Notes
                        </label>
                        <textarea
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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