/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/OrderDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Edit,
    Package,
    User,
    MapPin,
    DollarSign,
    Phone,
    Mail,
    Building
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { OrderStatus } from '../../types/distribution';
import { toast } from 'react-hot-toast';

export const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionService.getOrder(id!),
        enabled: Boolean(id),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
            distributionService.updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distribution-order', id] });
            queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
            toast.success('Order status updated successfully!');
            setIsStatusModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update order status');
        }
    });

    const handleStatusUpdate = () => {
        if (newStatus && id) {
            updateStatusMutation.mutate({ orderId: id, status: newStatus });
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = 'inline-flex px-3 py-1 text-sm font-semibold rounded-full';
        switch (status) {
            case 'DELIVERED':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'SHIPPED':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'PROCESSING':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'PENDING':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            case 'CANCELLED':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getStatusOptions = (currentStatus: string) => {
        const statusFlow = {
            'PENDING': ['PROCESSING', 'CANCELLED'],
            'PROCESSING': ['SHIPPED', 'CANCELLED'],
            'SHIPPED': ['DELIVERED'],
            'DELIVERED': [],
            'CANCELLED': []
        };
        return statusFlow[currentStatus as keyof typeof statusFlow] || [];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Failed to load order details</p>
                <Button onClick={() => navigate('/distribution/orders')} className="mt-4">
                    Back to Orders
                </Button>
            </div>
        );
    }

    const availableStatusOptions = getStatusOptions(order.status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/distribution/orders')}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            Order #{order.orderNumber}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Created on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    {availableStatusOptions.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setIsStatusModalOpen(true)}
                        >
                            Update Status
                        </Button>
                    )}
                    <Link to={`/distribution/orders/${order.id}/edit`}>
                        <Button className="inline-flex items-center">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Order Status */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
                            <p className="text-sm text-gray-500">Current status of this order</p>
                        </div>
                    </div>
                    <span className={getStatusBadge(order.status)}>
                        {order.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Customer Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Customer Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {order.customer ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Company Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{order.customer.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Email</label>
                                        <p className="mt-1 text-sm text-gray-900 flex items-center">
                                            <Mail className="h-4 w-4 mr-1" />
                                            {order.customer.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                                        <p className="mt-1 text-sm text-gray-900 flex items-center">
                                            <Phone className="h-4 w-4 mr-1" />
                                            {order.customer.phone}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Territory</label>
                                    <p className="mt-1 text-sm text-gray-900">{order.customer.territory}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Customer Type</label>
                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                        <Building className="h-4 w-4 mr-1" />
                                        {order.customer.customerType}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">Customer information not available</p>
                        )}
                    </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <MapPin className="h-5 w-5 mr-2" />
                            Delivery Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {order.location ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Location Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{order.location.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Address</label>
                                    <p className="mt-1 text-sm text-gray-900">{order.location.address}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">Location information not available</p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Total Pallets</label>
                                <p className="mt-1 text-sm text-gray-900">{order.totalPallets}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Total Packs</label>
                                <p className="mt-1 text-sm text-gray-900">{order.totalPacks.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                </div>
                <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.orderItems?.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.product?.name || 'Unknown Product'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.quantity.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₦{item.unitPrice.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₦{item.totalPrice.toLocaleString()}
                                    </td>
                                </tr>
                            )) || (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No items found
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            {order.originalAmount !== order.finalAmount && (
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>Original Amount:</span>
                                        <span className="line-through">₦{order.originalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-gray-900">
                                        <span>Final Amount:</span>
                                        <span>₦{order.finalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-xl font-bold text-gray-900">
                                ₦{order.finalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title="Update Order Status"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Status: <span className={getStatusBadge(order.status)}>{order.status}</span>
                        </label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select new status</option>
                            {availableStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsStatusModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStatusUpdate}
                            disabled={!newStatus}
                            loading={updateStatusMutation.isPending}
                        >
                            Update Status
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};