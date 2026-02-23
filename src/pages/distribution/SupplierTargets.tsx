/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Edit, Trash2, Filter, Calendar } from 'lucide-react';
import { supplierTargetService } from '../../services/supplierTargetService';
import supplierCompanyService from '../../services/supplierCompanyService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import toast from 'react-hot-toast';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const SupplierTargets: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

  const canManageTargets = ['SUPER_ADMIN', 'DISTRIBUTION_ADMIN'].includes(user?.role || '');

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['supplier-companies'],
    queryFn: () => supplierCompanyService.getAllSupplierCompanies(),
  });

  // Fetch targets with filters
  const { data: targetsResponse, isLoading } = useQuery({
    queryKey: ['supplier-targets', selectedSupplier, selectedYear, selectedMonth],
    queryFn: () =>
      supplierTargetService.getSupplierTargets({
        supplierCompanyId: selectedSupplier || undefined,
        year: selectedYear || undefined,
        month: selectedMonth ? Number(selectedMonth) : undefined,
      }),
  });

  const targets = targetsResponse?.data?.targets || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierTargetService.deleteSupplierTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-targets'] });
      toast.success('Target deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete target');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this target?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (target: any) => {
    setEditingTarget(target);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTarget(null);
    setShowModal(true);
  };

  const columns = [
    {
      key: 'supplierCompany',
      title: 'Supplier',
      render: (_value: any, record: any) => (
        <div>
          <div className="font-medium text-gray-900">{record.supplierCompany?.name}</div>
          <div className="text-sm text-gray-500">{record.supplierCompany?.code}</div>
        </div>
      ),
    },
    {
      key: 'period',
      title: 'Period',
      render: (_value: any, record: any) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span className="font-medium">
            {MONTHS.find((m) => m.value === record.month)?.label} {record.year}
          </span>
        </div>
      ),
    },
    {
      key: 'totalPacksTarget',
      title: 'Total Target (Packs)',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">{value.toLocaleString()}</span>
      ),
    },
    {
      key: 'creator',
      title: 'Created By',
      render: (_value: any, record: any) => (
        <div className="text-sm text-gray-600">{record.creator?.username}</div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value: string) => (
        <span className="text-sm text-gray-500">{value || '-'}</span>
      ),
    },
  ];

  if (canManageTargets) {
    columns.push({
      key: 'actions',
      title: 'Actions',
      render: (_value: any, record: any) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    } as any);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Targets</h1>
            <p className="text-sm text-gray-500">
              View and manage targets set for supplier companies
            </p>
          </div>
        </div>
        {canManageTargets && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Set New Target
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-3 mb-3">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suppliers</option>
              {suppliers?.map((supplier: any) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Months</option>
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Table data={targets} columns={columns} loading={isLoading} />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TargetModal
          target={editingTarget}
          suppliers={suppliers || []}
          onClose={() => {
            setShowModal(false);
            setEditingTarget(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['supplier-targets'] });
            setShowModal(false);
            setEditingTarget(null);
          }}
        />
      )}
    </div>
  );
};

// Target Modal Component
interface TargetModalProps {
  target: any;
  suppliers: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { key: 'CSD', label: 'Carbonated Soda Drink (CSD)', stateKey: 'catCSD' },
  { key: 'ED', label: 'Energy Drink (ED)', stateKey: 'catED' },
  { key: 'WATER', label: 'Water', stateKey: 'catWATER' },
  { key: 'JUICE', label: 'Juice', stateKey: 'catJUICE' },
] as const;

// Helper function to get working days (Mon-Sat) for a given month
const getWorkingDaysInMonth = (year: number, month: number) => {
  const days: { date: number; dayName: string }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    if (dayOfWeek !== 0) { // Exclude Sundays
      days.push({ date: day, dayName: dayNames[dayOfWeek] });
    }
  }
  return days;
};

const TargetModal: React.FC<TargetModalProps> = ({ target, suppliers, onClose, onSuccess }) => {
  const [showCategoryTargets, setShowCategoryTargets] = useState(true);

  const [formData, setFormData] = useState({
    supplierCompanyId: target?.supplierCompanyId || '',
    year: target?.year || new Date().getFullYear(),
    month: target?.month || 1,
    totalPacksTarget: target?.totalPacksTarget || 0,
    week1: target?.weeklyTargets?.week1 || 0,
    week2: target?.weeklyTargets?.week2 || 0,
    week3: target?.weeklyTargets?.week3 || 0,
    week4: target?.weeklyTargets?.week4 || 0,
    catCSD: target?.categoryTargets?.CSD || 0,
    catED: target?.categoryTargets?.ED || 0,
    catWATER: target?.categoryTargets?.WATER || 0,
    catJUICE: target?.categoryTargets?.JUICE || 0,
    notes: target?.notes || '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => supplierTargetService.createSupplierTarget(data),
    onSuccess: () => {
      toast.success('Target created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create target');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => supplierTargetService.updateSupplierTarget(target.id, data),
    onSuccess: () => {
      toast.success('Target updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update target');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weeklyTargets = {
      week1: Number(formData.week1),
      week2: Number(formData.week2),
      week3: Number(formData.week3),
      week4: Number(formData.week4),
    };

    // Only include categoryTargets if the toggle is on and at least one category has a value
    const catCSD = Number(formData.catCSD);
    const catED = Number(formData.catED);
    const catWATER = Number(formData.catWATER);
    const catJUICE = Number(formData.catJUICE);
    const hasCategoryTargets = showCategoryTargets && (catCSD > 0 || catED > 0 || catWATER > 0 || catJUICE > 0);
    const categoryTargets = hasCategoryTargets
      ? { CSD: catCSD, ED: catED, WATER: catWATER, JUICE: catJUICE }
      : undefined;

    const payload = {
      supplierCompanyId: formData.supplierCompanyId,
      year: Number(formData.year),
      month: Number(formData.month),
      totalPacksTarget: Number(formData.totalPacksTarget),
      weeklyTargets,
      ...(categoryTargets !== undefined && { categoryTargets }),
      notes: formData.notes || undefined,
    };

    if (target) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={target ? 'Edit Supplier Target' : 'Set New Supplier Target'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Company *
          </label>
          <select
            required
            value={formData.supplierCompanyId}
            onChange={(e) => setFormData({ ...formData, supplierCompanyId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={!!target}
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier: any) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
            <Input
              type="number"
              required
              min="2020"
              max="2100"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              disabled={!!target}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
            <select
              required
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!!target}
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Packs Target *
          </label>
          <Input
            type="number"
            required
            min="0"
            value={formData.totalPacksTarget}
            onChange={(e) =>
              setFormData({ ...formData, totalPacksTarget: Number(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weekly Breakdown
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((week) => (
              <div key={week}>
                <label className="block text-xs text-gray-600 mb-1">Week {week}</label>
                <Input
                  type="number"
                  min="0"
                  value={(formData as any)[`week${week}`]}
                  onChange={(e) =>
                    setFormData({ ...formData, [`week${week}`]: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Daily Breakdown (Mon-Sat, excluding Sundays) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Breakdown (Mon-Sat)
          </label>
          {(() => {
            const workingDays = getWorkingDaysInMonth(Number(formData.year), Number(formData.month));
            const totalTarget = Number(formData.totalPacksTarget);
            const dailyTarget = workingDays.length > 0 ? Math.round(totalTarget / workingDays.length) : 0;

            return (
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-500">
                    {workingDays.length} working days (excludes Sundays)
                  </span>
                  <span className="text-xs font-medium text-blue-600">
                    ~{dailyTarget.toLocaleString()} packs/day
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                  {workingDays.map(({ date, dayName }) => (
                    <div
                      key={date}
                      className={`text-center p-1.5 rounded text-xs ${
                        dayName === 'Sat'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{date}</div>
                      <div className="text-[10px] opacity-75">{dayName}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Category Targets toggle */}
        <div className="border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCategoryTargets}
              onChange={(e) => {
                setShowCategoryTargets(e.target.checked);
                if (!e.target.checked) {
                  setFormData({ ...formData, catCSD: 0, catED: 0, catWATER: 0, catJUICE: 0 });
                }
              }}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Set targets by category (optional)
            </span>
          </label>

          {showCategoryTargets && (
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <label className="block text-xs text-gray-600 mb-1">{cat.label}</label>
                    <Input
                      type="number"
                      min="0"
                      value={(formData as any)[cat.stateKey]}
                      onChange={(e) =>
                        setFormData({ ...formData, [cat.stateKey]: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              {(() => {
                const catSum = Number(formData.catCSD) + Number(formData.catED) + Number(formData.catWATER) + Number(formData.catJUICE);
                const total = Number(formData.totalPacksTarget);
                if (catSum === 0) return null;
                return (
                  <p className={`mt-2 text-xs ${catSum === total ? 'text-green-600' : 'text-amber-600'}`}>
                    Category total: {catSum.toLocaleString()} packs
                    {catSum !== total && total > 0 && ` (total target is ${total.toLocaleString()})`}
                    {catSum === total && ' ✓ Matches total target'}
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : target
              ? 'Update Target'
              : 'Create Target'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
