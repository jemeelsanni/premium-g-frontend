/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/TransportOrderDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Edit,
    Truck,
    User,
    MapPin,
    Calendar,
    DollarSign,
    Package,
    Route,
    Download
} from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { TransportOrderStatus } from '../../types/transport';
import { globalToast } from '../../components/ui/Toast';
import { StatusUpdateDropdown } from '../../components/transport/StatusUpdateDropdown';
// import { OrderStatusBadge } from '../../components/transport/OrderStatusBadge';

export const TransportOrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [newStatus, setNewStatus] = useState<TransportOrderStatus | ''>('');

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['transport-order', id],
        queryFn: () => transportService.getOrder(id!),
        enabled: Boolean(id),
    });

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            const blob = await transportService.exportOrderToPDF(id!);

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `transport-order-${order?.orderNumber || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            globalToast.success('Order exported to PDF successfully');
        } catch (error) {
            globalToast.error('Failed to export order to PDF');
            console.error('Export error:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };


    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
            transportService.updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-order', id] });
            queryClient.invalidateQueries({ queryKey: ['transport-orders'] });
            globalToast.success('Order status updated successfully!');
            setIsStatusModalOpen(false);
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update order status');
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
            case 'IN_TRANSIT':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'PENDING':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'CANCELLED':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getStatusOptions = (currentStatus: string) => {
        const statusFlow = {
            'PENDING': ['IN_TRANSIT', 'CANCELLED'],
            'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
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
                <Button onClick={() => navigate('/transport/orders')} className="mt-4">
                    Back to Orders
                </Button>
            </div>
        );
    }

    const availableStatusOptions = getStatusOptions(order.deliveryStatus);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            Transport Order #{order.orderNumber}
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
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={isExportingPDF}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                    </Button>
                    <Link to={`/transport/orders/${order.id}/edit`}>
                        <Button className="inline-flex items-center">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Order Status */}
            <div className="flex items-center space-x-3">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Delivery Status</p>
                    <StatusUpdateDropdown
                        orderId={order.id}
                        currentStatus={order.deliveryStatus}
                    />
                </div>

                {/* Optional: Add Edit and Delete buttons */}
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/transport/orders/${id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/transport/orders')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Client Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Client Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Client Name</label>
                            <p className="mt-1 text-sm text-gray-900 font-medium">{order.clientName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Order Amount</label>
                            <p className="mt-1 text-lg font-bold text-gray-900 flex items-center">
                                <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                                ₦{order.totalOrderAmount.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Order Date</label>
                            <p className="mt-1 text-sm text-gray-900 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transport Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <Truck className="h-5 w-5 mr-2" />
                            Transport Information
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {order.truck ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Assigned Truck</label>
                                    <p className="mt-1 text-sm text-gray-900 bg-blue-100 text-blue-800 px-3 py-1 rounded-full inline-block">
                                        {order.truck.plateNumber}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Truck Capacity</label>
                                    <p className="mt-1 text-sm text-gray-900">{order.truck.capacity.toLocaleString()} kg</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No truck assigned yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Route Information */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Route className="h-5 w-5 mr-2" />
                        Route Information
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Pickup Location */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                <h4 className="text-sm font-medium text-gray-900">Pickup Location</h4>
                            </div>
                            <div className="pl-6">
                                <p className="text-sm text-gray-600 flex items-start">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                                    {order.pickupLocation}
                                </p>
                            </div>
                        </div>

                        {/* Delivery Location */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                <h4 className="text-sm font-medium text-gray-900">Delivery Location</h4>
                            </div>
                            <div className="pl-6">
                                <p className="text-sm text-gray-600 flex items-start">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-red-500" />
                                    {order.deliveryLocation}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Route Visualization */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Route Overview</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">Start</span>
                            </div>
                            <div className="flex-1 mx-4">
                                <div className="border-t-2 border-dashed border-gray-300 relative">
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <Truck className="h-5 w-5 text-blue-600 bg-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-xs text-gray-600">End</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Order Timeline</h3>
                </div>
                <div className="p-6">
                    <div className="flow-root">
                        <ul className="-mb-8">
                            <li>
                                <div className="relative pb-8">
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                <Package className="h-4 w-4 text-white" />
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Order created by{' '}
                                                    <span className="font-medium text-gray-900">
                                                        {order.createdBy || 'System'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    {order.deliveryStatus !== 'PENDING' && (
                                        <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                                    )}
                                </div>
                            </li>

                            {(order.deliveryStatus === 'IN_TRANSIT' || order.deliveryStatus === 'DELIVERED') && (
                                <li>
                                    <div className="relative pb-8">
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                    <Truck className="h-4 w-4 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Order is <span className="font-medium text-gray-900">in transit</span>
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    {new Date(order.updatedAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        {order.deliveryStatus === 'DELIVERED' && (
                                            <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></div>
                                        )}
                                    </div>
                                </li>
                            )}

                            {order.deliveryStatus === 'DELIVERED' && (
                                <li>
                                    <div className="relative pb-8">
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                                    <MapPin className="h-4 w-4 text-white" />
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Order <span className="font-medium text-gray-900">delivered</span> successfully
                                                    </p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    {new Date(order.updatedAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )}
                        </ul>
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
                            Current Status:{' '}
                            <span className={getStatusBadge(order.deliveryStatus)}>
                                {order.deliveryStatus.replace('_', ' ')}
                            </span>
                        </label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as TransportOrderStatus)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">Select new status</option>
                            {availableStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status.replace('_', ' ')}
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