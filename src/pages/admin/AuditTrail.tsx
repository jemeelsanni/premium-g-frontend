/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AuditTrail.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Download,
  Activity,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// ── Entity label map ──────────────────────────────────────────────────────────
const ENTITY_LABELS: Record<string, string> = {
  SALE: 'Sale',
  PURCHASE: 'Purchase',
  PRODUCT: 'Product',
  USER: 'User',
  CUSTOMER: 'Customer',
  DEBTOR: 'Debtor',
  EXPENSE: 'Expense',
  DISCOUNT: 'Discount',
  OPENING_STOCK: 'Opening Stock',
  STOCK_COUNT: 'Stock Count',
  DISTRIBUTION: 'Distribution',
  DISTRIBUTION_CUSTOMER: 'Distribution Customer',
  DISTRIBUTION_PAYMENT: 'Payment',
  SUPPLIER: 'Supplier',
  SUPPLIER_COMPANY: 'Supplier Company',
  SUPPLIER_TARGET: 'Supplier Target',
  SUPPLIER_INCENTIVE: 'Supplier Incentive',
  TARGET: 'Target',
  LOCATION: 'Location',
  AUTH: 'Auth',
  ROLE_PERMISSIONS: 'Role Permissions',
  TRANSPORT: 'Transport',
};

// ── Action badge colours ──────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE:         'bg-green-100 text-green-800',
  UPDATE:         'bg-blue-100 text-blue-800',
  DELETE:         'bg-red-100 text-red-800',
  APPROVE:        'bg-purple-100 text-purple-800',
  REJECT:         'bg-orange-100 text-orange-800',
  CONFIRM:        'bg-teal-100 text-teal-800',
  RECORD_PAYMENT: 'bg-indigo-100 text-indigo-800',
  SUBMIT:         'bg-yellow-100 text-yellow-800',
  LOGIN:          'bg-gray-100 text-gray-800',
  LOGOUT:         'bg-gray-100 text-gray-600',
};

// ── All action options in filter dropdown ─────────────────────────────────────
const ACTION_OPTIONS = [
  'CREATE', 'UPDATE', 'DELETE',
  'APPROVE', 'REJECT', 'CONFIRM',
  'RECORD_PAYMENT', 'SUBMIT', 'LOGIN',
];

// ── Module → entity grouping for the entity dropdown ─────────────────────────
const ENTITY_OPTIONS = Object.entries(ENTITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ── JSON diff display ─────────────────────────────────────────────────────────
const JsonDiff: React.FC<{ label: string; data: any; colorClass: string }> = ({
  label,
  data,
  colorClass,
}) => {
  if (!data) return (
    <div className="flex-1">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</div>
      <div className="text-sm text-gray-400 italic">—</div>
    </div>
  );

  const parsed = typeof data === 'string' ? JSON.parse(data) : data;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</div>
      <div className={`rounded-md border ${colorClass} p-3 text-xs font-mono overflow-auto max-h-64`}>
        {Object.entries(parsed).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="text-gray-500 shrink-0">{k}:</span>
            <span className="break-all">{JSON.stringify(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Detail modal ──────────────────────────────────────────────────────────────
const DetailModal: React.FC<{ log: any; onClose: () => void }> = ({ log, onClose }) => {
  const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
  const actionColor = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Audit Log Detail</h2>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${actionColor}`}>
              {log.action}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Metadata */}
        <div className="px-6 py-3 bg-gray-50 border-b grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">Entity: </span>
            <span className="font-medium text-gray-900">{entityLabel}</span>
          </div>
          <div>
            <span className="text-gray-500">Entity ID: </span>
            <span className="font-mono text-gray-700">{log.entityId || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">User: </span>
            <span className="font-medium text-gray-900">
              {log.user?.username || 'System'}{' '}
              <span className="text-gray-400 font-normal">
                ({log.user?.role?.replace(/_/g, ' ') || 'N/A'})
              </span>
            </span>
          </div>
          <div>
            <span className="text-gray-500">IP: </span>
            <span className="text-gray-700">{log.ipAddress || '—'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Time: </span>
            <span className="text-gray-700">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Diff */}
        <div className="px-6 py-4 flex gap-4 overflow-auto flex-1">
          <JsonDiff
            label="Before"
            data={log.oldValues}
            colorClass="bg-red-50 border-red-200 text-red-900"
          />
          <JsonDiff
            label="After"
            data={log.newValues}
            colorClass="bg-green-50 border-green-200 text-green-900"
          />
        </div>

        <div className="px-6 py-3 border-t flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// ── CSV export helper ─────────────────────────────────────────────────────────
const exportToCSV = (logs: any[]) => {
  const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'IP Address'];
  const rows = logs.map((l) => [
    new Date(l.createdAt).toISOString(),
    l.user?.username || 'System',
    l.user?.role || '',
    l.action,
    l.entity,
    l.entityId || '',
    l.ipAddress || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Main component ────────────────────────────────────────────────────────────
export const AuditTrail: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const pageSize = 50;

  // Fetch audit logs
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-trail', currentPage, filters],
    queryFn: () =>
      adminService.getAuditTrail({
        page: currentPage,
        limit: pageSize,
        entity: filters.entity || undefined,
        action: filters.action || undefined,
        userId: filters.userId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }),
  });

  // Fetch user list for the user filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: () => adminService.getUsers({ limit: 200 } as any),
    staleTime: 5 * 60 * 1000,
  });

  const users = usersData?.data?.users || [];

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== '').length,
    [filters],
  );

  const logs = auditData?.data?.logs || [];
  const totalPages = auditData?.data?.pagination?.totalPages || 1;
  const totalRecords = auditData?.data?.pagination?.total || 0;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ entity: '', action: '', userId: '', startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const auditColumns = [
    {
      key: 'createdAt',
      title: 'Timestamp',
      render: (value: string) => (
        <div className="text-sm whitespace-nowrap">
          <div className="text-gray-900">{new Date(value).toLocaleDateString()}</div>
          <div className="text-gray-500 text-xs">{new Date(value).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: 'user',
      title: 'User',
      render: (value: any) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{value?.username || 'System'}</div>
          <div className="text-gray-500 text-xs">{value?.role?.replace(/_/g, ' ') || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'action',
      title: 'Action',
      render: (value: string) => (
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
            ACTION_COLORS[value] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'entity',
      title: 'Entity',
      render: (value: string) => (
        <span className="text-sm font-medium text-gray-900">
          {ENTITY_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: 'entityId',
      title: 'ID',
      render: (value: string) => (
        <span className="text-xs text-gray-400 font-mono">
          {value ? value.substring(0, 8) + '…' : '—'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      title: 'IP',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '—'}</span>
      ),
    },
    {
      key: 'id',
      title: '',
      render: (_: string, row: any) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600">System activity and security logs</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(logs)}
          disabled={logs.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* User dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <option value="">All Users</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Entity dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Entity</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
              >
                <option value="">All Entities</option>
                {ENTITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Action dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Table */}
        <Table data={logs} columns={auditColumns} />

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
            {' · '}
            <span className="font-medium">{totalRecords.toLocaleString()}</span> total records
          </p>
          <nav className="inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!hasPrev}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!hasNext}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};
