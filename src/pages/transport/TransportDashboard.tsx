/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { Truck, DollarSign, TrendingUp, Package, Fuel, Users } from 'lucide-react';
import { transportApi } from '../../api/transport.api';
import { Link } from 'react-router-dom';

export const TransportDashboard = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['transport-analytics'],
        queryFn: () => transportApi.getAnalytics(),
    });

    // Debug: Log the entire response
    console.log('Transport Analytics Response:', data);

    // Safely extract analytics data
    const analyticsData = data?.data;

    const stats = [
        {
            title: 'Total Orders',
            value: String(analyticsData?.totalOrders || 0),
            icon: Package,
            color: 'bg-blue-500',
        },
        {
            title: 'Total Revenue',
            value: `₦${Number(analyticsData?.financialSummary?.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-green-500',
        },
        {
            title: 'Net Profit',
            value: `₦${Number(analyticsData?.financialSummary?.netProfit || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-indigo-500',
        },
        {
            title: 'Profit Margin',
            value: `${Number(analyticsData?.financialSummary?.overallMargin || 0).toFixed(2)}%`,
            icon: TrendingUp,
            color: 'bg-purple-500',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        console.error('Transport Analytics Error:', error);
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error loading dashboard data</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transport Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage transport orders and track performance</p>
                </div>
                <Link
                    to="/transport/orders/create"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Create Transport Order
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Expense Breakdown */}
            {analyticsData?.expenseBreakdown && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-3">
                            <Fuel className="w-5 h-5 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-600">Fuel Costs</p>
                                <p className="font-semibold text-gray-900">
                                    ₦{Number(analyticsData.expenseBreakdown.fuel || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-600">Driver Wages</p>
                                <p className="font-semibold text-gray-900">
                                    ₦{Number(analyticsData.expenseBreakdown.driverWages || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-600">Service Charges</p>
                                <p className="font-semibold text-gray-900">
                                    ₦{Number(analyticsData.expenseBreakdown.serviceCharges || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Truck className="w-5 h-5 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-600">Truck Expenses</p>
                                <p className="font-semibold text-gray-900">
                                    ₦{Number(analyticsData.expenseBreakdown.truckExpenses || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Status - Only render if we have valid array */}
            {analyticsData?.statusBreakdown && Array.isArray(analyticsData.statusBreakdown) && analyticsData.statusBreakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {analyticsData.statusBreakdown.map((status: any, index: number) => {
                            // Ensure we only render primitive values
                            const statusText = typeof status.deliveryStatus === 'string'
                                ? status.deliveryStatus.toLowerCase().replace('_', ' ')
                                : 'Unknown';
                            const count = Number(status._count || 0);

                            return (
                                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600 capitalize">
                                        {statusText}
                                    </p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Location Performance - Only render if we have valid array */}
            {analyticsData?.locationStats && Array.isArray(analyticsData.locationStats) && analyticsData.locationStats.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Performance</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trips
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Profit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analyticsData.locationStats.map((stat: any, index: number) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {stat.location?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {Number(stat.trips || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₦{Number(stat.revenue || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₦{Number(stat.profit || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    to="/transport/orders"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                    <Package className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">View All Orders</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage transport orders</p>
                </Link>
                <Link
                    to="/transport/trucks"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                    <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">Manage Trucks</h3>
                    <p className="text-sm text-gray-600 mt-1">Fleet management</p>
                </Link>
                <Link
                    to="/transport/analytics"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600 mt-1">View detailed reports</p>
                </Link>
                <Link
                    to="/expenses?module=TRANSPORT"
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow text-center"
                >
                    <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">Expenses</h3>
                    <p className="text-sm text-gray-600 mt-1">Track transport expenses</p>
                </Link>
            </div>
        </div>
    );
};