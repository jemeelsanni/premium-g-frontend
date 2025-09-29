/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Edit,
    Package,
    User,
    MapPin,
    Phone,
    Mail,
    Calendar,
    FileText
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'react-hot-toast';

type OrderStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

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
            setNewStatus('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update order status');
        },
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
            case 'APPROVED':
                return `${baseClasses} bg-purple-100 text-purple-800`;
            case 'PENDING':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            case 'CANCELLED':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
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
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Order not found</p>
                    <Button onClick={() => navigate('/distribution/orders')} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const statusOptions: OrderStatus[] = ['PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/distribution/orders')}
                            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold leading-7 text-gray-900">
                                Order #{order.orderNo}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Created on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsStatusModalOpen(true)}
                    >
                        Update Status
                    </Button>
                    <Link to={`/distribution/orders/${order.id}/edit`}>
                        <Button>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Order Status */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
                    <span className={getStatusBadge(order.status)}>
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Customer Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Customer Information
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Name:</span>
                            <p className="text-gray-900">{order.customer?.name || 'N/A'}</p>
                        </div>
                        {order.customer?.email && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Email:</span>
                                <p className="text-gray-900 flex items-center">
                                    <Mail className="h-4 w-4 mr-2" />
                                    {order.customer.email}
                                </p>
                            </div>
                        )}
                        {order.customer?.phone && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Phone:</span>
                                <p className="text-gray-900 flex items-center">
                                    <Phone className="h-4 w-4 mr-2" />
                                    {order.customer.phone}
                                </p>
                            </div>
                        )}
                        {order.customer?.address && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Address:</span>
                                <p className="text-gray-900">{order.customer.address}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Delivery Information
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Location:</span>
                            <p className="text-gray-900">{order.location?.name || 'N/A'}</p>
                        </div>
                        {order.location?.address && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Address:</span>
                                <p className="text-gray-900">{order.location.address}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-sm font-medium text-gray-500">Order Date:</span>
                            <p className="text-gray-900 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        {order.remark && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">Remark:</span>
                                <p className="text-gray-900 flex items-start">
                                    <FileText className="h-4 w-4 mr-2 mt-0.5" />
                                    {order.remark}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Order Items
                </h3>
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
                            {order.orderItems?.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.product?.name || `Product ${item.productId}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.pallets || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.packs || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₦{(item.amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Order Summary */}
                <div className="mt-6 flex justify-end">
                    <div className="w-64">
                        <div className="flex justify-between py-2 border-t border-gray-200">
                            <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                            <span className="text-lg font-bold text-gray-900">
                                ₦{(order.totalAmount || 0).toLocaleString()}
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
                        <label className="block text-sm font-medium text-gray-700">
                            Select New Status
                        </label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Select status...</option>
                            {statusOptions.map((status) => (
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
                            disabled={!newStatus || updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};