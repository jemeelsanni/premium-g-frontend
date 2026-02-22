/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Check,
  X,
  Filter,
  Package,
  AlertTriangle,
  Edit3,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { warehouseService, ManualDailyOpeningStock as ManualStockEntry, DailyOpeningStockStatus } from '../../services/warehouseService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { globalToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';

// Validation schemas
const manualStockSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  stockDate: z.string().min(1, 'Date is required'),
  manualPacks: z.number().min(0, 'Must be 0 or greater'),
  notes: z.string().optional(),
});

const editRequestSchema = z.object({
  newManualPacks: z.number().min(0, 'Must be 0 or greater'),
  editReason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
});

type ManualStockFormData = z.infer<typeof manualStockSchema>;
type EditRequestFormData = z.infer<typeof editRequestSchema>;

const ManualDailyOpeningStock: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DailyOpeningStockStatus | 'ALL'>('ALL');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditRequestModalOpen, setIsEditRequestModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ManualStockEntry | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'entries' | 'edit-requests'>('entries');

  const queryClient = useQueryClient();
  const pageSize = 20;
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'WAREHOUSE_ADMIN';

  // Form for submitting manual stock
  const {
    register: registerSubmit,
    handleSubmit: handleSubmitForm,
    reset: resetSubmitForm,
    formState: { errors: submitErrors, isSubmitting: isSubmittingForm }
  } = useForm<ManualStockFormData>({
    resolver: zodResolver(manualStockSchema),
    defaultValues: {
      stockDate: format(new Date(), 'yyyy-MM-dd'),
      manualPacks: 0,
    }
  });

  // Form for edit requests
  const {
    register: registerEdit,
    handleSubmit: handleEditForm,
    reset: resetEditForm,
    setValue: setEditValue,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit }
  } = useForm<EditRequestFormData>({
    resolver: zodResolver(editRequestSchema),
  });

  // Fetch manual stock entries
  const { data: entriesData, isLoading: loadingEntries } = useQuery({
    queryKey: ['manual-daily-opening-stock', currentPage, pageSize, statusFilter],
    queryFn: () => warehouseService.getManualDailyOpeningStock({
      page: currentPage,
      limit: pageSize,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  // Fetch edit requests (for admin)
  const { data: editRequestsData, isLoading: loadingEditRequests } = useQuery({
    queryKey: ['manual-stock-edit-requests', currentPage, pageSize],
    queryFn: () => warehouseService.getManualStockEditRequests({
      page: currentPage,
      limit: pageSize,
      status: 'PENDING',
    }),
    enabled: isAdmin && activeTab === 'edit-requests',
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['warehouse-products'],
    queryFn: () => warehouseService.getProducts(),
  });

  // Fetch comparison data
  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ['manual-stock-comparison', selectedDate],
    queryFn: () => warehouseService.getManualStockComparison(selectedDate),
    enabled: isComparisonModalOpen,
  });

  // Fetch summary stats
  const { data: summaryStats } = useQuery({
    queryKey: ['manual-stock-summary-stats'],
    queryFn: () => warehouseService.getManualStockSummaryStats(),
  });

  // Submit manual stock mutation
  const submitMutation = useMutation({
    mutationFn: (data: ManualStockFormData) => warehouseService.submitManualDailyOpeningStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-daily-opening-stock'] });
      queryClient.invalidateQueries({ queryKey: ['manual-stock-summary-stats'] });
      globalToast.success('Manual stock count submitted successfully!');
      handleCloseSubmitModal();
    },
    onError: (error: any) => {
      globalToast.error(error.response?.data?.message || 'Failed to submit stock count');
    }
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: string; adminNotes?: string }) =>
      warehouseService.approveManualDailyOpeningStock(id, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-daily-opening-stock'] });
      queryClient.invalidateQueries({ queryKey: ['manual-stock-summary-stats'] });
      globalToast.success('Entry approved successfully!');
      setIsReviewModalOpen(false);
      setSelectedEntry(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      globalToast.error(error.response?.data?.message || 'Failed to approve entry');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      warehouseService.rejectManualDailyOpeningStock(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-daily-opening-stock'] });
      queryClient.invalidateQueries({ queryKey: ['manual-stock-summary-stats'] });
      globalToast.success('Entry rejected!');
      setIsReviewModalOpen(false);
      setSelectedEntry(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      globalToast.error(error.response?.data?.message || 'Failed to reject entry');
    }
  });

  // Edit request mutation
  const editRequestMutation = useMutation({
    mutationFn: (data: EditRequestFormData & { id: string }) =>
      warehouseService.requestManualStockEdit(data.id, {
        newManualPacks: data.newManualPacks,
        editReason: data.editReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-daily-opening-stock'] });
      globalToast.success('Edit request submitted for approval!');
      setIsEditRequestModalOpen(false);
      setSelectedEntry(null);
      resetEditForm();
    },
    onError: (error: any) => {
      globalToast.error(error.response?.data?.message || 'Failed to submit edit request');
    }
  });

  // Approve edit request mutation
  const approveEditMutation = useMutation({
    mutationFn: (id: string) => warehouseService.approveManualStockEditRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-stock-edit-requests'] });
      queryClient.invalidateQueries({ queryKey: ['manual-daily-opening-stock'] });
      globalToast.success('Edit request approved!');
    },
    onError: (error: any) => {
      globalToast.error(error.response?.data?.message || 'Failed to approve edit request');
    }
  });

  // Reject edit request mutation
  const rejectEditMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      warehouseService.rejectManualStockEditRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-stock-edit-requests'] });
      globalToast.success('Edit request rejected!');
    },
    onError: (error: any) => {
      globalToast.error(error.response?.data?.message || 'Failed to reject edit request');
    }
  });

  const handleCloseSubmitModal = () => {
    setIsSubmitModalOpen(false);
    resetSubmitForm();
  };

  const onSubmitStock = (data: ManualStockFormData) => {
    submitMutation.mutate(data);
  };

  const handleReview = (entry: ManualStockEntry, action: 'approve' | 'reject') => {
    setSelectedEntry(entry);
    setReviewAction(action);
    setIsReviewModalOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedEntry) return;

    if (reviewAction === 'approve') {
      approveMutation.mutate({ id: selectedEntry.id, adminNotes: adminNotes || undefined });
    } else {
      if (!rejectionReason.trim()) {
        globalToast.error('Please provide a rejection reason');
        return;
      }
      rejectMutation.mutate({ id: selectedEntry.id, rejectionReason });
    }
  };

  const handleRequestEdit = (entry: ManualStockEntry) => {
    setSelectedEntry(entry);
    setEditValue('newManualPacks', entry.manualPacks);
    setIsEditRequestModalOpen(true);
  };

  const onSubmitEditRequest = (data: EditRequestFormData) => {
    if (!selectedEntry) return;
    editRequestMutation.mutate({ ...data, id: selectedEntry.id });
  };

  const getStatusBadge = (status: DailyOpeningStockStatus) => {
    const styles: Record<DailyOpeningStockStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const icons: Record<DailyOpeningStockStatus, React.ReactNode> = {
      PENDING: <Clock className="h-3 w-3 mr-1" />,
      APPROVED: <CheckCircle className="h-3 w-3 mr-1" />,
      REJECTED: <XCircle className="h-3 w-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const entries = entriesData?.data?.entries || [];
  const editRequests = editRequestsData?.data?.editRequests || [];
  const pagination = entriesData?.data?.pagination;
  const stats = summaryStats?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Manual Daily Opening Stock
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Submit and manage daily manual stock counts for verification
          </p>
        </div>
        <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
          <Button
            variant="outline"
            onClick={() => setIsComparisonModalOpen(true)}
            className="inline-flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Comparison
          </Button>
          <Button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Stock Count
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats?.today && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Submissions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.today.submitted ?? 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.today.pending ?? 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.today.approved ?? 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Edit Requests</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.pendingEditRequests ?? 0}</p>
              </div>
              <Edit3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Admin */}
      {isAdmin && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => { setActiveTab('entries'); setCurrentPage(1); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'entries'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stock Entries
            </button>
            <button
              onClick={() => { setActiveTab('edit-requests'); setCurrentPage(1); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'edit-requests'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Edit Requests
              {stats && stats.pendingEditRequests > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingEditRequests}
                </span>
              )}
            </button>
          </nav>
        </div>
      )}

      {activeTab === 'entries' && (
        <>
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <div className="flex gap-2">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status as DailyOpeningStockStatus | 'ALL');
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      statusFilter === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Manual Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      System Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Variance
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted By
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingEntries ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                          <span className="ml-2 text-gray-500">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No stock entries found
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const hasVariance = entry.variancePacks !== 0;
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {format(new Date(entry.stockDate), 'dd MMM yyyy')}
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{entry.product.name}</p>
                              <p className="text-xs text-gray-500">{entry.product.productNo}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm text-gray-900 font-medium">
                              {entry.manualPacks} packs
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm text-gray-900">
                              {entry.systemPacks} packs
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className={`text-sm font-medium ${hasVariance ? 'text-red-600' : 'text-green-600'}`}>
                              {hasVariance ? (
                                <div className="flex items-center justify-end gap-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{entry.variancePacks > 0 ? '+' : ''}{entry.variancePacks}</span>
                                </div>
                              ) : (
                                <span>Match</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {getStatusBadge(entry.status)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {entry.submittedByUser.username}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              {isAdmin && entry.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(entry, 'approve')}
                                    className="text-green-600 hover:bg-green-50"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReview(entry, 'reject')}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {entry.status === 'APPROVED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRequestEdit(entry)}
                                  className="text-purple-600 hover:bg-purple-50"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={currentPage === pagination.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'edit-requests' && isAdmin && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Old Values
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    New Values
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requested By
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingEditRequests ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                        <span className="ml-2 text-gray-500">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : editRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No pending edit requests
                    </td>
                  </tr>
                ) : (
                  editRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {format(new Date(request.dailyOpeningStock.stockDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.dailyOpeningStock.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.dailyOpeningStock.product.productNo}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-500">
                        {request.oldManualPacks} packs
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900 font-medium">
                        {request.newManualPacks} packs
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate" title={request.editReason}>
                        {request.editReason}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {request.requestedByUser.username}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveEditMutation.mutate(request.id)}
                            disabled={approveEditMutation.isPending}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) {
                                rejectEditMutation.mutate({ id: request.id, reason });
                              }
                            }}
                            disabled={rejectEditMutation.isPending}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Stock Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={handleCloseSubmitModal}
        title="Submit Manual Stock Count"
      >
        <form onSubmit={handleSubmitForm(onSubmitStock)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product *
            </label>
            <select
              {...registerSubmit('productId')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="">Select a product</option>
              {products?.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.productNo} - {product.name}
                </option>
              ))}
            </select>
            {submitErrors.productId && (
              <p className="mt-1 text-sm text-red-600">{submitErrors.productId.message}</p>
            )}
          </div>

          <Input
            label="Stock Date *"
            type="date"
            {...registerSubmit('stockDate')}
            error={submitErrors.stockDate?.message}
          />

          <Input
            label="Manual Pack Count *"
            type="number"
            {...registerSubmit('manualPacks', { valueAsNumber: true })}
            error={submitErrors.manualPacks?.message}
            placeholder="Enter the number of packs counted"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              {...registerSubmit('notes')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseSubmitModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingForm || submitMutation.isPending}>
              {isSubmittingForm || submitMutation.isPending ? 'Submitting...' : 'Submit Count'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} Stock Entry`}
      >
        <div className="space-y-4">
          {selectedEntry && (
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <p><strong>Product:</strong> {selectedEntry.product.name}</p>
              <p><strong>Date:</strong> {format(new Date(selectedEntry.stockDate), 'dd MMM yyyy')}</p>
              <p><strong>Manual Count:</strong> {selectedEntry.manualPacks} packs</p>
              <p><strong>System Count:</strong> {selectedEntry.systemPacks} packs</p>
              <p><strong>Variance:</strong> {selectedEntry.variancePacks > 0 ? '+' : ''}{selectedEntry.variancePacks} packs</p>
              <p><strong>Submitted By:</strong> {selectedEntry.submittedByUser.username}</p>
            </div>
          )}

          {reviewAction === 'approve' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Optional notes..."
              />
            </div>
          )}

          {reviewAction === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Please provide a reason for rejection..."
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReview}
              disabled={approveMutation.isPending || rejectMutation.isPending || (reviewAction === 'reject' && !rejectionReason)}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {approveMutation.isPending || rejectMutation.isPending
                ? 'Processing...'
                : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Request Modal */}
      <Modal
        isOpen={isEditRequestModalOpen}
        onClose={() => { setIsEditRequestModalOpen(false); resetEditForm(); }}
        title="Request Stock Count Edit"
      >
        <form onSubmit={handleEditForm(onSubmitEditRequest)} className="space-y-4">
          {selectedEntry && (
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <p><strong>Product:</strong> {selectedEntry.product.name}</p>
              <p><strong>Date:</strong> {format(new Date(selectedEntry.stockDate), 'dd MMM yyyy')}</p>
              <p><strong>Current Value:</strong> {selectedEntry.manualPacks} packs</p>
            </div>
          )}

          <Input
            label="New Pack Count *"
            type="number"
            {...registerEdit('newManualPacks', { valueAsNumber: true })}
            error={editErrors.newManualPacks?.message}
            placeholder="Enter corrected pack count"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Edit *
            </label>
            <textarea
              {...registerEdit('editReason')}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Please explain why this edit is needed..."
            />
            {editErrors.editReason && (
              <p className="mt-1 text-sm text-red-600">{editErrors.editReason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsEditRequestModalOpen(false); resetEditForm(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingEdit || editRequestMutation.isPending}>
              {isSubmittingEdit || editRequestMutation.isPending ? 'Submitting...' : 'Submit Edit Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Comparison Modal */}
      <Modal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        title="Manual vs System Stock Comparison"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          {loadingComparison ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-500">Loading comparison data...</span>
            </div>
          ) : comparisonData?.data ? (
            <>
              {/* Summary */}
              {comparisonData.data.summary && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Summary for {format(new Date(selectedDate), 'dd MMM yyyy')}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>Total Products: {comparisonData.data.summary.totalProducts ?? 0}</p>
                    <p>Submitted: {comparisonData.data.summary.submittedCount ?? 0}</p>
                    <p>Pending: {comparisonData.data.summary.pendingCount ?? 0}</p>
                    <p>Approved: {comparisonData.data.summary.approvedCount ?? 0}</p>
                    <p>With Variance: {comparisonData.data.summary.productsWithVariance ?? 0}</p>
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              {comparisonData.data.comparison && comparisonData.data.comparison.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Manual</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">System</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Variance</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonData.data.comparison.map((item) => (
                      <tr key={item.productId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.productNo}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-sm">
                          {item.manual ? (
                            `${item.manual.packs} packs`
                          ) : (
                            <span className="text-gray-400">Not submitted</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-sm">
                          {item.system?.packs ?? 0} packs
                        </td>
                        <td className="px-3 py-2 text-right text-sm">
                          {item.variance ? (
                            <span className={item.variance.packs !== 0 ? 'text-red-600' : 'text-green-600'}>
                              {item.variance.packs > 0 ? '+' : ''}{item.variance.packs}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {item.status ? getStatusBadge(item.status) : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No comparison data available</p>
              )}
            </>
          ) : null}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setIsComparisonModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManualDailyOpeningStock;
