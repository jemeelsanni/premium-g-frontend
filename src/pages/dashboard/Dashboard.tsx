import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { Package, Truck, Warehouse, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { analyticsApi } from '../../api/analytics.api';
import { distributionApi } from '../../api/distribution.api';
import { formatCurrency } from '../../lib/utils';

export const Dashboard = () => {
    const { user } = useAuthStore();

    // Fetch dashboard statistics from health endpoint
    const { data: healthData, isLoading: isLoadingHealth } = useQuery({
        queryKey: ['dashboard-health'],
        queryFn: () => analyticsApi.getDashboardStats(),
    });

    // Fetch recent orders based on user role
    const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: () => distributionApi.getOrders({ limit: 5 }),
        enabled: user?.role ? [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role) : false,
    });

    const isLoading = isLoadingHealth || isLoadingOrders;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const stats = healthData?.data ? [
        {
            name: 'Total Orders',
            value: healthData.data.totalOrders?.toString() || '0',
            icon: Package,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            name: 'Active Deliveries',
            value: healthData.data.activeDeliveries?.toString() || '0',
            icon: Truck,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            name: 'Warehouse Stock',
            value: healthData.data.warehouseStock?.toString() || '0',
            icon: Warehouse,
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            name: 'Total Revenue',
            value: healthData.data.totalRevenue ? formatCurrency(healthData.data.totalRevenue) : formatCurrency(0),
            icon: DollarSign,
            iconColor: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
        },
    ] : [];

    // Safely extract arrays with proper typing
    const recentOrders = Array.isArray(ordersData?.data?.orders) ? ordersData.data.orders : [];
    const recentAuditLogs = Array.isArray(healthData?.data?.recentAuditLogs) ? healthData.data.recentAuditLogs : [];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.username}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Here's what's happening with your business today.
                </p>
            </div>

            {/* Stats Grid */}
            {stats.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600">
                                        {stat.name}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`flex-shrink-0 rounded-full p-3 ${stat.bgColor}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">Unable to load dashboard statistics</p>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Orders */}
                {user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role) && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                        </div>
                        <div className="p-6">
                            {recentOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {recentOrders.slice(0, 5).map((order) => {
                                        const createdAtValue = order.createdAt;
                                        let orderDate = 'N/A';

                                        if (typeof createdAtValue === 'string' && createdAtValue) {
                                            try {
                                                const dateObj = new Date(createdAtValue);
                                                orderDate = new Intl.DateTimeFormat('en-NG', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }).format(dateObj);
                                            } catch {
                                                orderDate = 'N/A';
                                            }
                                        }

                                        return (
                                            <div key={order.id} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <Package className="h-8 w-8 text-gray-400" />
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {order.location?.name || 'N/A'} • {orderDate}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No recent orders</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Recent Audit Logs (Super Admin only) */}
                {user?.role === UserRole.SUPER_ADMIN && recentAuditLogs.length > 0 && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {recentAuditLogs.slice(0, 5).map((log) => {
                                    const createdAtValue = log.createdAt;
                                    let logDate = 'N/A';

                                    if (typeof createdAtValue === 'string' && createdAtValue) {
                                        try {
                                            const dateObj = new Date(createdAtValue);
                                            logDate = new Intl.DateTimeFormat('en-NG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(dateObj);
                                        } catch {
                                            logDate = 'N/A';
                                        }
                                    }

                                    return (
                                        <div key={log.id} className="flex items-start">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {log.action} - {log.entity}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {log.user?.username || 'System'} • {logDate}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions - Only show if user has permissions */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            {user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role) && (
                                <button
                                    onClick={() => window.location.href = '/distribution'}
                                    className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <Package className="h-8 w-8 text-indigo-600" />
                                    <span className="mt-2 text-sm font-medium text-gray-900">Distribution</span>
                                </button>
                            )}

                            {user?.role && [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER].includes(user.role) && (
                                <button
                                    onClick={() => window.location.href = '/warehouse'}
                                    className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <Warehouse className="h-8 w-8 text-indigo-600" />
                                    <span className="mt-2 text-sm font-medium text-gray-900">Warehouse</span>
                                </button>
                            )}

                            {user?.role && [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN].includes(user.role) && (
                                <button
                                    onClick={() => window.location.href = '/transport'}
                                    className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                                >
                                    <Truck className="h-8 w-8 text-indigo-600" />
                                    <span className="mt-2 text-sm font-medium text-gray-900">Transport</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};