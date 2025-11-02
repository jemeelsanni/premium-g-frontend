/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
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

    Activity,
    AlertCircle,
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

    const hasModuleAccess = useCallback((module: 'distribution' | 'transport' | 'warehouse') => {
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
    }, [user?.role]); // Add user.role dependency

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

                // Fetch Transport stats - FIXED
                if (hasModuleAccess('transport')) {
                    try {
                        console.log('📊 Fetching Transport stats...');
                        // ✅ Use the correct endpoint that actually works
                        const transResponse = await apiClient.get('/analytics/transport/dashboard');
                        console.log('✅ Transport response:', transResponse.data);

                        if (transResponse.data.success && transResponse.data.data) {
                            // ✅ FIX: Parse the dashboard endpoint response structure
                            const responseData = transResponse.data.data;

                            data.transport = {
                                totalRevenue: parseFloat(responseData.totalRevenue) || 0,
                                totalTrips: parseInt(responseData.activeTrips) || 0,
                                activeClients: parseInt(responseData.fleetSize) || 0,
                                netProfit: parseFloat(responseData.totalProfit) || 0
                            };

                            console.log('✅ Parsed transport data:', data.transport);
                        }
                    } catch (error: any) {
                        console.error('❌ Transport stats error:', error);
                        console.error('Error details:', error.response?.data);
                        errorMessages.push('Transport data unavailable');
                        data.transport = {
                            totalRevenue: 0,
                            totalTrips: 0,
                            activeClients: 0,
                            netProfit: 0
                        };
                    }
                }

                // Fetch Warehouse stats - FIXED
                if (hasModuleAccess('warehouse')) {
                    try {
                        console.log('📊 Fetching Warehouse stats...');
                        const whResponse = await apiClient.get('/analytics/warehouse/summary');
                        console.log('✅ Warehouse response:', whResponse.data);

                        if (whResponse.data.success && whResponse.data.data) {
                            // ✅ FIX: Properly handle nested summary structure
                            const responseData = whResponse.data.data;
                            const summary = responseData.summary;

                            if (summary) {
                                data.warehouse = {
                                    totalRevenue: parseFloat(summary.totalRevenue) || 0,
                                    totalSales: parseInt(summary.totalSales) || 0,
                                    activeCustomers: parseInt(summary.activeCustomers) || 0,
                                    grossProfit: parseFloat(summary.grossProfit) || 0
                                };

                                console.log('✅ Parsed warehouse data:', data.warehouse);
                            } else {
                                throw new Error('Summary data not found in response');
                            }
                        }
                    } catch (error: any) {
                        console.error('❌ Warehouse stats error:', error);
                        console.error('Error details:', error.response?.data);
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
                    console.log('✅ Consolidated stats:', data.consolidated);
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
    }, [hasModuleAccess, user?.role]);

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
                    customers: stats.transport.activeClients
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
                    customers: stats.warehouse.activeCustomers
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
            maximumFractionDigits: 0,
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.username}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">{getWelcomeMessage()}</p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Some data may be unavailable: {errors.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Consolidated Stats for Super Admin */}
            {user?.role === UserRole.SUPER_ADMIN && stats.consolidated && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Consolidated Overview
                    </h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <StatsCard
                            title="Total Revenue"
                            value={formatCurrency(stats.consolidated.totalRevenue)}
                            icon={DollarSign}
                            color="blue"
                        />
                        {/* <StatsCard
                            title="Total Profit"
                            value={formatCurrency(stats.consolidated.totalProfit)}
                            icon={TrendingUp}
                            color="green"
                            trend={{ value: 0, isPositive: true }}
                        /> */}
                        <StatsCard
                            title="Total Orders/Trips/Sales"
                            value={formatNumber(stats.consolidated.totalOrders)}
                            icon={Activity}
                            color="blue"
                        />
                        <StatsCard
                            title="Total Customers/Clients"
                            value={formatNumber(stats.consolidated.totalCustomers)}
                            icon={Users}
                            color="indigo"
                        />
                    </div>
                </div>
            )}

            {/* Module Cards */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Modules</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {moduleLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => navigate(link.href)}
                            className={`relative group bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-${link.color}-500 hover:shadow-lg transition-all duration-200 text-left`}
                        >
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 bg-${link.color}-100 rounded-lg p-3`}>
                                    <link.icon className={`h-6 w-6 text-${link.color}-600`} />
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">{link.name}</h3>
                                    <p className="text-sm text-gray-500">{link.description}</p>
                                </div>
                            </div>
                            {link.stats && (
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Revenue</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(link.stats.revenue || 0)}
                                        </p>
                                    </div>
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
                                            {link.name === 'Distribution' || link.name === 'Warehouse' || link.name === 'Transport'
                                                ? 'Customers/Clients'
                                                : 'Other'}
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatNumber(link.stats.customers || 0)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Distribution Actions */}
                    {hasModuleAccess('distribution') && (
                        <>
                            {[UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user?.role as UserRole) && (
                                <button
                                    onClick={() => navigate('/distribution/orders/create')}
                                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ShoppingCart className="h-5 w-5 text-blue-600 mr-3" />
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
                                    <Package className="h-5 w-5 text-purple-600 mr-3" />
                                    <span className="text-sm font-medium text-gray-900">Record Sale</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Recent Activity for Distribution Module */}
            {hasModuleAccess('distribution') && stats.distribution?.recentOrders && stats.distribution.recentOrders.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <ul className="divide-y divide-gray-200">
                            {stats.distribution.recentOrders.slice(0, 5).map((order: any) => (
                                <li key={order.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {order.customer}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Order #{order.orderNumber}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatCurrency(order.finalAmount || order.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {order.status}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};