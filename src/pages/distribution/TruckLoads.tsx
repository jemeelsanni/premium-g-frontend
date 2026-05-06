/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Truck, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';

const MAX_PALLETS = 12;

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PLANNED:    { label: 'Planned',    cls: 'bg-gray-100 text-gray-700' },
  IN_TRANSIT: { label: 'In Transit', cls: 'bg-blue-100 text-blue-800' },
  COMPLETED:  { label: 'Completed',  cls: 'bg-green-100 text-green-800' },
  CANCELLED:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Pallet fill bar ───────────────────────────────────────────────────────────
const PalletBar: React.FC<{ pallets: number }> = ({ pallets }) => {
  const pct = Math.min((pallets / MAX_PALLETS) * 100, 100);
  const color = pallets >= MAX_PALLETS ? 'bg-green-500' : pallets >= 10 ? 'bg-amber-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
        {pallets}/{MAX_PALLETS}
      </span>
    </div>
  );
};

// ── Create Truck Load Modal ───────────────────────────────────────────────────
const CreateTruckLoadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [supplierCompanyId, setSupplierCompanyId] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Fetch pending orders
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['pending-orders-for-truck-load'],
    queryFn: () => distributionService.getOrders({ status: 'PENDING', limit: 200 } as any),
    staleTime: 0,
  });

  const allPendingOrders: any[] = ordersData?.data?.orders ?? [];

  // Unique suppliers from pending orders
  const supplierOptions = Array.from(
    new Map(
      allPendingOrders
        .filter((o: any) => o.supplierCompany)
        .map((o: any) => [o.supplierCompanyId, o.supplierCompany])
    ).entries()
  ).map(([id, sc]) => ({ id, name: (sc as any).name }));

  // Orders for selected supplier, not yet in a truck load
  const eligibleOrders = allPendingOrders.filter(
    (o: any) => o.supplierCompanyId === supplierCompanyId && !o.truckLoadId && o.status !== 'CANCELLED'
  );

  const selectedOrders = eligibleOrders.filter((o: any) => selectedOrderIds.includes(o.id));
  const combinedPallets = selectedOrders.reduce((s: number, o: any) => s + (o.totalPallets || 0), 0);

  const toggleOrder = (orderId: string, pallets: number) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
    } else {
      if (combinedPallets + pallets > MAX_PALLETS) {
        globalToast.error(`Adding this order would exceed ${MAX_PALLETS} pallets`);
        return;
      }
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => distributionService.createTruckLoad({ supplierCompanyId, orderIds: selectedOrderIds, notes: notes || undefined }),
    onSuccess: (res: any) => {
      globalToast.success(res?.data?.message || 'Truck load created');
      queryClient.invalidateQueries({ queryKey: ['truck-loads'] });
      queryClient.invalidateQueries({ queryKey: ['distribution-orders'] });
      onClose();
    },
    onError: (err: any) => globalToast.error(err?.response?.data?.message || 'Failed to create truck load'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Create Truck Load</h2>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Supplier select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Company</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={supplierCompanyId}
              onChange={e => { setSupplierCompanyId(e.target.value); setSelectedOrderIds([]); }}
            >
              <option value="">— Select supplier —</option>
              {supplierOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Order selection */}
          {supplierCompanyId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Orders ({selectedOrderIds.length} selected)
                </label>
                <PalletBar pallets={combinedPallets} />
              </div>
              {loadingOrders ? <LoadingSpinner /> : eligibleOrders.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  No eligible pending orders for this supplier
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                  {eligibleOrders.map((order: any) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const wouldExceed = !isSelected && combinedPallets + (order.totalPallets || 0) > MAX_PALLETS;
                    return (
                      <button
                        key={order.id}
                        onClick={() => toggleOrder(order.id, order.totalPallets || 0)}
                        disabled={wouldExceed}
                        className={`w-full text-left p-3 rounded-lg border-2 text-sm transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' :
                          wouldExceed ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed' :
                          'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                            <span className="ml-2 text-gray-500">{order.customer?.name}</span>
                          </div>
                          <span className="font-medium text-gray-700">{order.totalPallets} pallets</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {order.deliveryLocation || order.location?.name} · ₦{Number(order.finalAmount || 0).toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes for this truck load..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedOrderIds.length > 0
              ? `${selectedOrderIds.length} order(s) · ${combinedPallets}/${MAX_PALLETS} pallets`
              : 'No orders selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!supplierCompanyId || selectedOrderIds.length === 0 || createMutation.isPending}
            >
              <Truck className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Creating…' : 'Create Load'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main list component ───────────────────────────────────────────────────────
export const TruckLoads: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['truck-loads', statusFilter, page],
    queryFn: () => distributionService.getTruckLoads({ status: statusFilter || undefined, page, limit }),
    staleTime: 15000,
  });

  const truckLoads: any[] = data?.data?.truckLoads ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Truck Loads</h1>
          <p className="text-sm text-gray-500 mt-1">Group orders from multiple customers onto one truck</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Truck Load
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Status:</label>
        {['', 'PLANNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : truckLoads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No truck loads yet</p>
          <p className="text-sm mt-1">Create one to group orders for the same truck run</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {truckLoads.map((load: any) => {
            const customers = Array.from(
              new Set((load.orders ?? []).map((o: any) => o.customer?.name).filter(Boolean))
            ) as string[];

            return (
              <div key={load.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3">
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{load.loadNumber}</span>
                  <StatusBadge status={load.status} />
                </div>

                {/* Supplier */}
                <p className="text-sm text-gray-500">{load.supplierCompany?.name}</p>

                {/* Pallet bar */}
                <PalletBar pallets={load.totalPallets || 0} />

                {/* Orders count + customers */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{load.orders?.length ?? 0} order(s)</span>
                  {customers.length > 0 && (
                    <span className="text-gray-400"> · {customers.slice(0, 2).join(', ')}{customers.length > 2 ? ` +${customers.length - 2}` : ''}</span>
                  )}
                </div>

                {/* Transport info */}
                {(load.truckNumber || load.transporterCompany) && (
                  <div className="text-xs text-gray-400 flex gap-2">
                    {load.truckNumber && <span>🚛 {load.truckNumber}</span>}
                    {load.transporterCompany && <span>{load.transporterCompany}</span>}
                  </div>
                )}

                {/* View button */}
                <Link to={`/distribution/truck-loads/${load.id}`} className="mt-auto">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} loads
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showCreate && <CreateTruckLoadModal onClose={() => setShowCreate(false)} />}
    </div>
  );
};
