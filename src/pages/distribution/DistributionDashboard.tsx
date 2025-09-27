import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { distributionApi } from '../../api/distribution.api';
import { StatsCard } from '../../components/StatsCard';
import { AnalyticsChart } from '../../components/AnalyticsChart';
import { TargetProgressCard } from '../../components/distribution/TargetProgressCard';
import { RecentOrdersTable } from '../../components/distribution/RecentOrdersTable';
import { TopCustomersCard } from '../../components/distribution/TopCustomersCard';
import {
    Package,
    DollarSign,
    Target,
    TrendingUp,
    Users,
    ShoppingCart,
    AlertCircle,
    Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const DistributionDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [targetData, setTargetData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, analyticsRes, targetRes] = await Promise.all([
                    distributionApi.getDashboardStats(),
                    distributionApi.getAnalytics(),
                    distributionApi.getCurrentTarget()
                ]);

                setStats(statsRes.data);
                setAnalytics(analyticsRes.data);
                setTargetData(targetRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Distribution Dashboard</h1>
                    <p className="text-gray-600">Monitor B2B sales performance and targets</p>
                </div>
                <Link to="/distribution/orders/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Order
                    </Button>
                </Link>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Orders"
                    value={stats?.totalOrders || 0}
                    icon={ShoppingCart}
                    color="blue"
                    trend={{
                        value: 12.5,
                        isPositive: true
                    }}
                />
                <StatsCard
                    title="Monthly Revenue"
                    value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                    trend={{
                        value: 8.2,
                        isPositive: true
                    }}
                />
                <StatsCard
                    title="Target Progress"
                    value={`${stats?.monthlyProgress || 0}%`}
                    icon={Target}
                    color="purple"
                    trend={{
                        value: stats?.weeklyProgress || 0,
                        isPositive: (stats?.weeklyProgress || 0) > 0
                    }}
                />
                <StatsCard
                    title="Active Customers"
                    value={stats?.activeCustomers || 0}
                    icon={Users}
                    color="orange"
                />
            </div>

            {/* Target Progress & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TargetProgressCard targetData={targetData} />
                <AnalyticsChart
                    data={analytics?.monthlyData || []}
                    title="Monthly Performance"
                    type="area"
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentOrdersTable orders={stats?.recentOrders || []} />
                <TopCustomersCard customers={stats?.topCustomers || []} />
            </div>
        </div>
    );
};
