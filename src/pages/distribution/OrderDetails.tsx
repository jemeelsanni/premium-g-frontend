// src/pages/distribution/OrderDetails.tsx

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
    AlertCircle,
    Truck,
    FileDown,
    Lock,
    Edit,
    Building2
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { UpdateSupplierStatusModal } from '../../components/distribution/UpdateSupplierStatusModal';
import { RecordDeliveryModal } from '../../components/distribution/RecordDeliveryModal';
import { PaySupplierModal } from '../../components/distribution/PaySupplierModal';
import { AssignTransportModal } from '../../components/distribution/AssignTransportModal';
import { PriceAdjustmentModal } from '@/components/distribution/PriceAdjustmentModal';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/utils/dateUtils';

export const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // State management
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isSupplierStatusModalOpen, setIsSupplierStatusModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isPaySupplierModalOpen, setIsPaySupplierModalOpen] = useState(false);
    const [isAssignTransportModalOpen, setIsAssignTransportModalOpen] = useState(false);
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const [paymentData, setPaymentData] = useState({
        amount: 0,
        paymentMethod: 'CASH',
        reference: '',
        paidBy: '',
        receivedBy: '',
        notes: ''
    });

    // Data fetching
    const { data: orderResponse, isLoading } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionService.getOrder(id!),
        enabled: !!id,
    });

    const { data: paymentSummary } = useQuery({
        queryKey: ['order-payments', id],
        queryFn: () => distributionService.getPaymentHistory(id!),
        enabled: !!id,
    });

    // Mutations
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

    // Helper functions
    const resetPaymentForm = () => {
        setPaymentData({
            amount: 0,
            paymentMethod: 'CASH',
            reference: '',
            paidBy: '',
            receivedBy: '',
            notes: ''
        });
    };

    const handleRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentData.receivedBy) {
            toast.error('Received By is required');
            return;
        }
        recordPaymentMutation.mutate({
            orderId: id!,
            ...paymentData
        });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Extract data from API response
    const order = (orderResponse as any)?.data?.order || (orderResponse as any)?.data || orderResponse;
    const payments = (paymentSummary as any)?.data?.customerPayments || (paymentSummary as any)?.customerPayments || [];

    // Not found state
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

    // Calculate values
    const balance = parseFloat(order.balance || 0);
    const canConfirmPayment = order.paymentStatus === 'PENDING' && balance === 0;

    const handleExportOrderPDF = async () => {
        setIsExportingPDF(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/v1/distribution/orders/${id}/export/pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `order-${order.orderNumber || order.id.slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Order exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export order');
        } finally {
            setIsExportingPDF(false);
        }
    };

    // ✅ FIXED: Use correct role value that matches your enum
    // TODO: Replace with actual user role from auth context/state
    const userRole = 'SUPER_ADMIN'; // or 'DISTRIBUTION_ADMIN'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/distribution/orders')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Order #{order.id?.slice(-8)}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Created on {formatDate(order.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleExportOrderPDF}
                        disabled={isExportingPDF}
                        variant="outline"
                        className="flex items-center"
                    >
                        <FileDown className="h-4 w-4 mr-2" />
                        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                    </Button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'DELIVERED' || order.status === 'PARTIALLY_DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'PROCESSING' || order.status === 'PROCESSING_BY_SUPPLIER'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'PENDING' || order.status === 'PAYMENT_CONFIRMED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status}
                    </span>
                </div>
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
                            {order.customer?.phone || 'No phone'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {order.customer?.email || 'No email'}
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
                            {order.location?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                            {order.deliveryLocation || 'No specific location'}
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Package className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Pallets:</span>
                            <span className="text-sm font-medium">{order.totalPallets}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Packs:</span>
                            <span className="text-sm font-medium">{order.totalPacks}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Created:</span>
                            <span className="text-sm font-medium">
                                {formatDate(order.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Supplier Information */}
            {order.supplierCompany && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Supplier Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Company Name</p>
                            <p className="text-sm font-medium text-gray-900">{order.supplierCompany.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Code</p>
                            <p className="text-sm font-medium text-gray-900">{order.supplierCompany.code}</p>
                        </div>
                        {order.supplierCompany.contactPerson && (
                            <div>
                                <p className="text-sm text-gray-500">Contact Person</p>
                                <p className="text-sm font-medium text-gray-900">{order.supplierCompany.contactPerson}</p>
                            </div>
                        )}
                        {order.supplierCompany.email && (
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{order.supplierCompany.email}</p>
                            </div>
                        )}
                        {order.supplierCompany.phone && (
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{order.supplierCompany.phone}</p>
                            </div>
                        )}
                        {order.supplierCompany.paymentTerms && (
                            <div>
                                <p className="text-sm text-gray-500">Payment Terms</p>
                                <p className="text-sm font-medium text-gray-900">{order.supplierCompany.paymentTerms}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.orderItems?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.product?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.pallets}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.packs}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₦{parseFloat(item.amount?.toString() || '0').toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Order Amount:</span>
                        <span className="font-semibold text-gray-900">
                            ₦{order.finalAmount?.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-semibold text-green-600">
                            ₦{order.amountPaid?.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-gray-600 font-medium">Balance:</span>
                        <span className={`font-bold text-lg ${balance > 0
                            ? 'text-red-600' : 'text-green-600'}`}>
                            ₦{balance.toLocaleString()}
                        </span>
                    </div>
                </div>

                {order.paymentStatus === 'CONFIRMED' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">CONFIRMED</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                    {/* Record Payment Button */}
                    {order.paymentStatus === 'PENDING' && balance > 0 && (
                        <Button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Payment
                        </Button>
                    )}

                    {/* Confirm Payment Button */}
                    {canConfirmPayment && (
                        <Button
                            onClick={() => confirmPaymentMutation.mutate()}
                            disabled={confirmPaymentMutation.isPending}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                        </Button>
                    )}

                    {/* ✨ CORRECTED: Adjust Price Button - Shows when admin AND payment confirmed */}
                    {(['SUPER_ADMIN', 'DISTRIBUTION_ADMIN'].includes(userRole)) &&
                        order?.paymentStatus === 'CONFIRMED' && (
                            <>
                                <Button
                                    onClick={() => setShowAdjustmentModal(true)}
                                    disabled={!!order?.orderRaisedByRFL}
                                    className={`w-full ${order?.orderRaisedByRFL
                                        ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                                        : 'bg-orange-600 hover:bg-orange-700'
                                        }`}
                                    title={
                                        order?.orderRaisedByRFL
                                            ? 'Price adjustment not allowed - Order already raised by Rite Foods'
                                            : 'Adjust order price'
                                    }
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Adjust Price
                                    {order?.orderRaisedByRFL && (
                                        <Lock className="h-4 w-4 ml-2" />
                                    )}
                                </Button>

                                {/* ✨ Info message when adjustment is disabled */}
                                {order?.orderRaisedByRFL && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-medium">Price Adjustment Locked</p>
                                            <p className="mt-1">
                                                This order was raised by Rite Foods on{' '}
                                                <strong>
                                                    {order?.orderRaisedAt
                                                        ? formatDate(order.orderRaisedAt)
                                                        : 'N/A'}
                                                </strong>.
                                                Price adjustments are no longer permitted.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                </div>
            </div>

            {/* Rest of the component remains the same... */}
            {/* Price Adjustment History, Rite Foods section, Delivery section, Payment History, and Modals */}
            {/* (Keep all remaining code from the original file) */}

            {/* Price Adjustment History */}
            {order?.priceAdjustments && order.priceAdjustments.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Price Adjustment History</h3>
                    <div className="space-y-3">
                        {order.priceAdjustments.map((adjustment: any) => (
                            <div key={adjustment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-medium text-gray-700">Original: </span>
                                        <span className="line-through text-gray-600">
                                            ₦{parseFloat(adjustment.originalAmount).toLocaleString()}
                                        </span>
                                        <span className="mx-2 text-gray-400">→</span>
                                        <span className="font-medium text-gray-700">New: </span>
                                        <span className="text-green-600 font-semibold">
                                            ₦{parseFloat(adjustment.adjustedAmount).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(adjustment.createdAt)}
                                    </span>
                                </div>
                                <div className="text-sm mt-2">
                                    <strong className="text-gray-700">Reason:</strong>
                                    <p className="text-gray-600 mt-1">{adjustment.reason}</p>
                                </div>
                                {adjustment.riteFoodsInvoiceReference && (
                                    <div className="text-sm text-gray-600 mt-1">
                                        <strong>Invoice Ref:</strong> {adjustment.riteFoodsInvoiceReference}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Rite Foods & Delivery Actions */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Management</h3>

                {/* Supplier Payment & Status Section */}
                <div className="border-b pb-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700">
                                {order.supplierCompany?.name || 'Supplier'} Payment
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Payment Status: <span className="font-medium">
                                    {order.paidToSupplier ? '✓ Paid' : 'Not Paid'}
                                </span>
                            </p>
                            {order.paidToSupplier && (
                                <p className="text-xs text-gray-500">
                                    Supplier Status: <span className="font-medium">{order.supplierStatus}</span>
                                </p>
                            )}
                        </div>

                        {!order.paidToSupplier && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPaySupplierModalOpen(true)}
                                disabled={order.paymentStatus !== 'CONFIRMED'}
                                className="flex items-center"
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Pay {order.supplierCompany?.name || 'Supplier'}
                            </Button>
                        )}

                        {order.paidToSupplier && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSupplierStatusModalOpen(true)}
                                className="flex items-center"
                            >
                                <Package className="h-4 w-4 mr-2" />
                                Update {order.supplierCompany?.name || 'Supplier'} Status
                            </Button>
                        )}
                    </div>

                    {!order.paidToSupplier && order.paymentStatus !== 'CONFIRMED' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
                            <p className="text-yellow-800">
                                ⚠️ Customer payment must be confirmed before paying {order.supplierCompany?.name || 'supplier'}
                            </p>
                        </div>
                    )}

                    {order.paidToSupplier && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-xs">
                            <p className="text-green-800">
                                ✓ Payment sent to {order.supplierCompany?.name || 'supplier'} on {formatDate(order.paymentDateToSupplier)}
                            </p>
                            {order.supplierOrderNumber && (
                                <p className="text-green-800 mt-1">
                                    Order #: {order.supplierOrderNumber}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Delivery Status Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700">Delivery Status</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Current: <span className="font-medium">{order.deliveryStatus || 'PENDING'}</span>
                            </p>
                            {order.transporterCompany && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Transport: {order.transporterCompany}
                                </p>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            {!order.transporterCompany && order.supplierStatus === 'LOADED' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAssignTransportModalOpen(true)}
                                    className="flex items-center"
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Assign Transport
                                </Button>
                            )}

                            {order.transporterCompany && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsDeliveryModalOpen(true)}
                                    disabled={order.deliveryStatus === 'FULLY_DELIVERED'}
                                    className="flex items-center"
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Record Delivery
                                </Button>
                            )}
                        </div>
                    </div>

                    {!order.transporterCompany && order.supplierStatus !== 'LOADED' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
                            <p className="text-yellow-800">
                                ⚠️ Supplier status must be LOADED before assigning transport
                            </p>
                        </div>
                    )}

                    {order.transporterCompany && order.deliveryStatus === 'PENDING' && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                            <p className="text-blue-800">
                                🚚 Transport assigned - Ready to record delivery
                            </p>
                        </div>
                    )}

                    {order.deliveryStatus === 'FULLY_DELIVERED' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-xs">
                            <p className="text-green-800">
                                ✓ Delivery has been completed
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
                {payments.length === 0 ? (
                    <p className="text-sm text-gray-500">No payment history</p>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment: any) => (
                            <div key={payment.id} className="border-b pb-3 last:border-b-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            ₦{parseFloat(payment.amount?.toString() || '0').toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {payment.method}
                                        </p>
                                        {payment.reference && (
                                            <p className="text-xs text-gray-500">
                                                Ref: {payment.reference}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            {formatDate(payment.date)}
                                        </p>
                                        {payment.receivedBy && (
                                            <p className="text-xs text-gray-500">
                                                By: {payment.receivedBy}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
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
                            onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
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
                            <option value="WHATSAPP_TRANSFER">WhatsApp Transfer</option>
                            <option value="POS">POS</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
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
                            placeholder="Transaction reference"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Paid By
                        </label>
                        <Input
                            type="text"
                            value={paymentData.paidBy}
                            onChange={(e) => setPaymentData({ ...paymentData, paidBy: e.target.value })}
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
                            placeholder="Your name"
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

            <UpdateSupplierStatusModal
                isOpen={isSupplierStatusModalOpen}
                onClose={() => setIsSupplierStatusModalOpen(false)}
                orderId={order.id}
                currentStatus={order.supplierStatus}
                supplierName={order.supplierCompany?.name}
            />

            <RecordDeliveryModal
                isOpen={isDeliveryModalOpen}
                onClose={() => setIsDeliveryModalOpen(false)}
                orderId={order.id}
                totalPallets={order.totalPallets}
                totalPacks={order.totalPacks}
            />

            <PaySupplierModal
                isOpen={isPaySupplierModalOpen}
                onClose={() => setIsPaySupplierModalOpen(false)}
                orderId={order.id}
                amount={parseFloat(order.finalAmount?.toString() || '0')}
                supplierName={order.supplierCompany?.name}
            />

            <AssignTransportModal
                isOpen={isAssignTransportModalOpen}
                onClose={() => setIsAssignTransportModalOpen(false)}
                orderId={order.id}
            />

            {showAdjustmentModal && (
                <PriceAdjustmentModal
                    orderId={order.id}
                    currentAmount={order.finalAmount}
                    onClose={() => setShowAdjustmentModal(false)}
                />
            )}
        </div>
    );
};