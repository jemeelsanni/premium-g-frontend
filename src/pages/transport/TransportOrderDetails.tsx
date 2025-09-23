/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi, UpdateTransportOrderData } from '../../api/transport.api';
import { ArrowLeft, Edit, Save, X, Truck, DollarSign, Fuel, TrendingUp } from 'lucide-react';

export const TransportOrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<UpdateTransportOrderData>({});

    const { data, isLoading } = useQuery({
        queryKey: ['transport-order', id],
        queryFn: () => transportApi.getOrderById(id!),
        enabled: !!id,
    });

    const order = data?.data?.order;

    const updateMutation = useMutation({
        mutationFn: (updateData: UpdateTransportOrderData) =>
            transportApi.updateOrder(id!, updateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transport-order', id] });
            setIsEditing(false);
            alert('Order updated successfully');
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'Failed to update order');
        },
    });

    const handleUpdate = () => {
        updateMutation.mutate(editData);
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            IN_TRANSIT: 'bg-purple-100 text-purple-800',
            DELIVERED: 'bg-green-100 text-green-800',
            PARTIALLY_DELIVERED: 'bg-orange-100 text-orange-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading order details...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Order not found</div>
            </div>
        );
    }

    // Convert all decimal fields to numbers
    const totalOrderAmount = Number(order.totalOrderAmount || 0);
    const totalFuelCost = Number(order.totalFuelCost || 0);
    const serviceChargeExpense = Number(order.serviceChargeExpense || 0);
    const driverWages = Number(order.driverWages || 0);
    const truckExpenses = Number(order.truckExpenses || 0);
    const totalExpenses = Number(order.totalExpenses || 0);
    const grossProfit = Number(order.grossProfit || 0);
    const netProfit = Number(order.netProfit || 0);
    const profitMargin = Number(order.profitMargin || 0);
    const fuelRequired = Number(order.fuelRequired || 0);
    const fuelPricePerLiter = Number(order.fuelPricePerLiter || 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/transport/orders')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Transport Order Details</h1>
                        <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditData({});
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            Order Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Order Number</p>
                                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                            </div>
                            {order.invoiceNumber && (
                                <div>
                                    <p className="text-sm text-gray-600">Invoice Number</p>
                                    <p className="font-semibold text-gray-900">{order.invoiceNumber}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-semibold text-gray-900">{order.location?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                {isEditing ? (
                                    <select
                                        className="mt-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                        value={editData.deliveryStatus || order.deliveryStatus}
                                        onChange={(e) => setEditData({ ...editData, deliveryStatus: e.target.value })}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="IN_TRANSIT">In Transit</option>
                                        <option value="DELIVERED">Delivered</option>
                                        <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                ) : (
                                    <div className="mt-1">{getStatusBadge(order.deliveryStatus)}</div>
                                )}
                            </div>
                            {order.driverDetails && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">Driver Details</p>
                                    {isEditing ? (
                                        <textarea
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                                            value={editData.driverDetails || order.driverDetails}
                                            onChange={(e) => setEditData({ ...editData, driverDetails: e.target.value })}
                                            rows={2}
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-900 whitespace-pre-wrap">{order.driverDetails}</p>
                                    )}
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Created Date</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {order.deliveryDate && (
                                <div>
                                    <p className="text-sm text-gray-600">Delivery Date</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(order.deliveryDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Financial Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b">
                                <span className="text-gray-600">Total Revenue</span>
                                <span className="text-lg font-bold text-gray-900">
                                    ₦{totalOrderAmount.toLocaleString()}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Expenses Breakdown:</p>
                                <div className="pl-4 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Fuel Cost ({fuelRequired}L @ ₦{fuelPricePerLiter}/L)</span>
                                        <span className="text-gray-900">₦{totalFuelCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service Charges</span>
                                        <span className="text-gray-900">₦{serviceChargeExpense.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Driver Wages</span>
                                        <span className="text-gray-900">₦{driverWages.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Truck Expenses</span>
                                        <span className="text-gray-900">₦{truckExpenses.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="font-medium text-gray-700">Total Expenses</span>
                                <span className="text-lg font-bold text-red-600">
                                    -₦{totalExpenses.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="font-medium text-gray-700">Gross Profit</span>
                                <span className="text-lg font-bold text-green-600">
                                    ₦{grossProfit.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Net Profit</span>
                                <span className="text-xl font-bold text-green-700">
                                    ₦{netProfit.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Profit Margin</span>
                                <span className="text-xl font-bold text-indigo-600">
                                    {profitMargin.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <Fuel className="w-8 h-8 text-blue-600" />
                                <div>
                                    <p className="text-xs text-blue-600">Fuel Efficiency</p>
                                    <p className="font-bold text-blue-900">{fuelRequired}L</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="text-xs text-green-600">Profit Margin</p>
                                    <p className="font-bold text-green-900">{profitMargin.toFixed(2)}%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                <DollarSign className="w-8 h-8 text-purple-600" />
                                <div>
                                    <p className="text-xs text-purple-600">Revenue/Expense Ratio</p>
                                    <p className="font-bold text-purple-900">
                                        {totalExpenses > 0
                                            ? (totalOrderAmount / totalExpenses).toFixed(2)
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {order.createdByUser && (
                            <div className="mt-6 pt-6 border-t">
                                <p className="text-sm text-gray-600">Created By</p>
                                <p className="font-semibold text-gray-900">{order.createdByUser.username}</p>
                                <p className="text-xs text-gray-500">{order.createdByUser.role}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};