/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { auditLogService, InventoryChangeLog, SuspiciousActivity } from '../../services/auditLogService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import dayjs from 'dayjs';

export const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'changes' | 'suspicious'>('changes');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    triggeredBy: '',
    startDate: '',
    endDate: '',
    days: 30,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Query for inventory changes
  const { data: changesData, isLoading: loadingChanges, refetch: refetchChanges } = useQuery({
    queryKey: ['audit-inventory-changes', currentPage, filters.triggeredBy, filters.startDate, filters.endDate],
    queryFn: () =>
      auditLogService.getInventoryChanges({
        triggeredBy: filters.triggeredBy || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: currentPage,
        limit: 20,
      }),
    enabled: activeTab === 'changes',
  });

  // Query for suspicious activities
  const { data: suspiciousData, isLoading: loadingSuspicious, refetch: refetchSuspicious } = useQuery({
    queryKey: ['audit-suspicious', filters.days],
    queryFn: () => auditLogService.getSuspiciousActivities(filters.days),
    enabled: activeTab === 'suspicious',
  });

  const handleRefresh = () => {
    if (activeTab === 'changes') {
      refetchChanges();
    } else {
      refetchSuspicious();
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'MANUAL_ADJUSTMENT':
        return 'bg-orange-100 text-orange-800';
      case 'SALE':
        return 'bg-green-100 text-green-800';
      case 'PURCHASE_UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'PURCHASE_DELETE':
      case 'SALE_DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: 'HIGH' | 'MEDIUM') => {
    return severity === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
  };

  const formatChange = (change: { old: number; new: number; diff: number }) => {
    const colorClass = change.diff < 0 ? 'text-red-600' : change.diff > 0 ? 'text-green-600' : 'text-gray-600';
    return (
      <span className={`font-medium ${colorClass}`}>
        {change.old} → {change.new} ({change.diff > 0 ? '+' : ''}{change.diff})
      </span>
    );
  };

  const inventoryChanges = changesData?.data?.logs || [];
  const totalPages = changesData?.data?.pagination?.totalPages || 1;
  const suspiciousActivities = suspiciousData?.suspiciousActivities || [];
  const suspiciousSummary = suspiciousData?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Audit Logs</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('changes')}
              className={`${
                activeTab === 'changes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Inventory Changes
            </button>
            <button
              onClick={() => setActiveTab('suspicious')}
              className={`${
                activeTab === 'suspicious'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              Suspicious Activities
              {suspiciousSummary && suspiciousSummary.high > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs font-medium">
                  {suspiciousSummary.high}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'changes' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trigger Type
                      </label>
                      <select
                        value={filters.triggeredBy}
                        onChange={(e) => setFilters({ ...filters, triggeredBy: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">All</option>
                        <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                        <option value="SALE">Sale</option>
                        <option value="PURCHASE_UPDATE">Purchase Update</option>
                        <option value="PURCHASE_DELETE">Purchase Delete</option>
                        <option value="SALE_DELETE">Sale Delete</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Loading */}
              {loadingChanges ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : inventoryChanges.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Info className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No inventory changes found</p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date/Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trigger
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Changes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryChanges.map((log: InventoryChangeLog) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dayjs(log.createdAt).format('MMM DD, YYYY HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{log.productName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{log.user?.username || 'SYSTEM'}</div>
                              <div className="text-xs text-gray-500">{log.user?.role}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTriggerColor(log.triggeredBy)}`}>
                                {log.triggeredBy}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {log.changes?.packs && (
                                <div>Packs: {formatChange(log.changes.packs)}</div>
                              )}
                              {log.changes?.pallets && (
                                <div>Pallets: {formatChange(log.changes.pallets)}</div>
                              )}
                              {log.changes?.units && (
                                <div>Units: {formatChange(log.changes.units)}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {log.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        variant="outline"
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'suspicious' && (
            <div className="space-y-4">
              {/* Time period filter */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Period
                  </label>
                  <select
                    value={filters.days}
                    onChange={(e) => setFilters({ ...filters, days: Number(e.target.value) })}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={60}>Last 60 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>
                {suspiciousSummary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <div className="text-sm text-blue-800">
                      Found <span className="font-bold">{suspiciousSummary.total}</span> suspicious activities (
                      <span className="font-bold text-red-600">{suspiciousSummary.high} HIGH</span>,{' '}
                      <span className="font-bold text-orange-600">{suspiciousSummary.medium} MEDIUM</span>)
                    </div>
                  </div>
                )}
              </div>

              {/* Loading */}
              {loadingSuspicious ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : suspiciousActivities.length === 0 ? (
                <div className="text-center py-12 text-green-600">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-lg font-medium">No suspicious activities detected!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousActivities.map((activity: SuspiciousActivity) => (
                    <div
                      key={activity.id}
                      className={`border-2 rounded-lg p-6 ${
                        activity.severity === 'HIGH' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{activity.productName}</h3>
                          <p className="text-sm text-gray-500">
                            {dayjs(activity.createdAt).format('MMM DD, YYYY HH:mm')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getSeverityColor(activity.severity)}`}>
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {activity.severity}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">User:</p>
                          <p className="text-sm font-medium">
                            {activity.user?.username || 'SYSTEM'} ({activity.user?.role})
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Trigger:</p>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTriggerColor(activity.triggeredBy)}`}>
                            {activity.triggeredBy}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Reason:</p>
                        <p className="text-sm">{activity.reason}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Red Flags:</p>
                        <div className="flex flex-wrap gap-2">
                          {activity.suspicionReasons.map((reason: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      {activity.changes && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Changes:</p>
                          <div className="flex gap-4">
                            {activity.changes.packs && (
                              <div>Packs: {formatChange(activity.changes.packs)}</div>
                            )}
                            {activity.changes.pallets && (
                              <div>Pallets: {formatChange(activity.changes.pallets)}</div>
                            )}
                            {activity.changes.units && (
                              <div>Units: {formatChange(activity.changes.units)}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
