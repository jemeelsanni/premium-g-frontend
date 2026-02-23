/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  Package,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Target,
  Plus,
  Calendar,
  Trash2,
} from 'lucide-react';
import supplierCompanyService from '../../services/supplierCompanyService';
import { distributionService } from '../../services/distributionService';
import { supplierTargetService } from '../../services/supplierTargetService';
import { supplierIncentiveService } from '../../services/supplierIncentiveService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

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

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'targets' | 'profitability'>('overview');
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [editingIncentive, setEditingIncentive] = useState<any>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | ''>('');

  // Revenue filters for overview tab
  const [revenueFilterType, setRevenueFilterType] = useState<'all' | 'month' | 'range'>('all');
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear());
  const [revenueMonth, setRevenueMonth] = useState<number | ''>(new Date().getMonth() + 1);
  const [revenueStartDate, setRevenueStartDate] = useState('');
  const [revenueEndDate, setRevenueEndDate] = useState('');

  const canManageTargets = ['SUPER_ADMIN', 'DISTRIBUTION_ADMIN'].includes(user?.role || '');

  // Fetch supplier details
  const { data: supplier, isLoading: loadingSupplier } = useQuery({
    queryKey: ['supplier-company', id],
    queryFn: async () => {
      const suppliers = await supplierCompanyService.getAllSupplierCompanies();
      return suppliers.find((s: any) => s.id === id);
    },
    enabled: !!id,
  });

  // Fetch supplier products
  const { data: supplierProductsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: ['supplier-products', id],
    queryFn: () => distributionService.getSupplierProductsBySupplier(id!, true),
    enabled: !!id,
  });

  console.log('[SUPPLIER DETAIL] supplierProductsResponse:', supplierProductsResponse);
  const supplierProducts = supplierProductsResponse?.data?.data?.products || [];
  console.log('[SUPPLIER DETAIL] supplierProducts:', supplierProducts);

  // Fetch supplier targets
  const { data: targetsResponse, isLoading: loadingTargets } = useQuery({
    queryKey: ['supplier-targets', id],
    queryFn: () => supplierTargetService.getTargetsBySupplier(id!),
    enabled: !!id && activeTab === 'targets',
  });

  const targets = targetsResponse?.data?.targets || targetsResponse?.targets || [];

  // Fetch supplier incentives
  const { data: incentivesResponse, isLoading: loadingIncentives } = useQuery({
    queryKey: ['supplier-incentives', id, filterYear, filterMonth],
    queryFn: () => supplierIncentiveService.getIncentivesBySupplier(id!, filterYear, filterMonth ? Number(filterMonth) : undefined),
    enabled: !!id && activeTab === 'profitability',
  });

  const incentives = incentivesResponse?.data?.incentives || [];

  // Fetch monthly revenue for overview tab
  const { data: monthlyRevenueResponse, isLoading: loadingRevenue } = useQuery({
    queryKey: ['supplier-monthly-revenue', id, revenueFilterType, revenueYear, revenueMonth, revenueStartDate, revenueEndDate],
    queryFn: () => {
      const filters: any = {};
      if (revenueFilterType === 'month' && revenueMonth) {
        filters.year = revenueYear;
        filters.month = revenueMonth;
      } else if (revenueFilterType === 'range') {
        if (revenueStartDate) filters.startDate = revenueStartDate;
        if (revenueEndDate) filters.endDate = revenueEndDate;
      }
      return supplierIncentiveService.getMonthlyRevenue(id!, filters);
    },
    enabled: !!id && activeTab === 'overview',
  });

  const monthlyRevenueData = monthlyRevenueResponse?.data || {
    totalRevenue: 0,
    totalOrders: 0,
    monthlyRevenue: []
  };

  // Delete target mutation
  const deleteMutation = useMutation({
    mutationFn: (targetId: string) => supplierTargetService.deleteSupplierTarget(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-targets'] });
      toast.success('Target deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete target');
    },
  });

  const handleDeleteTarget = (targetId: string) => {
    if (confirm('Are you sure you want to delete this target?')) {
      deleteMutation.mutate(targetId);
    }
  };

  const handleEditTarget = (target: any) => {
    setEditingTarget(target);
    setShowTargetModal(true);
  };

  const handleCreateTarget = () => {
    setEditingTarget(null);
    setShowTargetModal(true);
  };

  // Delete incentive mutation
  const deleteIncentiveMutation = useMutation({
    mutationFn: (incentiveId: string) => supplierIncentiveService.deleteSupplierIncentive(incentiveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-incentives'] });
      toast.success('Incentive deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete incentive');
    },
  });

  const handleDeleteIncentive = (incentiveId: string) => {
    if (confirm('Are you sure you want to delete this incentive record?')) {
      deleteIncentiveMutation.mutate(incentiveId);
    }
  };

  const handleEditIncentive = (incentive: any) => {
    setEditingIncentive(incentive);
    setShowIncentiveModal(true);
  };

  const handleCreateIncentive = () => {
    setEditingIncentive(null);
    setShowIncentiveModal(true);
  };

  if (loadingSupplier) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Supplier not found</p>
        <Button onClick={() => navigate('/distribution/suppliers')} className="mt-4">
          Back to Suppliers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/distribution/suppliers')}
                className="text-white hover:text-gray-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{supplier.name}</h1>
                <p className="text-blue-100">Code: {supplier.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {supplier.isActive ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <XCircle className="w-4 h-4 mr-1" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Products ({supplierProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('targets')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'targets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Targets ({targets.length})
            </button>
            <button
              onClick={() => setActiveTab('profitability')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'profitability'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profitability ({incentives.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/distribution/suppliers')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Supplier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplier.email && (
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email Address</p>
                    <p className="text-sm text-gray-900">{supplier.email}</p>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-start gap-3">
                  <div className="bg-green-50 p-2 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                    <p className="text-sm text-gray-900">{supplier.phone}</p>
                  </div>
                </div>
              )}

              {supplier.contactPerson && (
                <div className="flex items-start gap-3">
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                    <p className="text-sm text-gray-900">{supplier.contactPerson}</p>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start gap-3">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm text-gray-900">{supplier.address}</p>
                  </div>
                </div>
              )}
            </div>

            {supplier.notes && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {supplier.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() =>
                  navigate('/distribution/supplier-products', {
                    state: { selectedSupplierId: supplier.id },
                  })
                }
                className="w-full flex items-center justify-center gap-2"
              >
                <Package className="h-5 w-5" />
                Manage Products
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/distribution/orders/create')}
                className="w-full flex items-center justify-center gap-2"
              >
                Create Order
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Products</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {supplierProducts.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Products</span>
                  <span className="text-sm font-semibold text-green-600">
                    {supplierProducts.filter((p: any) => p.isAvailable).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Revenue Section - Overview Tab Only */}
      {activeTab === 'overview' && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Revenue</h2>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter By</label>
              <select
                value={revenueFilterType}
                onChange={(e) => setRevenueFilterType(e.target.value as 'all' | 'month' | 'range')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Time</option>
                <option value="month">Specific Month</option>
                <option value="range">Date Range</option>
              </select>
            </div>

            {revenueFilterType === 'month' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <Input
                    type="number"
                    min="2020"
                    max="2100"
                    value={revenueYear}
                    onChange={(e) => setRevenueYear(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={revenueMonth}
                    onChange={(e) => setRevenueMonth(e.target.value ? Number(e.target.value) : '')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Month</option>
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {revenueFilterType === 'range' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={revenueStartDate}
                    onChange={(e) => setRevenueStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={revenueEndDate}
                    onChange={(e) => setRevenueEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-900">
                ₦{monthlyRevenueData.totalRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-green-900">{monthlyRevenueData.totalOrders.toLocaleString()}</p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {loadingRevenue ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : monthlyRevenueData.monthlyRevenue.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No revenue data</h3>
              <p className="text-gray-500">
                {revenueFilterType === 'all'
                  ? 'No orders have been placed with this supplier yet'
                  : 'No orders found for the selected period'}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Breakdown</h3>
              <Table
                columns={[
                  {
                    key: 'period',
                    title: 'Period',
                    render: (_value, record: any) => (
                      <div>
                        <span className="font-medium">
                          {MONTHS.find((m) => m.value === record.month)?.label} {record.year}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'revenue',
                    title: 'Revenue',
                    render: (_value, record: any) => (
                      <div className="font-semibold text-blue-600">
                        ₦{record.revenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    ),
                  },
                  {
                    key: 'orderCount',
                    title: 'Orders',
                    render: (_value, record: any) => (
                      <div className="text-gray-700">{record.orderCount} orders</div>
                    ),
                  },
                  {
                    key: 'avgOrderValue',
                    title: 'Avg Order Value',
                    render: (_value, record: any) => {
                      const avg = record.orderCount > 0 ? record.revenue / record.orderCount : 0;
                      return (
                        <div className="text-gray-700">
                          ₦{avg.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      );
                    },
                  },
                ]}
                data={monthlyRevenueData.monthlyRevenue}
                loading={loadingRevenue}
              />
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Supplier Products</h2>
            <Button
              onClick={() =>
                navigate('/distribution/supplier-products', {
                  state: { selectedSupplierId: supplier.id },
                })
              }
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : supplierProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products configured</h3>
              <p className="text-gray-500 mb-4">
                Add products to this supplier's catalog to get started
              </p>
              <Button
                onClick={() =>
                  navigate('/distribution/supplier-products', {
                    state: { selectedSupplierId: supplier.id },
                  })
                }
              >
                Add Products
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cost/Pack
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Min Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Lead Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierProducts.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-500">{item.product.productNo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ₦{item.supplierCostPerPack.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minimumOrderPacks ? `${item.minimumOrderPacks} packs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.leadTimeDays ? `${item.leadTimeDays} days` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isAvailable ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Unavailable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Supplier Targets</h2>
            {canManageTargets && (
              <Button onClick={handleCreateTarget}>
                <Plus className="h-4 w-4 mr-2" />
                Set New Target
              </Button>
            )}
          </div>

          {loadingTargets ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No targets set</h3>
              <p className="text-gray-500 mb-4">
                {canManageTargets
                  ? 'Set targets for this supplier to track their monthly performance'
                  : 'No targets have been set for this supplier yet'}
              </p>
              {canManageTargets && (
                <Button onClick={handleCreateTarget}>
                  <Plus className="h-4 w-4 mr-2" />
                  Set First Target
                </Button>
              )}
            </div>
          ) : (
            <Table
              data={targets}
              columns={[
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
                  key: 'weeklyTargets',
                  title: 'Weekly Breakdown',
                  render: (value: any) => (
                    <div className="text-sm text-gray-600">
                      W1: {value.week1} | W2: {value.week2} | W3: {value.week3} | W4: {value.week4}
                    </div>
                  ),
                },
                {
                  key: 'notes',
                  title: 'Notes',
                  render: (value: string) => (
                    <span className="text-sm text-gray-500">{value || '-'}</span>
                  ),
                },
                ...(canManageTargets
                  ? [
                      {
                        key: 'actions',
                        title: 'Actions',
                        render: (_value: any, record: any) => (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTarget(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTarget(record.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ),
                      } as any,
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      )}

      {/* Profitability Tab */}
      {activeTab === 'profitability' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Supplier Incentives & Profitability</h2>
            <div className="flex items-center gap-3">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Months</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              {canManageTargets && (
                <Button onClick={handleCreateIncentive}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Incentive
                </Button>
              )}
            </div>
          </div>

          {loadingIncentives ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : incentives.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No incentive records</h3>
              <p className="text-gray-500 mb-4">
                {canManageTargets
                  ? 'Add incentive records to track profitability from this supplier'
                  : 'No incentive records have been added for this supplier yet'}
              </p>
              {canManageTargets && (
                <Button onClick={handleCreateIncentive}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Record
                </Button>
              )}
            </div>
          ) : (
            <Table
              data={incentives}
              columns={[
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
                  key: 'incentivePercentage',
                  title: 'Incentive %',
                  render: (value: number) => (
                    <span className="font-semibold text-blue-600">{value}%</span>
                  ),
                },
                {
                  key: 'totalRevenue',
                  title: 'Revenue',
                  render: (value: number) => (
                    <span className="font-semibold text-green-600">
                      ₦{value?.toLocaleString() || 0}
                    </span>
                  ),
                },
                {
                  key: 'calculatedIncentive',
                  title: 'Calculated Incentive',
                  render: (value: number) => (
                    <span className="font-semibold text-purple-600">
                      ₦{value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  ),
                },
                {
                  key: 'actualIncentivePaid',
                  title: 'Actual Paid',
                  render: (value: number) => (
                    <span className="font-semibold text-indigo-600">
                      ₦{value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                    </span>
                  ),
                },
                {
                  key: 'variance',
                  title: 'Variance',
                  render: (value: number, record: any) => (
                    <div>
                      <span className={`font-semibold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {value >= 0 ? '+' : ''}₦{value?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0}
                      </span>
                      <div className="text-xs text-gray-500">
                        ({record.variancePercentage >= 0 ? '+' : ''}{record.variancePercentage?.toFixed(1) || 0}%)
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'notes',
                  title: 'Notes',
                  render: (value: string) => (
                    <span className="text-sm text-gray-500">{value || '-'}</span>
                  ),
                },
                ...(canManageTargets
                  ? [
                      {
                        key: 'actions',
                        title: 'Actions',
                        render: (_value: any, record: any) => (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditIncentive(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteIncentive(record.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ),
                      } as any,
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <TargetModal
          target={editingTarget}
          supplierId={id!}
          supplierName={supplier?.name || ''}
          supplierCategories={(supplier?.productCategories || []).map((c: any) => c.categoryType)}
          onClose={() => {
            setShowTargetModal(false);
            setEditingTarget(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['supplier-targets'] });
            setShowTargetModal(false);
            setEditingTarget(null);
          }}
        />
      )}

      {/* Incentive Modal */}
      {showIncentiveModal && (
        <IncentiveModal
          incentive={editingIncentive}
          supplierId={id!}
          supplierName={supplier?.name || ''}
          onClose={() => {
            setShowIncentiveModal(false);
            setEditingIncentive(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['supplier-incentives'] });
            setShowIncentiveModal(false);
            setEditingIncentive(null);
          }}
        />
      )}
    </div>
  );
};

// Target Modal Component
interface TargetModalProps {
  target: any;
  supplierId: string;
  supplierName: string;
  supplierCategories: string[]; // e.g. ['CSD', 'WATER']
  onClose: () => void;
  onSuccess: () => void;
}

const TARGET_CATEGORIES = [
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

const TargetModal: React.FC<TargetModalProps> = ({
  target,
  supplierId,
  supplierName,
  supplierCategories,
  onClose,
  onSuccess,
}) => {
  // Only show categories this supplier actually carries
  const visibleCategories = TARGET_CATEGORIES.filter((c) =>
    supplierCategories.length === 0 || supplierCategories.includes(c.key)
  );
  const [showCategoryTargets, setShowCategoryTargets] = useState(true);
  const [formData, setFormData] = useState({
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

    const catCSD = Number(formData.catCSD);
    const catED = Number(formData.catED);
    const catWATER = Number(formData.catWATER);
    const catJUICE = Number(formData.catJUICE);
    const hasCategoryTargets = showCategoryTargets && (catCSD > 0 || catED > 0 || catWATER > 0 || catJUICE > 0);
    const categoryTargets = hasCategoryTargets
      ? { CSD: catCSD, ED: catED, WATER: catWATER, JUICE: catJUICE }
      : undefined;

    const payload = {
      supplierCompanyId: supplierId,
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
      title={target ? `Edit Target - ${supplierName}` : `Set New Target - ${supplierName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
                {visibleCategories.map((cat) => (
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
                const catSum = visibleCategories.reduce((s, c) => s + Number((formData as any)[c.stateKey]), 0);
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

// Incentive Modal Component
interface IncentiveModalProps {
  incentive: any;
  supplierId: string;
  supplierName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const IncentiveModal: React.FC<IncentiveModalProps> = ({
  incentive,
  supplierId,
  supplierName,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    year: incentive?.year || new Date().getFullYear(),
    month: incentive?.month || 1,
    incentivePercentage: incentive?.incentivePercentage || 0,
    actualIncentivePaid: incentive?.actualIncentivePaid || '',
    notes: incentive?.notes || '',
  });

  // Fetch revenue for the selected month/year
  const { data: revenueResponse, isLoading: loadingRevenue } = useQuery({
    queryKey: ['supplier-revenue', supplierId, formData.year, formData.month],
    queryFn: async () => {
      const response = await supplierIncentiveService.getSupplierRevenue(
        supplierId,
        formData.year,
        formData.month
      );
      return response;
    },
    enabled: !!supplierId,
  });

  const revenue = revenueResponse?.data?.totalRevenue || 0;
  const calculatedIncentive = (revenue * Number(formData.incentivePercentage)) / 100;
  const variance = formData.actualIncentivePaid
    ? Number(formData.actualIncentivePaid) - calculatedIncentive
    : 0;

  const createMutation = useMutation({
    mutationFn: (data: any) => supplierIncentiveService.createSupplierIncentive(data),
    onSuccess: () => {
      toast.success('Incentive record created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create incentive');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => supplierIncentiveService.updateSupplierIncentive(incentive.id, data),
    onSuccess: () => {
      toast.success('Incentive record updated successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update incentive');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      supplierCompanyId: supplierId,
      year: Number(formData.year),
      month: Number(formData.month),
      incentivePercentage: Number(formData.incentivePercentage),
      actualIncentivePaid: formData.actualIncentivePaid ? Number(formData.actualIncentivePaid) : undefined,
      notes: formData.notes || undefined,
    };

    if (incentive) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={incentive ? `Edit Incentive - ${supplierName}` : `Add Incentive - ${supplierName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={!!incentive}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
            <select
              required
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={!!incentive}
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Revenue Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Revenue for {MONTHS.find(m => m.value === formData.month)?.label} {formData.year}
          </h4>
          {loadingRevenue ? (
            <p className="text-sm text-blue-700">Loading revenue data...</p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Total Revenue:</span>
                  <span className="text-lg font-bold text-blue-900">
                    ₦{revenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {revenueResponse?.data?.orderCount > 0 && (
                  <p className="text-xs text-blue-600">
                    Based on {revenueResponse.data.orderCount} order{revenueResponse.data.orderCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Incentive Percentage (%) *
          </label>
          <Input
            type="number"
            required
            min="0"
            max="100"
            step="0.01"
            value={formData.incentivePercentage}
            onChange={(e) =>
              setFormData({ ...formData, incentivePercentage: Number(e.target.value) })
            }
            placeholder="e.g., 2.5 for 2.5%"
          />
          <p className="text-xs text-gray-500 mt-1">
            The percentage of revenue you receive as incentive from this supplier
          </p>
        </div>

        {/* Calculated Incentive Display */}
        {formData.incentivePercentage > 0 && revenue > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-900 mb-2">Calculated Incentive</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">
                {formData.incentivePercentage}% of ₦{revenue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xl font-bold text-green-900">
                ₦{calculatedIncentive.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actual Incentive Paid (₦)
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.actualIncentivePaid}
            onChange={(e) =>
              setFormData({ ...formData, actualIncentivePaid: e.target.value })
            }
            placeholder="Enter amount received from supplier"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty if not yet received. This will be compared with the calculated incentive.
          </p>
        </div>

        {/* Variance Display */}
        {formData.actualIncentivePaid && calculatedIncentive > 0 && (
          <div className={`border rounded-lg p-4 ${
            variance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`text-sm font-semibold mb-2 ${
              variance >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              Variance Analysis
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className={variance >= 0 ? 'text-green-700' : 'text-red-700'}>
                  Calculated Incentive:
                </span>
                <span className="font-semibold">
                  ₦{calculatedIncentive.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className={variance >= 0 ? 'text-green-700' : 'text-red-700'}>
                  Actual Paid:
                </span>
                <span className="font-semibold">
                  ₦{Number(formData.actualIncentivePaid).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-semibold ${
                    variance >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Variance:
                  </span>
                  <span className={`text-lg font-bold ${
                    variance >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {variance >= 0 ? '+' : ''}₦{variance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  {variance >= 0
                    ? `You received ₦${variance.toLocaleString('en-NG', { minimumFractionDigits: 2 })} more than calculated`
                    : `You received ₦${Math.abs(variance).toLocaleString('en-NG', { minimumFractionDigits: 2 })} less than calculated`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

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
              : incentive
              ? 'Update Incentive'
              : 'Create Incentive'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierDetail;
