/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/TransportAnalytics.tsx - COMPLETE VERSION

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    DollarSign,
    Truck,
    Users,
    Fuel,
    BarChart3,
    Download,
    Calendar,
    Activity
} from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const TransportAnalytics: React.FC = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTab, setSelectedTab] = useState<'overview' | 'trucks' | 'clients' | 'expenses'>('overview');




    const { data: analyticsData, isLoading } = useQuery({
        queryKey: ['transport-analytics', startDate, endDate],
        queryFn: () => transportService.getAnalyticsSummary({
            startDate: startDate || undefined,
            endDate: endDate || undefined
        })
    });

    const { data: profitData } = useQuery({
        queryKey: ['transport-profit-analysis', startDate, endDate],
        queryFn: () => transportService.getProfitAnalysis({
            startDate: startDate || undefined,
            endDate: endDate || undefined
        })
    });

    const { data: clientsData } = useQuery({
        queryKey: ['transport-clients', startDate, endDate],
        queryFn: () => transportService.getClientStats({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            limit: 10
        })
    });

    const { data: expensesData } = useQuery({
        queryKey: ['transport-expenses-summary', startDate, endDate],
        queryFn: () => transportService.getExpenseSummary({
            startDate: startDate || undefined,
            endDate: endDate || undefined
        })
    });



    // Export Analytics
    const handleExportAnalytics = async () => {
        try {
            globalToast.loading('Generating analytics report...');
            // You can implement CSV export here
            const csvData = generateCSVReport();
            downloadCSV(csvData, `transport-analytics-${Date.now()}.csv`);
            globalToast.success('Analytics exported successfully!');
        } catch (error) {
            globalToast.error('Failed to export analytics');
        }
    };

    const generateCSVReport = () => {
        const summary = analyticsData?.data?.summary;
        const headers = 'Metric,Value\n';
        const rows = [
            `Total Revenue,${summary?.totalRevenue || 0}`,
            `Total Expenses,${summary?.totalExpenses || 0}`,
            `Gross Profit,${summary?.grossProfit || 0}`,
            `Net Profit,${summary?.netProfit || 0}`,
            `Profit Margin,${summary?.profitMargin || 0}%`,
            `Total Trips,${summary?.totalTrips || 0}`,
            `Average Trip Revenue,${summary?.averageTripRevenue || 0}`,
            `Total Fuel Used,${summary?.totalFuelLiters || 0}L`
        ].join('\n');
        return headers + rows;
    };

    const downloadCSV = (csvContent: string, filename: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const summary = analyticsData?.data?.summary;
    const breakdown = analyticsData?.data?.breakdown;
    const profitSummary = profitData?.data?.summary;
    const monthlyTrend = profitData?.data?.monthlyTrend || [];
    const clients = clientsData || [];

    // Prepare data for charts
    const expenseBreakdownData = breakdown?.expensesByCategory
        ? Object.entries(breakdown.expensesByCategory).map(([category, amount]) => ({
            name: category,
            value: amount
        }))
        : [];

    const topClientsData = clients.slice(0, 5).map((client: any) => ({
        name: client.clientName,
        revenue: client.totalRevenue,
        profit: client.totalProfit,
        trips: client.totalTrips
    }));

    const topTrucksData = breakdown?.byTruck?.slice(0, 5).map((truck: any) => ({
        name: truck.truck,
        trips: truck.trips,
        revenue: truck.revenue,
        fuelUsed: truck.fuelUsed
    })) || [];

    const locationData = breakdown?.byLocation?.map((loc: any) => ({
        name: loc.name,
        trips: loc.trips,
        revenue: loc.revenue
    })) || [];

    // Calculate trends
    const revenueGrowth = monthlyTrend.length > 1
        ? ((monthlyTrend[monthlyTrend.length - 1]?.revenue - monthlyTrend[0]?.revenue) / monthlyTrend[0]?.revenue * 100)
        : 0;

    const profitGrowth = monthlyTrend.length > 1
        ? ((monthlyTrend[monthlyTrend.length - 1]?.profit - monthlyTrend[0]?.profit) / monthlyTrend[0]?.profit * 100)
        : 0;

    const expenseSummary = expensesData?.data;
    const pendingExpenses = expenseSummary?.byType?.find((s: any) => s.type === 'PENDING');
    const approvedExpenses = expenseSummary?.byType?.find((s: any) => s.type === 'APPROVED');
    const rejectedExpenses = expenseSummary?.byType?.find((s: any) => s.type === 'REJECTED');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Transport Analytics
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Comprehensive insights into your transport operations
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button
                        variant="outline"
                        onClick={handleExportAnalytics}
                        className="inline-flex items-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="w-full"
                        >
                            Clear Filters
                        </Button>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={() => {
                                const today = new Date();
                                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                                setStartDate(firstDay.toISOString().split('T')[0]);
                                setEndDate(today.toISOString().split('T')[0]);
                            }}
                            className="w-full"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            This Month
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'trucks', label: 'Trucks', icon: Truck },
                            { id: 'clients', label: 'Clients', icon: Users },
                            { id: 'expenses', label: 'Expenses', icon: DollarSign }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id as any)}
                                className={`
                                    ${selectedTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                                `}
                            >
                                <tab.icon className="h-4 w-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₦{(summary?.totalRevenue || 0).toLocaleString()}
                            </p>
                            {revenueGrowth !== 0 && (
                                <p className={`text-xs mt-1 ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% from start
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Net Profit</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₦{(summary?.netProfit || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {summary?.profitMargin?.toFixed(1)}% margin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Truck className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Total Trips</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {summary?.totalTrips || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Avg: ₦{(summary?.averageTripRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <Fuel className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-600">Fuel Used</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(summary?.totalFuelLiters || 0).toLocaleString()}L
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                ₦{(summary?.tripExpenses?.fuel || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
                <>
                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue vs Profit Trend */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                                Monthly Revenue & Profit Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={monthlyTrend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: any) => `₦${parseFloat(value).toLocaleString()}`}
                                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                    <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Expense Breakdown */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Expense Breakdown by Category
                            </h3>
                            {expenseBreakdownData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={expenseBreakdownData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry: any) => `${entry.name}: ₦${(entry.value as number).toLocaleString()}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {expenseBreakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `₦${parseFloat(value).toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-gray-500">
                                    No expense data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Detailed Cost Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Trip Expenses */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-700">Trip Expenses</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Fuel</span>
                                        <span className="text-sm font-semibold">
                                            ₦{(summary?.tripExpenses?.fuel || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Wages</span>
                                        <span className="text-sm font-semibold">
                                            ₦{(summary?.tripExpenses?.wages || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Service Charges</span>
                                        <span className="text-sm font-semibold">
                                            ₦{(summary?.tripExpenses?.serviceCharges || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t font-medium">
                                        <span className="text-sm">Subtotal</span>
                                        <span className="text-sm">
                                            ₦{(summary?.tripExpenses?.total || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Non-Trip Expenses */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-700">Non-Trip Expenses</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Maintenance & Repairs</span>
                                        <span className="text-sm font-semibold">
                                            ₦{(summary?.nonTripExpenses || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Profitability */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-700">Profitability</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Revenue</span>
                                        <span className="text-sm font-semibold text-blue-600">
                                            ₦{(summary?.totalRevenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Expenses</span>
                                        <span className="text-sm font-semibold text-red-600">
                                            ₦{(summary?.totalExpenses || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Gross Profit</span>
                                        <span className="text-sm font-semibold">
                                            ₦{(summary?.grossProfit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t font-medium">
                                        <span className="text-sm text-green-700">Net Profit</span>
                                        <span className="text-sm text-green-700">
                                            ₦{(summary?.netProfit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Profit Margin</span>
                                        <span className="text-sm font-bold text-green-700">
                                            {(summary?.profitMargin || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Trucks Tab */}
            {selectedTab === 'trucks' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Top 5 Trucks by Revenue
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={topTrucksData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" fill="#8B5CF6" name="Revenue (₦)" />
                                <Bar yAxisId="right" dataKey="trips" fill="#EC4899" name="Trips" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Truck Performance Table */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Truck Performance Details
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trips</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fuel Used</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {breakdown?.byTruck?.map((truck: any, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{truck.truck}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-600">{truck.trips}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                                    ₦{truck.revenue.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                    {truck.fuelUsed?.toLocaleString() || 0}L
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                                                        {truck.trips > 0 ? (truck.revenue / truck.trips).toLocaleString() : 0} ₦/trip
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Clients Tab */}
            {selectedTab === 'clients' && (
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Top 5 Clients by Revenue
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={topClientsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: any) => `₦${parseFloat(value).toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                <Bar dataKey="profit" fill="#10B981" name="Profit" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Client Performance Table */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Client Performance
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trips</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {clients.map((client: any, index: number) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.clientName}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-600">{client.totalTrips}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                                    ₦{client.totalRevenue.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                                    ₦{client.totalProfit?.toLocaleString() || 0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={`px-2 py-1 rounded ${client.profitMargin > 15 ? 'bg-green-100 text-green-800' :
                                                        client.profitMargin > 10 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {client.profitMargin?.toFixed(1) || 0}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Location Performance */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Performance by Location
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={locationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: any) => value.toLocaleString()} />
                                <Legend />
                                <Bar dataKey="trips" fill="#F59E0B" name="Trips" />
                                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (₦)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Expenses Tab */}
            {selectedTab === 'expenses' && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Expense Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ₦{(expenseSummary?.summary?.totalAmount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-yellow-50 rounded-lg">
                                    <Activity className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {(pendingExpenses?.count || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ₦{(pendingExpenses?.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Approved</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {approvedExpenses?.count || 0}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ₦{(approvedExpenses?.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Expense Summary
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">By Type</h4>
                                {expenseSummary?.byType?.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b">
                                        <div className="flex items-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'TRIP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <span className="ml-3 text-sm text-gray-600">({item.count} expenses)</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">
                                            ₦{item.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 pt-3 border-t">
                                <h4 className="text-sm font-medium text-gray-700">Top Categories</h4>
                                {expenseSummary?.byCategory?.slice(0, 8).map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-gray-600">{item.category}</span>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    ₦{item.amount.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{
                                                        width: `${Math.min(
                                                            (item.amount / (expenseSummary?.summary?.totalAmount || 1)) * 100,
                                                            100
                                                        )}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 pt-3 border-t">
                                <h4 className="text-sm font-medium text-gray-700">By Status</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Pending</p>
                                        <p className="text-lg font-bold text-yellow-700">
                                            {pendingExpenses?.count || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Approved</p>
                                        <p className="text-lg font-bold text-green-700">
                                            {approvedExpenses?.count || 0}
                                        </p>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Rejected</p>
                                        <p className="text-lg font-bold text-red-700">
                                            {rejectedExpenses?.count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Expense Trend */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Monthly Expense Trend
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={expenseSummary?.monthly || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: any) => `₦${parseFloat(value).toLocaleString()}`}
                                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="tripExpenses" stroke="#3B82F6" name="Trip Expenses" strokeWidth={2} />
                                <Line type="monotone" dataKey="nonTripExpenses" stroke="#EF4444" name="Non-Trip Expenses" strokeWidth={2} />
                                <Line type="monotone" dataKey="total" stroke="#8B5CF6" name="Total" strokeWidth={2} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Performance Insights (Show on all tabs) */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Performance Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Average Revenue per Trip</p>
                        <p className="text-xl font-bold text-gray-900">
                            ₦{(summary?.averageTripRevenue || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Fuel Efficiency</p>
                        <p className="text-xl font-bold text-gray-900">
                            {summary?.totalTrips && summary?.totalFuelLiters
                                ? (summary.totalFuelLiters / summary.totalTrips).toFixed(1)
                                : 0}L/trip
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Expense Ratio</p>
                        <p className="text-xl font-bold text-gray-900">
                            {summary?.totalRevenue
                                ? ((summary.totalExpenses / summary.totalRevenue) * 100).toFixed(1)
                                : 0}%
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Active Clients</p>
                        <p className="text-xl font-bold text-gray-900">
                            {clients.length}
                        </p>
                    </div>
                </div>

                {/* Actionable Insights */}
                <div className="mt-4 space-y-2">
                    {summary && (
                        <>
                            {summary.profitMargin < 10 && (
                                <div className="flex items-start bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm text-yellow-800">
                                            <span className="font-medium">Low profit margin detected:</span> Your profit margin is {summary.profitMargin.toFixed(1)}%.
                                            Consider reviewing fuel costs and service charges.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {summary.profitMargin > 20 && (
                                <div className="flex items-start bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm text-green-800">
                                            <span className="font-medium">Excellent performance:</span> Your profit margin of {summary.profitMargin.toFixed(1)}% is above industry standards.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {summary.totalTrips > 0 && summary.averageTripRevenue > 0 && (
                                <div className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm text-blue-800">
                                            You've completed {summary.totalTrips} trips with an average revenue of ₦{summary.averageTripRevenue.toLocaleString()} per trip.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};