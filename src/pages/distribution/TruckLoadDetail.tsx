/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Truck, Plus, Trash2, CheckCircle,
  ChevronRight, Edit2, Save, X
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';

const MAX_PALLETS = 12;

const STATUS_CONFIG: Record<string, { label: string; cls: string; next?: string; nextLabel?: string }> = {
  PLANNED:    { label: 'Planned',    cls: 'bg-gray-100 text-gray-700',  next: 'IN_TRANSIT', nextLabel: 'Mark In Transit' },
  IN_TRANSIT: { label: 'In Transit', cls: 'bg-blue-100 text-blue-800',  next: 'COMPLETED',  nextLabel: 'Mark Completed' },
  COMPLETED:  { label: 'Completed',  cls: 'bg-green-100 text-green-800' },
  CANCELLED:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
};

const PalletBar: React.FC<{ pallets: number }> = ({ pallets }) => {
  const pct = Math.min((pallets / MAX_PALLETS) * 100, 100);
  const color = pallets >= MAX_PALLETS ? 'bg-green-500' : pallets >= 10 ? 'bg-amber-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${pallets >= MAX_PALLETS ? 'text-green-600' : 'text-gray-700'}`}>
        {pallets} / {MAX_PALLETS} pallets
        {pallets >= MAX_PALLETS && ' — Full truck ✓'}
      </span>
    </div>
  );
};

// ── Add Order Modal ───────────────────────────────────────────────────────────
const AddOrderModal: React.FC<{
  truckLoad: any;
  onClose: () => void;
  onAdded: () => void;
}> = ({ truckLoad, onClose, onAdded }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['pending-orders-for-load', truckLoad.id],
    queryFn: () => distributionService.getOrders({ status: 'PENDING', limit: 200 } as any),
    staleTime: 0,
  });

  const allOrders: any[] = ordersData?.data?.orders ?? [];
  const existingIds = new Set((truckLoad.orders ?? []).map((o: any) => o.id));
  const currentPallets = truckLoad.totalPallets || 0;

  const eligible = allOrders.filter((o: any) =>
    !existingIds.has(o.id) &&
    !o.truckLoadId &&
    o.status !== 'CANCELLED' &&
    o.supplierCompanyId === truckLoad.supplierCompanyId
  );

  const addMutation = useMutation({
    mutationFn: () => distributionService.addOrderToTruckLoad(truckLoad.id, selectedId!),
    onSuccess: (res: any) => {
      globalToast.success(res?.data?.message || 'Order added');
      onAdded();
      onClose();
    },
    onError: (err: any) => globalToast.error(err?.response?.data?.message || 'Failed to add order'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">Add Order to {truckLoad.loadNumber}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? <LoadingSpinner /> : eligible.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No compatible pending orders found for {truckLoad.supplierCompany?.name}.
            </p>
          ) : (
            <div className="space-y-2">
              {eligible.map((o: any) => {
                const wouldExceed = currentPallets + (o.totalPallets || 0) > MAX_PALLETS;
                const isSelected = selectedId === o.id;
                return (
                  <button
                    key={o.id}
                    disabled={wouldExceed}
                    onClick={() => setSelectedId(isSelected ? null : o.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 text-sm transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' :
                      wouldExceed ? 'border-gray-100 opacity-40 cursor-not-allowed' :
                      'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{o.orderNumber}</span>
                        <span className="ml-2 text-gray-500">{o.customer?.name}</span>
                      </div>
                      <span className="font-medium">
                        {o.totalPallets} pallets
                        {wouldExceed && <span className="ml-1 text-red-500 text-xs">(exceeds capacity)</span>}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {o.deliveryLocation || o.location?.name} · ₦{Number(o.finalAmount || 0).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={addMutation.isPending}>Cancel</Button>
          <Button
            disabled={!selectedId || addMutation.isPending}
            onClick={() => addMutation.mutate()}
          >
            {addMutation.isPending ? 'Adding…' : 'Add Order'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const TruckLoadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingTransport, setEditingTransport] = useState(false);
  const [transport, setTransport] = useState({ transporterCompany: '', driverNumber: '', truckNumber: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['truck-load', id],
    queryFn: () => distributionService.getTruckLoad(id!),
    staleTime: 0,
  });

  const truckLoad: any = data?.data?.truckLoad;

  // When data loads, seed the transport form
  React.useEffect(() => {
    if (truckLoad && !editingTransport) {
      setTransport({
        transporterCompany: truckLoad.transporterCompany || '',
        driverNumber: truckLoad.driverNumber || '',
        truckNumber: truckLoad.truckNumber || '',
      });
    }
  }, [truckLoad, editingTransport]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => distributionService.updateTruckLoad(id!, data),
    onSuccess: () => {
      globalToast.success('Truck load updated');
      queryClient.invalidateQueries({ queryKey: ['truck-load', id] });
      queryClient.invalidateQueries({ queryKey: ['truck-loads'] });
      setEditingTransport(false);
      refetch();
    },
    onError: (err: any) => globalToast.error(err?.response?.data?.message || 'Update failed'),
  });

  const removeMutation = useMutation({
    mutationFn: (orderId: string) => distributionService.removeOrderFromTruckLoad(id!, orderId),
    onSuccess: (res: any) => {
      globalToast.success(res?.data?.message || 'Order removed');
      queryClient.invalidateQueries({ queryKey: ['truck-load', id] });
      queryClient.invalidateQueries({ queryKey: ['truck-loads'] });
      refetch();
    },
    onError: (err: any) => globalToast.error(err?.response?.data?.message || 'Failed to remove order'),
  });

  const advanceStatus = () => {
    const next = STATUS_CONFIG[truckLoad.status]?.next;
    if (!next) return;
    updateMutation.mutate({ status: next });
  };

  const cancelLoad = () => {
    if (!window.confirm('Cancel this truck load? Orders will remain but will no longer be linked to this load.')) return;
    updateMutation.mutate({ status: 'CANCELLED' });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!truckLoad) return (
    <div className="text-center py-16 text-gray-500">
      Truck load not found.
      <button onClick={() => navigate(-1)} className="ml-2 text-blue-600 underline">Go back</button>
    </div>
  );

  const statusCfg = STATUS_CONFIG[truckLoad.status] ?? { label: truckLoad.status, cls: 'bg-gray-100 text-gray-700' };
  const isEditable = truckLoad.status === 'PLANNED';

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/distribution/truck-loads')}
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <Truck className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">{truckLoad.loadNumber}</h1>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          <span className="text-sm text-gray-500">· {truckLoad.supplierCompany?.name}</span>
        </div>

        {/* Status advance / cancel */}
        <div className="flex items-center gap-2">
          {statusCfg.next && (
            <Button onClick={advanceStatus} disabled={updateMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {statusCfg.nextLabel}
            </Button>
          )}
          {isEditable && (
            <Button variant="outline" onClick={cancelLoad} disabled={updateMutation.isPending}
              className="text-red-600 border-red-300 hover:bg-red-50">
              Cancel Load
            </Button>
          )}
        </div>
      </div>

      {/* Pallet capacity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-500 mb-2">Truck Capacity</p>
        <PalletBar pallets={truckLoad.totalPallets || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transport details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Transport Info</h2>
            {isEditable && !editingTransport && (
              <button onClick={() => setEditingTransport(true)} className="text-gray-400 hover:text-blue-600">
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {editingTransport ? (
            <div className="space-y-3">
              {[
                { label: 'Transporter Company', key: 'transporterCompany', placeholder: 'e.g. ABC Logistics' },
                { label: 'Driver Number', key: 'driverNumber', placeholder: 'e.g. 08012345678' },
                { label: 'Truck Number', key: 'truckNumber', placeholder: 'e.g. LAG-123-XY' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={placeholder}
                    value={(transport as any)[key]}
                    onChange={e => setTransport(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateMutation.mutate(transport)} disabled={updateMutation.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1" />Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingTransport(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {[
                { label: 'Company', value: truckLoad.transporterCompany },
                { label: 'Driver', value: truckLoad.driverNumber },
                { label: 'Truck No.', value: truckLoad.truckNumber },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-gray-400 w-20 shrink-0">{label}</span>
                  <span className="text-gray-800 font-medium">{value || '—'}</span>
                </div>
              ))}
              {truckLoad.notes && (
                <div className="pt-2 text-xs text-gray-500 border-t">
                  {truckLoad.notes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Orders ({truckLoad.orders?.length ?? 0})
            </h2>
            {isEditable && (
              <Button size="sm" onClick={() => setShowAddOrder(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Order
              </Button>
            )}
          </div>

          {(!truckLoad.orders || truckLoad.orders.length === 0) ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No orders in this truck load yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {truckLoad.orders.map((order: any) => (
                <div key={order.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/distribution/orders/${order.id}`}
                        className="font-semibold text-blue-600 hover:underline text-sm"
                      >
                        {order.orderNumber}
                      </Link>
                      <ChevronRight className="h-3 w-3 text-gray-300" />
                      <span className="text-sm text-gray-600">{order.customer?.name}</span>
                      {order.customer?.territory && (
                        <span className="text-xs text-gray-400">({order.customer.territory})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {order.deliveryLocation || order.location?.name} ·{' '}
                      ₦{Number(order.finalAmount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    {order.totalPallets} pallets
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => removeMutation.mutate(order.id)}
                      disabled={removeMutation.isPending}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Remove from load"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddOrder && (
        <AddOrderModal
          truckLoad={truckLoad}
          onClose={() => setShowAddOrder(false)}
          onAdded={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['truck-loads'] }); }}
        />
      )}
    </div>
  );
};
