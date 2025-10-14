/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import { StatsCard } from '../../components/StatsCard';
import {
    Package,
    Truck,
    Warehouse,
    DollarSign,
    Users,
    ShoppingCart,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface DashboardStats {
    distribution?: {
        totalRevenue: number;
        totalOrders: number;
        totalPacks: number;
        activeCustomers: number;
        recentOrders: any[];
    };
    transport?: {
        totalRevenue: number;
        totalTrips: number;
        activeClients: number;
        netProfit: number;
    };
    warehouse?: {
        totalRevenue: number;
        totalSales: number;
        activeCustomers: number;
        grossProfit: number;
    };
    consolidated?: {
        totalRevenue: number;
        totalProfit: number;
        totalOrders: number;
        totalCustomers: number;
    };
}

export const MainDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({});
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    const hasModuleAccess = (module: 'distribution' | 'transport' | 'warehouse') => {
        const role = user?.role as UserRole;

        switch (module) {
            case 'distribution':
                return [
                    UserRole.SUPER_ADMIN,
                    UserRole.DISTRIBUTION_ADMIN,
                    UserRole.DISTRIBUTION_SALES_REP
                ].includes(role);
            case 'transport':
                return [
                    UserRole.SUPER_ADMIN,
                    UserRole.TRANSPORT_ADMIN,
                    UserRole.TRANSPORT_STAFF
                ].includes(role);
            case 'warehouse':
                return [
                    UserRole.SUPER_ADMIN,
                    UserRole.WAREHOUSE_ADMIN,
                    UserRole.WAREHOUSE_SALES_OFFICER,
                    UserRole.CASHIER
                ].includes(role);
            default:
                return false;
        }
    };

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const data: DashboardStats = {};
                const errorMessages: string[] = [];

                // Fetch Distribution stats
                if (hasModuleAccess('distribution')) {
                    try {
                        console.log('📊 Fetching Distribution stats...');
                        const distResponse = await apiClient.get('/distribution/dashboard/analytics');
                        console.log('✅ Distribution response:', distResponse.data);

                        // Handle different response structures
                        if (distResponse.data.success && distResponse.data.data) {
                            data.distribution = {
                                totalRevenue: distResponse.data.data.totalRevenue || distResponse.data.data.summary?.totalRevenue || 0,
                                totalOrders: distResponse.data.data.totalOrders || distResponse.data.data.summary?.totalOrders || 0,
                                totalPacks: distResponse.data.data.totalPacks || distResponse.data.data.summary?.totalPacks || 0,
                                activeCustomers: distResponse.data.data.activeCustomers || distResponse.data.data.summary?.activeCustomers || 0,
                                recentOrders: distResponse.data.data.recentOrders || []
                            };
                        }
                    } catch (error: any) {
                        console.error('❌ Distribution stats error:', error);
                        errorMessages.push('Distribution data unavailable');
                        data.distribution = {
                            totalRevenue: 0,
                            totalOrders: 0,
                            totalPacks: 0,
                            activeCustomers: 0,
                            recentOrders: []
                        };
                    }
                }

                // Fetch Transport stats
                if (hasModuleAccess('transport')) {
                    try {
                        console.log('📊 Fetching Transport stats...');
                        const transResponse = await apiClient.get('/analytics/transport/summary');
                        console.log('✅ Transport response:', transResponse.data);

                        if (transResponse.data.success && transResponse.data.data) {
                            const summary = transResponse.data.data.summary || transResponse.data.data;
                            data.transport = {
                                totalRevenue: summary.totalRevenue || 0,
                                totalTrips: summary.totalTrips || 0,
                                activeClients: summary.activeClients || 0,
                                netProfit: summary.netProfit || 0
                            };
                        }
                    } catch (error: any) {
                        console.error('❌ Transport stats error:', error);
                        errorMessages.push('Transport data unavailable');
                        data.transport = {
                            totalRevenue: 0,
                            totalTrips: 0,
                            activeClients: 0,
                            netProfit: 0
                        };
                    }
                }

                // Fetch Warehouse stats
                if (hasModuleAccess('warehouse')) {
                    try {
                        console.log('📊 Fetching Warehouse stats...');
                        const whResponse = await apiClient.get('/analytics/warehouse/summary');
                        console.log('✅ Warehouse response:', whResponse.data);

                        if (whResponse.data.success && whResponse.data.data) {
                            const summary = whResponse.data.data.summary || whResponse.data.data;
                            data.warehouse = {
                                totalRevenue: summary.totalRevenue || 0,
                                totalSales: summary.totalSales || 0,
                                activeCustomers: summary.activeCustomers || 0,
                                grossProfit: summary.grossProfit || 0
                            };
                        }
                    } catch (error: any) {
                        console.error('❌ Warehouse stats error:', error);
                        errorMessages.push('Warehouse data unavailable');
                        data.warehouse = {
                            totalRevenue: 0,
                            totalSales: 0,
                            activeCustomers: 0,
                            grossProfit: 0
                        };
                    }
                }

                // Calculate consolidated stats for SUPER_ADMIN
                if (user?.role === UserRole.SUPER_ADMIN) {
                    data.consolidated = {
                        totalRevenue:
                            (data.distribution?.totalRevenue || 0) +
                            (data.transport?.totalRevenue || 0) +
                            (data.warehouse?.totalRevenue || 0),
                        totalProfit:
                            (data.transport?.netProfit || 0) +
                            (data.warehouse?.grossProfit || 0),
                        totalOrders:
                            (data.distribution?.totalOrders || 0) +
                            (data.transport?.totalTrips || 0) +
                            (data.warehouse?.totalSales || 0),
                        totalCustomers:
                            (data.distribution?.activeCustomers || 0) +
                            (data.transport?.activeClients || 0) +
                            (data.warehouse?.activeCustomers || 0)
                    };
                }

                console.log('📊 Final stats:', data);
                setStats(data);
                setErrors(errorMessages);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
                setErrors(['Failed to load dashboard data']);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, [user]);

    const getWelcomeMessage = () => {
        const role = user?.role;
        switch (role) {
            case UserRole.DISTRIBUTION_ADMIN:
                return "Manage distribution operations and track sales targets.";
            case UserRole.DISTRIBUTION_SALES_REP:
                return "Create orders and manage your assigned customers.";
            case UserRole.TRANSPORT_ADMIN:
                return "Oversee transport operations and fleet management.";
            case UserRole.TRANSPORT_STAFF:
                return "Create transport orders and record trip expenses.";
            case UserRole.WAREHOUSE_ADMIN:
                return "Manage inventory, approve expenses, and oversee warehouse operations.";
            case UserRole.WAREHOUSE_SALES_OFFICER:
                return "Record sales and manage warehouse customers.";
            case UserRole.CASHIER:
                return "Handle cash flow operations and transaction recording.";
            case UserRole.SUPER_ADMIN:
                return "Full system access - monitor all business operations across modules.";
            default:
                return "Welcome to Premium G Enterprise Management System.";
        }
    };

    const getModuleLinks = () => {
        const role = user?.role as UserRole;
        const links = [];

        if ([UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(role)) {
            links.push({
                name: 'Distribution',
                href: '/distribution',
                description: 'Manage B2B orders and track sales targets',
                icon: Package,
                color: 'blue',
                stats: stats.distribution ? {
                    revenue: stats.distribution.totalRevenue,
                    orders: stats.distribution.totalOrders,
                    customers: stats.distribution.activeCustomers
                } : null
            });
        }

        if ([UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.TRANSPORT_STAFF].includes(role)) {
            links.push({
                name: 'Transport',
                href: '/transport',
                description: 'Fleet management and trip operations',
                icon: Truck,
                color: 'green',
                stats: stats.transport ? {
                    revenue: stats.transport.totalRevenue,
                    trips: stats.transport.totalTrips,
                    profit: stats.transport.netProfit
                } : null
            });
        }

        if ([UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER, UserRole.CASHIER].includes(role)) {
            links.push({
                name: 'Warehouse',
                href: '/warehouse',
                description: 'Inventory and direct sales management',
                icon: Warehouse,
                color: 'purple',
                stats: stats.warehouse ? {
                    revenue: stats.warehouse.totalRevenue,
                    sales: stats.warehouse.totalSales,
                    profit: stats.warehouse.grossProfit
                } : null
            });
        }

        return links;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-NG').format(num);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const moduleLinks = getModuleLinks();
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold leading-6 text-gray-900">
                    Welcome back, {user?.username}!
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    {getWelcomeMessage()}
                </p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">
                                Some data could not be loaded:
                            </p>
                            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Super Admin Consolidated Stats */}
            {isSuperAdmin && stats.consolidated && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Consolidated Business Overview
                    </h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Total Revenue"
                            value={formatCurrency(stats.consolidated.totalRevenue)}
                            icon={DollarSign}
                            trend={{ value: 0, isPositive: true }}
                            color="green"
                        />
                        <StatsCard
                            title="Net Profit"
                            value={formatCurrency(stats.consolidated.totalProfit)}
                            icon={TrendingUp}
                            trend={{ value: 0, isPositive: true }}
                            color="blue"
                        />
                        <StatsCard
                            title="Total Transactions"
                            value={formatNumber(stats.consolidated.totalOrders)}
                            icon={ShoppingCart}
                            color="purple"
                        />
                        <StatsCard
                            title="Active Customers"
                            value={formatNumber(stats.consolidated.totalCustomers)}
                            icon={Users}
                            color="yellow"
                        />
                    </div>
                </div>
            )}

            {/* Module Cards */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Modules
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {moduleLinks.map((link) => {
                        const IconComponent = link.icon;
                        const colorClasses = {
                            blue: 'bg-blue-50 text-blue-700 border-blue-200',
                            green: 'bg-green-50 text-green-700 border-green-200',
                            purple: 'bg-purple-50 text-purple-700 border-purple-200'
                        };

                        return (
                            <div
                                key={link.name}
                                onClick={() => navigate(link.href)}
                                className="bg-white overflow-hidden shadow rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="p-6">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[link.color as keyof typeof colorClasses]}`}>
                                            <IconComponent className="h-6 w-6" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    {link.name} Module
                                                </dt>
                                                <dd className="flex items-baseline">
                                                    <div className="text-2xl font-semibold text-gray-900">
                                                        {link.stats && link.stats.revenue > 0
                                                            ? formatCurrency(link.stats.revenue)
                                                            : '-'}
                                                    </div>
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600">{link.description}</p>
                                    </div>
                                    {link.stats && (
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    {link.name === 'Distribution' ? 'Orders' :
                                                        link.name === 'Transport' ? 'Trips' : 'Sales'}
                                                </p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {formatNumber(link.stats.orders || link.stats.trips || link.stats.sales || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    {link.name === 'Distribution' || link.name === 'Warehouse' ? 'Customers' : 'Profit'}
                                                </p>
                                                <p className="text-lg font-semibold text-gray-900">
                                                    {link.name === 'Distribution' || link.name === 'Warehouse'
                                                        ? formatNumber(link.stats.customers || 0)
                                                        : formatCurrency(link.stats.profit || 0)
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-50 px-6 py-3">
                                    <div className="text-sm">
                                        <button className="font-medium text-blue-600 hover:text-blue-500">
                                            Go to {link.name} →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>



            {/* Role-Specific Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                </h2>
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Distribution Actions */}
                        {hasModuleAccess('distribution') && (
                            <>
                                {[UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user?.role as UserRole) && (
                                    <button
                                        onClick={() => navigate('/distribution/orders/create')}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Package className="h-5 w-5 text-blue-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Create Order</span>
                                    </button>
                                )}
                                {[UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN].includes(user?.role as UserRole) && (
                                    <button
                                        onClick={() => navigate('/distribution/customers')}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Users className="h-5 w-5 text-blue-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Manage Customers</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* Transport Actions */}
                        {hasModuleAccess('transport') && (
                            <>
                                {[UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN, UserRole.TRANSPORT_STAFF].includes(user?.role as UserRole) && (
                                    <button
                                        onClick={() => navigate('/transport/orders/create')}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <Truck className="h-5 w-5 text-green-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Create Trip</span>
                                    </button>
                                )}
                                {[UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN].includes(user?.role as UserRole) && (
                                    <button
                                        onClick={() => navigate('/transport/expenses')}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Approve Expenses</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* Warehouse Actions */}
                        {hasModuleAccess('warehouse') && (
                            <>
                                {[UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER].includes(user?.role as UserRole) && (
                                    <button
                                        onClick={() => navigate('/warehouse/sales/create')}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <ShoppingCart className="h-5 w-5 text-purple-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Record Sale</span>
                                    </button>
                                )}
                                {[UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER, UserRole.CASHIER].includes(user?.role as UserRole) && (
                                    <button
                                        onClick={() => navigate('/warehouse/cash-flow')}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <DollarSign className="h-5 w-5 text-purple-600 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">Cash Flow</span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* Admin Actions */}
                        {user?.role === UserRole.SUPER_ADMIN && (
                            <>
                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Users className="h-5 w-5 text-gray-600 mr-3" />
                                    <span className="text-sm font-medium text-gray-900">Manage Users</span>
                                </button>
                                <button
                                    onClick={() => navigate('/analytics/profit')}
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Activity className="h-5 w-5 text-gray-600 mr-3" />
                                    <span className="text-sm font-medium text-gray-900">View Analytics</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity - Only for roles with access */}
            {stats.distribution?.recentOrders && stats.distribution.recentOrders.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Orders
                    </h2>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats.distribution.recentOrders.slice(0, 5).map((order: any) => (
                                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/distribution/orders/${order.id}`)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.customer}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(order.finalAmount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* System Status Indicator */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm font-medium text-green-800">
                        All systems operational
                    </p>
                </div>
            </div>
        </div>
    );
};