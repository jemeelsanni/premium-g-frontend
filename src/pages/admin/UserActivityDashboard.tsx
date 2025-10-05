/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/UserActivityDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingUp, Clock, Calendar } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const UserActivityDashboard: React.FC = () => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [days, setDays] = useState(30);

    // Get list of users for selection
    const { data: usersData } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => adminService.getUsers({ limit: 100 }),
    });

    // Get activity for selected user
    const { data: activityData, isLoading } = useQuery({
        queryKey: ['user-activity', selectedUserId, days],
        queryFn: () => adminService.getUserActivity(selectedUserId, days),
        enabled: !!selectedUserId,
    });

    const activity = activityData?.data?.activity;
    const users = usersData?.data || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Activity Dashboard</h1>
                <p className="text-gray-600">Monitor user actions and system interactions</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select User
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="">-- Select a user --</option>
                            {users.map((user: any) => (
                                <option key={user.id} value={user.id}>
                                    {user.username} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Period (Days)
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={14}>Last 14 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={60}>Last 60 days</option>
                            <option value={90}>Last 90 days</option>
                        </select>
                    </div>
                </div>
            </div>

            {!selectedUserId ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a User to View Activity
                    </h3>
                    <p className="text-gray-600">
                        Choose a user from the dropdown above to see their activity history
                    </p>
                </div>
            ) : isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {/* Activity Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Actions</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {activity?.totalActions || 0}
                                    </p>
                                </div>
                                <Activity className="h-12 w-12 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Action Types</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {Object.keys(activity?.actionsByType || {}).length}
                                    </p>
                                </div>
                                <TrendingUp className="h-12 w-12 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Time Period</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {days} days
                                    </p>
                                </div>
                                <Calendar className="h-12 w-12 text-purple-500" />
                            </div>
                        </div>
                    </div>

                    {/* Actions Breakdown */}
                    {activity?.actionsByType && Object.keys(activity.actionsByType).length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Actions by Type
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(activity.actionsByType).map(([action, count]: [string, any]) => (
                                    <div
                                        key={action}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                    >
                                        <p className="text-sm text-gray-600 mb-1">{action}</p>
                                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Actions */}
                    {activity?.recentActions && activity.recentActions.length > 0 && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Recent Actions
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {activity.recentActions.map((action: any, index: number) => (
                                    <div
                                        key={index}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {action.action}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {action.entity}
                                                    </span>
                                                </div>
                                                {action.entityId && (
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        ID: {action.entityId}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {new Date(action.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Activity Message */}
                    {(!activity?.recentActions || activity.recentActions.length === 0) && (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Activity Found
                            </h3>
                            <p className="text-gray-600">
                                This user has no recorded activity in the last {days} days
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};