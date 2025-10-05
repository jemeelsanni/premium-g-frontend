/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/UserStatsDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Clock, BarChart3 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const UserStatsDashboard: React.FC = () => {
    // ✅ Using: adminService.getUserStats()
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['user-stats'],
        queryFn: () => adminService.getUserStats(),
    });

    const stats = statsData?.data;

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const getPercentage = (value: number, total: number) => {
        return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Statistics</h1>
                <p className="text-gray-600">Overview of system users and activity</p>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="h-12 w-12 opacity-80" />
                        <div className="text-right">
                            <p className="text-sm opacity-90">Total Users</p>
                            <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
                        </div>
                    </div>
                    <div className="text-sm opacity-90">
                        All registered system users
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <UserCheck className="h-12 w-12 opacity-80" />
                        <div className="text-right">
                            <p className="text-sm opacity-90">Active Users</p>
                            <p className="text-4xl font-bold">{stats?.activeUsers || 0}</p>
                        </div>
                    </div>
                    <div className="text-sm opacity-90">
                        {getPercentage(stats?.activeUsers || 0, stats?.totalUsers || 0)}% of total users
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <UserX className="h-12 w-12 opacity-80" />
                        <div className="text-right">
                            <p className="text-sm opacity-90">Inactive Users</p>
                            <p className="text-4xl font-bold">{stats?.inactiveUsers || 0}</p>
                        </div>
                    </div>
                    <div className="text-sm opacity-90">
                        {getPercentage(stats?.inactiveUsers || 0, stats?.totalUsers || 0)}% of total users
                    </div>
                </div>
            </div>

            {/* Users by Role */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Users by Role
                        </h2>
                    </div>
                </div>
                <div className="p-6">
                    {stats?.usersByRole && stats.usersByRole.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.usersByRole.map((roleData: any) => (
                                <div
                                    key={roleData.role}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">
                                            {roleData.role.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {roleData._count.role}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{
                                                width: `${getPercentage(roleData._count.role, stats.totalUsers)}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {getPercentage(roleData._count.role, stats.totalUsers)}% of users
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No role data available</p>
                    )}
                </div>
            </div>

            {/* Recent Logins */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Recent Logins (Last 24 Hours)
                        </h2>
                    </div>
                </div>
                <div className="divide-y divide-gray-200">
                    {stats?.recentLogins && stats.recentLogins.length > 0 ? (
                        stats.recentLogins.map((login: any) => (
                            <div
                                key={login.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {login.username}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {login.role.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-900">
                                            {new Date(login.lastLoginAt).toLocaleTimeString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(login.lastLoginAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No recent logins in the last 24 hours</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        User Distribution
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Rate</span>
                            <span className="text-sm font-semibold text-green-600">
                                {getPercentage(stats?.activeUsers || 0, stats?.totalUsers || 0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-green-500 h-3 rounded-full transition-all"
                                style={{
                                    width: `${getPercentage(stats?.activeUsers || 0, stats?.totalUsers || 0)}%`,
                                }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-gray-600">Inactive Rate</span>
                            <span className="text-sm font-semibold text-red-600">
                                {getPercentage(stats?.inactiveUsers || 0, stats?.totalUsers || 0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-red-500 h-3 rounded-full transition-all"
                                style={{
                                    width: `${getPercentage(stats?.inactiveUsers || 0, stats?.totalUsers || 0)}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b">
                            <span className="text-sm text-gray-600">Total Roles</span>
                            <span className="text-lg font-bold text-gray-900">
                                {stats?.usersByRole?.length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b">
                            <span className="text-sm text-gray-600">Recent Logins (24h)</span>
                            <span className="text-lg font-bold text-gray-900">
                                {stats?.recentLogins?.length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pb-3 border-b">
                            <span className="text-sm text-gray-600">Active Users</span>
                            <span className="text-lg font-bold text-green-600">
                                {stats?.activeUsers || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Inactive Users</span>
                            <span className="text-lg font-bold text-red-600">
                                {stats?.inactiveUsers || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};