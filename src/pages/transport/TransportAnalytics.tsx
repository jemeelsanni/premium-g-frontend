/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/TransportAnalytics.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    DollarSign,
    Truck,
    Users,
    Fuel,
    BarChart3
} from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
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
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const TransportAnalytics: React.FC = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
    const clients = clientsData?.data?.clients || [];
    const expenseSummary = expensesData?.data;

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
        profit: client.totalProfit
    }));

    const topTrucksData = breakdown?.byTruck?.slice(0, 5).map((truck: any) => ({
        name: truck.truck,
        trips: truck.trips,
        revenue: truck.revenue
    })) || [];

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
                    <div className="flex items-end md:col-span-2">
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
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₦{(summary?.totalRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Net Profit</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ₦{(summary?.netProfit || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
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
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Trips</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {summary?.totalTrips || 0}
                            </p>
                            <p className="text-xs text-gray-500">
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
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Fuel Used</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(summary?.totalFuelLiters || 0).toLocaleString()}L
                            </p>
                            <p className="text-xs text-gray-500">
                                ₦{(summary?.tripExpenses?.fuel || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Profit Trend */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Monthly Revenue & Profit Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyTrend}>
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
                            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" strokeWidth={2} />
                            <Line type="monotone" dataKey="profit" stroke="#10B981" name="Profit" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Expense Breakdown by Category
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={expenseBreakdownData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ₦${entry.value.toLocaleString()}`}
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
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clients */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Top 5 Clients by Revenue
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topClientsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: any) => `₦${parseFloat(value).toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                            <Bar dataKey="profit" fill="#10B981" name="Profit" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Trucks */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Top 5 Trucks by Revenue
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
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
            </div>

            {/* Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Client Performance Table */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Expense Summary
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b">
                            <span className="text-sm font-medium text-gray-600">Total Expenses</span>
                            <span className="text-lg font-bold text-gray-900">
                                ₦{(expenseSummary?.summary?.totalAmount || 0).toLocaleString()}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">By Type</h4>
                            {expenseSummary?.byType?.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{item.type}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ₦{item.amount.toLocaleString()} ({item.count})
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 pt-3 border-t">
                            <h4 className="text-sm font-medium text-gray-700">By Category</h4>
                            {expenseSummary?.byCategory?.slice(0, 5).map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{item.category}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ₦{item.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
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
        </div>
    );
}; ">
              Client Performance
            </h3 >
          </div >
    <div className="p-6">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trips</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {clients.slice(0, 10).map((client: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.clientName}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600">{client.totalTrips}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                ₦{client.totalRevenue.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                                <span className={`px-2 py-1 rounded ${client.profitMargin > 15 ? 'bg-green-100 text-green-800' :
                                        client.profitMargin > 10 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {client.profitMargin.toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
        </div >

    {/* Expense Summary */ }
    < div className = "bg-white shadow rounded-lg" >
        <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900