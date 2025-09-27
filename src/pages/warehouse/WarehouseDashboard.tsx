import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { warehouseApi } from '../../services/api';
import {
    ShoppingCart,
    Users,
    DollarSign,
    AlertTriangle
} from 'lucide-react';
import { StatsCard } from '../../components/StatsCard';
import { RecentSalesTable } from '../../components/warehouse/RecentSalesTable';
import { InventoryAlertsCard } from '../../components/warehouse/InventoryAlertsCard';

interface WarehouseStats {
    totalSales: number;
    dailyRevenue: number;
    lowStockItems: number;
    totalCustomers: number;
    recentSales: any[];
    lowStockProducts: any[];
}

export const WarehouseDashboard = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<WarehouseStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await warehouseApi.getDashboardStats();
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch warehouse stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Warehouse Dashboard</h1>
                <p className="text-sm text-gray-600">
                    Welcome back, {user?.username}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Today's Sales"
                    value={stats?.totalSales || 0}
                    icon={ShoppingCart}
                    color="blue"
                />
                <StatsCard
                    title="Daily Revenue"
                    value={`₦${(stats?.dailyRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                />
                <StatsCard
                    title="Low Stock Items"
                    value={stats?.lowStockItems || 0}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatsCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentSalesTable sales={stats?.recentSales || []} />
                <InventoryAlertsCard products={stats?.lowStockProducts || []} />
            </div>
        </div>
    );
};