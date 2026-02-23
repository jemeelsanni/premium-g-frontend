/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Warehouse,
  Users,
  ShoppingCart,
  AlertCircle,
  Clock,
  Target,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../services/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

type TabType = 'overview' | 'distribution' | 'transport' | 'warehouse';

interface ModuleStats {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  pendingOrders: number;
  totalPacks?: number;
  totalTrips?: number;
  fleetSize?: number;
  profitMargin?: number;
  totalSales?: number;
  grossProfit?: number;
}

interface DashboardData {
  distribution: ModuleStats;
  transport: ModuleStats;
  warehouse: ModuleStats;
  pendingExpenses: number;
  targets: any;
  profitData: any;
  topCustomers: any[];
}

export const MainDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

      const [
        profitDashboard,
        distributionAnalytics,
        transportAnalytics,
        warehouseAnalytics,
        pendingExpenses,
        distributionTargets,
      ] = await Promise.all([
        apiClient.get('/analytics/profit/dashboard', { params: { days } }).catch(() => null),
        apiClient.get('/distribution/dashboard/analytics').catch(() => null),
        apiClient.get('/analytics/transport/dashboard').catch(() => null),
        apiClient.get('/analytics/warehouse/summary').catch(() => null),
        apiClient.get('/transport/expenses', { params: { status: 'PENDING', limit: 100 } }).catch(() => null),
        apiClient.get('/supplier-targets', { params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 } }).catch(() => null),
      ]);

      const distData = distributionAnalytics?.data?.data || {};
      const transData = transportAnalytics?.data?.data || {};
      const whData = warehouseAnalytics?.data?.data?.summary || {};
      const profitData = profitDashboard?.data?.data || {};

      const dashboardData: DashboardData = {
        distribution: {
          totalRevenue: parseFloat(distData.totalRevenue || 0),
          totalOrders: parseInt(distData.totalOrders || 0),
          activeCustomers: parseInt(distData.activeCustomers || 0),
          pendingOrders: parseInt(distData.pendingOrders || 0),
          totalPacks: parseInt(distData.totalPacks || 0),
        },
        transport: {
          totalRevenue: parseFloat(transData.totalRevenue || 0),
          totalOrders: parseInt(transData.totalOrders || 0),
          activeCustomers: parseInt(transData.fleetSize || 0),
          pendingOrders: 0,
          totalTrips: parseInt(transData.activeTrips || 0),
          fleetSize: parseInt(transData.fleetSize || 0),
          profitMargin: parseFloat(transData.profitMargin || 0),
        },
        warehouse: {
          totalRevenue: parseFloat(whData.totalRevenue || 0),
          totalOrders: parseInt(whData.totalSales || 0),
          activeCustomers: parseInt(whData.activeCustomers || 0),
          pendingOrders: 0,
          totalSales: parseInt(whData.totalSales || 0),
          grossProfit: parseFloat(whData.grossProfit || 0),
        },
        pendingExpenses: pendingExpenses?.data?.data?.expenses?.filter((e: any) => e.status === 'PENDING').length || 0,
        targets: distributionTargets?.data?.data?.targets?.[0] || {},
        profitData,
        topCustomers: profitData?.topPerformers?.customers?.slice(0, 5).map((c: any) => ({
          name: c.name,
          revenue: parseFloat(c.total_revenue) || 0,
          orders: parseInt(c.order_count) || 0,
        })) || [],
      };

      setData(dashboardData);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/distribution');
      return;
    }
    fetchDashboardData();
  }, [isSuperAdmin, navigate, fetchDashboardData]);

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

  if (!isSuperAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error || 'Failed to load data'}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard, color: 'gray' },
    { id: 'distribution' as TabType, label: 'Distribution', icon: Package, color: 'blue' },
    { id: 'transport' as TabType, label: 'Transport', icon: Truck, color: 'green' },
    { id: 'warehouse' as TabType, label: 'Warehouse', icon: Warehouse, color: 'purple' },
  ];

  const totalRevenue = data.distribution.totalRevenue + data.transport.totalRevenue + data.warehouse.totalRevenue;
  const totalOrders = data.distribution.totalOrders + data.transport.totalOrders + data.warehouse.totalOrders;
  const totalCustomers = data.distribution.activeCustomers + data.warehouse.activeCustomers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? `border-${tab.color}-600 text-${tab.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            data={data}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            totalCustomers={totalCustomers}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            navigate={navigate}
          />
        )}
        {activeTab === 'distribution' && (
          <DistributionTab
            data={data}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            navigate={navigate}
          />
        )}
        {activeTab === 'transport' && (
          <TransportTab
            data={data}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            navigate={navigate}
          />
        )}
        {activeTab === 'warehouse' && (
          <WarehouseTab
            data={data}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
interface TabProps {
  data: DashboardData;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  navigate: (path: string) => void;
}

interface OverviewTabProps extends TabProps {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  totalRevenue,
  totalOrders,
  totalCustomers,
  formatCurrency,
  formatNumber,
  navigate,
}) => {
  const pieData = [
    { name: 'Distribution', value: data.distribution.totalRevenue, color: '#3B82F6' },
    { name: 'Transport', value: data.transport.totalRevenue, color: '#10B981' },
    { name: 'Warehouse', value: data.warehouse.totalRevenue, color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'Distribution', revenue: data.distribution.totalRevenue, orders: data.distribution.totalOrders },
    { name: 'Transport', revenue: data.transport.totalRevenue, orders: data.transport.totalOrders },
    { name: 'Warehouse', revenue: data.warehouse.totalRevenue, orders: data.warehouse.totalOrders },
  ];

  const totalPendingActions = data.pendingExpenses + data.distribution.pendingOrders;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          color="blue"
          subtitle="All modules combined"
        />
        <StatCard
          title="Total Orders/Trips"
          value={formatNumber(totalOrders)}
          icon={ShoppingCart}
          color="green"
          subtitle="Across all modules"
        />
        <StatCard
          title="Active Customers"
          value={formatNumber(totalCustomers)}
          icon={Users}
          color="purple"
          subtitle="Distribution + Warehouse"
        />
        <StatCard
          title="Pending Actions"
          value={formatNumber(totalPendingActions)}
          icon={Clock}
          color={totalPendingActions > 0 ? 'amber' : 'gray'}
          subtitle="Requires attention"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Module */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Module</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module Comparison */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModuleCard
          title="Distribution"
          icon={Package}
          color="blue"
          stats={[
            { label: 'Revenue', value: formatCurrency(data.distribution.totalRevenue) },
            { label: 'Orders', value: formatNumber(data.distribution.totalOrders) },
            { label: 'Packs Sold', value: formatNumber(data.distribution.totalPacks || 0) },
          ]}
          onClick={() => navigate('/distribution')}
        />
        <ModuleCard
          title="Transport"
          icon={Truck}
          color="green"
          stats={[
            { label: 'Revenue', value: formatCurrency(data.transport.totalRevenue) },
            { label: 'Active Trips', value: formatNumber(data.transport.totalTrips || 0) },
            { label: 'Fleet Size', value: formatNumber(data.transport.fleetSize || 0) },
          ]}
          onClick={() => navigate('/transport')}
        />
        <ModuleCard
          title="Warehouse"
          icon={Warehouse}
          color="purple"
          stats={[
            { label: 'Revenue', value: formatCurrency(data.warehouse.totalRevenue) },
            { label: 'Sales', value: formatNumber(data.warehouse.totalSales || 0) },
            { label: 'Customers', value: formatNumber(data.warehouse.activeCustomers) },
          ]}
          onClick={() => navigate('/warehouse')}
        />
      </div>

      {/* Pending Actions */}
      {totalPendingActions > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Pending Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.pendingExpenses > 0 && (
              <button
                onClick={() => navigate('/transport/expenses?status=PENDING')}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-gray-900">Expense Approvals</span>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                  {data.pendingExpenses}
                </span>
              </button>
            )}
            {data.distribution.pendingOrders > 0 && (
              <button
                onClick={() => navigate('/distribution/orders?status=PENDING')}
                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-gray-900">Pending Orders</span>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                  {data.distribution.pendingOrders}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== DISTRIBUTION TAB ====================
const DistributionTab: React.FC<TabProps> = ({ data, formatCurrency, formatNumber, navigate }) => {
  const targetPercentage = data.targets?.percentageAchieved || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(data.distribution.totalRevenue)} icon={DollarSign} color="blue" />
        <StatCard title="Total Orders" value={formatNumber(data.distribution.totalOrders)} icon={ShoppingCart} color="green" />
        <StatCard title="Packs Sold" value={formatNumber(data.distribution.totalPacks || 0)} icon={Package} color="purple" />
        <StatCard title="Active Customers" value={formatNumber(data.distribution.activeCustomers)} icon={Users} color="indigo" />
      </div>

      {/* Target Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Target Progress</h3>
          <button
            onClick={() => navigate('/distribution/targets')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Target: {formatNumber(data.targets?.totalPacksTarget || 0)} packs</span>
            <span className="text-gray-600">Actual: {formatNumber(data.targets?.actualPacks || 0)} packs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                targetPercentage >= 100 ? 'bg-green-500' :
                targetPercentage >= 75 ? 'bg-blue-500' :
                targetPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(targetPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${
              targetPercentage >= 100 ? 'text-green-600' :
              targetPercentage >= 75 ? 'text-blue-600' :
              targetPercentage >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {targetPercentage.toFixed(1)}% Achieved
            </span>
            <span className="text-gray-500">
              {formatNumber(Math.max(0, (data.targets?.totalPacksTarget || 0) - (data.targets?.actualPacks || 0)))} packs remaining
            </span>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
          <button
            onClick={() => navigate('/distribution/customers')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        {data.topCustomers.length > 0 ? (
          <div className="space-y-3">
            {data.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.orders} orders</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(customer.revenue)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>No customer data available</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionButton label="Create Order" icon={ShoppingCart} onClick={() => navigate('/distribution/orders/create')} color="blue" />
        <QuickActionButton label="Manage Customers" icon={Users} onClick={() => navigate('/distribution/customers')} color="blue" />
        <QuickActionButton label="View Targets" icon={Target} onClick={() => navigate('/distribution/targets')} color="blue" />
        <QuickActionButton label="All Orders" icon={Package} onClick={() => navigate('/distribution/orders')} color="blue" />
      </div>
    </div>
  );
};

// ==================== TRANSPORT TAB ====================
const TransportTab: React.FC<TabProps> = ({ data, formatCurrency, formatNumber, navigate }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(data.transport.totalRevenue)} icon={DollarSign} color="green" />
        <StatCard title="Active Trips" value={formatNumber(data.transport.totalTrips || 0)} icon={Truck} color="blue" />
        <StatCard title="Fleet Size" value={formatNumber(data.transport.fleetSize || 0)} icon={Truck} color="purple" />
        <StatCard
          title="Pending Expenses"
          value={formatNumber(data.pendingExpenses)}
          icon={CreditCard}
          color={data.pendingExpenses > 0 ? 'amber' : 'gray'}
        />
      </div>

      {/* Pending Expense Approvals */}
      {data.pendingExpenses > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Expense Approvals Needed</h3>
                <p className="text-sm text-amber-600">{data.pendingExpenses} expense(s) awaiting your review</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/transport/expenses?status=PENDING')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Revenue</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(data.transport.totalRevenue)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Trips</p>
            <p className="text-xl font-bold text-blue-700">{formatNumber(data.transport.totalTrips || 0)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Fleet Vehicles</p>
            <p className="text-xl font-bold text-purple-700">{formatNumber(data.transport.fleetSize || 0)}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">Profit Margin</p>
            <p className="text-xl font-bold text-amber-700">{(data.transport.profitMargin || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionButton label="Create Trip" icon={Truck} onClick={() => navigate('/transport/orders/create')} color="green" />
        <QuickActionButton label="Manage Fleet" icon={Truck} onClick={() => navigate('/transport/trucks')} color="green" />
        <QuickActionButton label="View Expenses" icon={CreditCard} onClick={() => navigate('/transport/expenses')} color="green" />
        <QuickActionButton label="Cash Flow" icon={DollarSign} onClick={() => navigate('/transport/cash-flow')} color="green" />
      </div>
    </div>
  );
};

// ==================== WAREHOUSE TAB ====================
const WarehouseTab: React.FC<TabProps> = ({ data, formatCurrency, formatNumber, navigate }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(data.warehouse.totalRevenue)} icon={DollarSign} color="purple" />
        <StatCard title="Total Sales" value={formatNumber(data.warehouse.totalSales || 0)} icon={ShoppingCart} color="blue" />
        <StatCard title="Active Customers" value={formatNumber(data.warehouse.activeCustomers)} icon={Users} color="green" />
        <StatCard title="Gross Profit" value={formatCurrency(data.warehouse.grossProfit || 0)} icon={TrendingUp} color="emerald" />
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
            <p className="text-xl font-bold text-purple-700">{formatCurrency(data.warehouse.totalRevenue)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Gross Profit</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(data.warehouse.grossProfit || 0)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Profit Margin</p>
            <p className="text-xl font-bold text-blue-700">
              {data.warehouse.totalRevenue > 0
                ? ((data.warehouse.grossProfit || 0) / data.warehouse.totalRevenue * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionButton label="Record Sale" icon={ShoppingCart} onClick={() => navigate('/warehouse/sales/create')} color="purple" />
        <QuickActionButton label="Manage Customers" icon={Users} onClick={() => navigate('/warehouse/customers')} color="purple" />
        <QuickActionButton label="View Inventory" icon={Package} onClick={() => navigate('/warehouse/inventory')} color="purple" />
        <QuickActionButton label="All Sales" icon={Warehouse} onClick={() => navigate('/warehouse/sales')} color="purple" />
      </div>
    </div>
  );
};

// ==================== REUSABLE COMPONENTS ====================
interface StatCardProps {
  title: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    gray: 'bg-gray-100 text-gray-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.gray}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mt-3">{value}</h3>
      <p className="text-gray-500 text-sm mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

interface ModuleCardProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  stats: { label: string; value: string }[];
  onClick: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, icon: Icon, color, stats, onClick }) => {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'hover:border-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-500' },
  };
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl p-5 shadow-sm border-2 border-gray-100 ${colors.border} transition-all text-left hover:shadow-md`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
      </div>
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-sm text-gray-500">{stat.label}</span>
            <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </button>
  );
};

interface QuickActionButtonProps {
  label: string;
  icon: React.FC<{ className?: string }>;
  onClick: () => void;
  color: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ label, icon: Icon, onClick, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'hover:bg-blue-50 hover:border-blue-500 text-blue-600',
    green: 'hover:bg-green-50 hover:border-green-500 text-green-600',
    purple: 'hover:bg-purple-50 hover:border-purple-500 text-purple-600',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg transition-colors ${colorClasses[color] || colorClasses.blue}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
};
