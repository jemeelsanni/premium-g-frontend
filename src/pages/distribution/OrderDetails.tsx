import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, User, Calendar, DollarSign, FileText } from 'lucide-react';
import { distributionApi } from '../../api/distribution.api';

export const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionApi.getOrderById(id!),
        enabled: !!id,
    });

    const order = data?.data?.order;

    const getStatusBadge = (status: string) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-blue-100 text-blue-800',
            PROCESSING: 'bg-purple-100 text-purple-800',
            IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
            DELIVERED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
            <div className="text-center py-12">
                <p className="text-gray-500">Order not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/distribution/orders')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                    <p className="text-gray-600 mt-1">Order ID: {order.id}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(order.status)}`}>
                    {order.status}
                </span>
            </div>

            {/* Order Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Pallets</p>
                            <p className="text-lg font-semibold text-gray-900">{order.totalPallets}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Package className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Packs</p>
                            <p className="text-lg font-semibold text-gray-900">{order.totalPacks}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-lg font-semibold text-gray-900">₦{order.finalAmount?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Order Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer & Location Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">Customer</p>
                                <p className="font-medium text-gray-900">{order.customer?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="font-medium text-gray-900">{order.location?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600">Created By</p>
                                <p className="font-medium text-gray-900">{order.createdByUser?.username}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transport Info */}
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Transport Information</h2>

                    <div className="space-y-3">
                        {order.transporterCompany && (
                            <div>
                                <p className="text-sm text-gray-600">Transporter Company</p>
                                <p className="font-medium text-gray-900">{order.transporterCompany}</p>
                            </div>
                        )}

                        {order.driverNumber && (
                            <div>
                                <p className="text-sm text-gray-600">Driver Number</p>
                                <p className="font-medium text-gray-900">{order.driverNumber}</p>
                            </div>
                        )}

                        {order.remark && (
                            <div className="flex items-start gap-3">
                                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600">Remark</p>
                                    <p className="font-medium text-gray-900">{order.remark}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pallets
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Packs
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {order.orderItems?.map((item: {
                                id: string;
                                product: { name: string; productNo: string };
                                pallets: number;
                                packs: number;
                                amount: number;
                            }) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.product?.productNo} - {item.product?.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.pallets}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.packs}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        ₦{item.amount?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-indigo-600">
                            ₦{order.finalAmount?.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => navigate(`/distribution/orders/${id}/edit`)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Edit Order
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Print Order
                </button>
            </div>
        </div>
    );
};