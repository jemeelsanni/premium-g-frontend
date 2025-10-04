/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/transport/TruckPerformanceModal.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    TrendingUp,
    DollarSign,
    Fuel,
    Package,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface TruckPerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    truckId: string;
    truckName: string;
}

export const TruckPerformanceModal: React.FC<TruckPerformanceModalProps> = ({
    isOpen,
    onClose,
    truckId,
    truckName
}) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: performanceData, isLoading, error } = useQuery({
        queryKey: ['truck-performance', truckId, startDate, endDate],
        queryFn: () => transportService.getTruckPerformance(truckId, {
            startDate: startDate || undefined,
            endDate: endDate || undefined
        }),
        enabled: isOpen && !!truckId
    });

    if (!isOpen) return null;

    const performance = performanceData?.data?.performance;
    const truck = performanceData?.data?.truck;
    const monthlyBreakdown = performanceData?.data?.monthlyBreakdown || [];
    const recentTrips = performanceData?.data?.recentTrips || [];
    const recentExpenses = performanceData?.data?.recentExpenses || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Performance Analytics - ${truckName}`}
            size="xl"
        >
            <div className="space-y-6">
                {/* Date Filters */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-gray-600">Failed to load truck performance data</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Truck Details */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-600">Plate Number</p>
                                    <p className="text-sm font-semibold text-gray-900">{truck?.plateNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">Make/Model</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {truck?.make} {truck?.model}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">Capacity</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {truck?.maxPallets} pallets
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">Status</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs text-gray-600">Total Trips</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {performance?.totalTrips || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs text-gray-600">Total Revenue</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            ₦{(performance?.totalRevenue || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <Fuel className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs text-gray-600">Fuel Used</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {(performance?.totalFuelUsed || 0).toLocaleString()}L
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-xs text-gray-600">Net Profit</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            ₦{(performance?.netProfit || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Financial Summary</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Revenue</span>
                                        <span className="font-semibold text-gray-900">
                                            ₦{(performance?.totalRevenue || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Trip Expenses</span>
                                        <span className="font-semibold text-gray-900">
                                            ₦{(performance?.totalTripExpenses || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Maintenance Expenses</span>
                                        <span className="font-semibold text-gray-900">
                                            ₦{(performance?.totalMaintenanceExpenses || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t">
                                        <span className="text-gray-600">Total Expenses</span>
                                        <span className="font-semibold text-red-600">
                                            ₦{(performance?.totalExpenses || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t">
                                        <span className="font-medium text-gray-700">Net Profit</span>
                                        <span className="font-bold text-green-600">
                                            ₦{(performance?.netProfit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Profit Margin</span>
                                        <span className={`font-bold ${(performance?.profitMargin || 0) >= 15 ? 'text-green-600' :
                                                (performance?.profitMargin || 0) >= 10 ? 'text-yellow-600' :
                                                    'text-red-600'
                                            }`}>
                                            {(performance?.profitMargin || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">Efficiency Metrics</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Avg Revenue/Trip</span>
                                        <span className="font-semibold text-gray-900">
                                            ₦{(performance?.averageRevenuePerTrip || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Avg Fuel/Trip</span>
                                        <span className="font-semibold text-gray-900">
                                            {(performance?.averageFuelPerTrip || 0).toFixed(1)}L
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Fuel Cost</span>
                                        <span className="font-semibold text-gray-900">
                                            ₦{(performance?.totalFuelCost || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Fuel Efficiency</span>
                                        <span className="font-semibold text-gray-900">
                                            {performance?.totalTrips > 0 && performance?.totalFuelUsed > 0
                                                ? (performance.totalFuelUsed / performance.totalTrips).toFixed(1)
                                                : 0}L per trip
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Breakdown Chart */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Monthly Performance Trend
                            </h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={monthlyBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                                    />
                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue (₦)" />
                                    <Bar yAxisId="right" dataKey="trips" fill="#10B981" name="Trips" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Recent Trips Table */}
                        <div className="bg-white border border-gray-200 rounded-lg">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h4 className="font-medium text-gray-900">Recent Trips (Last 10)</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fuel</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {recentTrips.length > 0 ? (
                                            recentTrips.map((trip: any, index: number) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{trip.orderNumber}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{trip.client}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{trip.location || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                                        ₦{trip.revenue.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                        {trip.fuelUsed}L
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                                        ₦{trip.profit.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {new Date(trip.date).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                                                    No trips found for this period
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Expenses Table */}
                        <div className="bg-white border border-gray-200 rounded-lg">
                            <div className="px-4 py-3 border-b border-gray-200">
                                <h4 className="font-medium text-gray-900">Recent Expenses (Last 10)</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {recentExpenses.length > 0 ? (
                                            recentExpenses.map((expense: any, index: number) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.category}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{expense.description}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                                                        ₦{expense.amount.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {new Date(expense.date).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                                    No expenses found for this period
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};