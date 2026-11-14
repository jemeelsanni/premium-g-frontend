/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Truck,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { distributionService } from "../../services/distributionService";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { globalToast } from "../../components/ui/Toast";
import "./truckLoads.css";

const MAX_PALLETS = 12;

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PLANNED: { label: "Planned", cls: "bg-gray-100 text-gray-700" },
  IN_TRANSIT: { label: "In Transit", cls: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};

// ── Pallet fill bar ───────────────────────────────────────────────────────────
const PalletBar: React.FC<{ pallets: number }> = ({ pallets }) => {
  const pct = Math.min((pallets / MAX_PALLETS) * 100, 100);
  const color =
    pallets >= MAX_PALLETS
      ? "bg-green-500"
      : pallets >= 10
        ? "bg-amber-400"
        : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
        {pallets}/{MAX_PALLETS}
      </span>
    </div>
  );
};

// ── Create Truck Load Modal ───────────────────────────────────────────────────
const CreateTruckLoadModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [supplierCompanyId, setSupplierCompanyId] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Fetch pending orders
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["pending-orders-for-truck-load"],
    queryFn: () =>
      distributionService.getOrders({ status: "PENDING", limit: 200 } as any),
    staleTime: 0,
  });

  const allPendingOrders: any[] = ordersData?.data?.orders ?? [];

  // Unique suppliers from pending orders
  const supplierOptions = Array.from(
    new Map(
      allPendingOrders
        .filter((o: any) => o.supplierCompany)
        .map((o: any) => [o.supplierCompanyId, o.supplierCompany]),
    ).entries(),
  ).map(([id, sc]) => ({ id, name: (sc as any).name }));

  // Orders for selected supplier, not yet in a truck load
  const eligibleOrders = allPendingOrders.filter(
    (o: any) =>
      o.supplierCompanyId === supplierCompanyId &&
      !o.truckLoadId &&
      o.status !== "CANCELLED",
  );

  const selectedOrders = eligibleOrders.filter((o: any) =>
    selectedOrderIds.includes(o.id),
  );
  const combinedPallets = selectedOrders.reduce(
    (s: number, o: any) => s + (o.totalPallets || 0),
    0,
  );

  const toggleOrder = (orderId: string, pallets: number) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== orderId));
    } else {
      if (combinedPallets + pallets > MAX_PALLETS) {
        globalToast.error(
          `Adding this order would exceed ${MAX_PALLETS} pallets`,
        );
        return;
      }
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      distributionService.createTruckLoad({
        supplierCompanyId,
        orderIds: selectedOrderIds,
        notes: notes || undefined,
      }),
    onSuccess: (res: any) => {
      globalToast.success(res?.data?.message || "Truck load created");
      queryClient.invalidateQueries({ queryKey: ["truck-loads"] });
      queryClient.invalidateQueries({ queryKey: ["distribution-orders"] });
      onClose();
    },
    onError: (err: any) =>
      globalToast.error(
        err?.response?.data?.message || "Failed to create truck load",
      ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Create Truck Load
            </h2>
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Supplier select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Company
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={supplierCompanyId}
              onChange={(e) => {
                setSupplierCompanyId(e.target.value);
                setSelectedOrderIds([]);
              }}
            >
              <option value="">— Select supplier —</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
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
              {loadingOrders ? (
                <LoadingSpinner />
              ) : eligibleOrders.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  No eligible pending orders for this supplier
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                  {eligibleOrders.map((order: any) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const wouldExceed =
                      !isSelected &&
                      combinedPallets + (order.totalPallets || 0) > MAX_PALLETS;
                    return (
                      <button
                        key={order.id}
                        onClick={() =>
                          toggleOrder(order.id, order.totalPallets || 0)
                        }
                        disabled={wouldExceed}
                        className={`w-full text-left p-3 rounded-lg border-2 text-sm transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : wouldExceed
                              ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {order.orderNumber}
                            </span>
                            <span className="ml-2 text-gray-500">
                              {order.customer?.name}
                            </span>
                          </div>
                          <span className="font-medium text-gray-700">
                            {order.totalPallets} pallets
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {order.deliveryLocation || order.location?.name} · ₦
                          {Number(order.finalAmount || 0).toLocaleString()}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this truck load..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedOrderIds.length > 0
              ? `${selectedOrderIds.length} order(s) · ${combinedPallets}/${MAX_PALLETS} pallets`
              : "No orders selected"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !supplierCompanyId ||
                selectedOrderIds.length === 0 ||
                createMutation.isPending
              }
            >
              <Truck className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Creating…" : "Create Load"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main list component ───────────────────────────────────────────────────────
const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "PLANNED", label: "Planned" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const PILL_CLS: Record<string, string> = {
  PLANNED: "tl-p-gray",
  IN_TRANSIT: "tl-p-blue",
  COMPLETED: "tl-p-green",
  CANCELLED: "tl-p-red",
};

export const TruckLoads: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const limit = 10;

  // Wait for typing to pause before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["truck-loads", statusFilter, search, page],
    queryFn: () =>
      distributionService.getTruckLoads({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit,
      }),
    staleTime: 0,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const truckLoads: any[] = (data as any)?.data?.truckLoads ?? [];
  const pagination = (data as any)?.data?.pagination;
  const counts: Record<string, number> | undefined = (data as any)?.data
    ?.statusCounts;

  const total: number = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);
  const open = (id: string) => navigate(`/distribution/truck-loads/${id}`);

  return (
    <div className="tl">
      {/* Header */}
      <div className="tl-head">
        <div>
          <h1 className="tl-h1">Truck Loads</h1>
          <p className="tl-sub">
            Group orders from multiple customers onto one truck
          </p>
        </div>
        <button
          type="button"
          className="tl-btn tl-btn-blue"
          onClick={() => setShowCreate(true)}
        >
          <Plus aria-hidden="true" />
          New Truck Load
        </button>
      </div>

      {/* Search and status filter */}
      <div className="tl-card tl-filters">
        <div className="tl-search">
          <label htmlFor="tl-search" className="tl-sr">
            Search truck loads
          </label>
          <Search aria-hidden="true" />
          <input
            id="tl-search"
            className="tl-inp"
            type="search"
            placeholder="Search load number or customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="tl-stabs" role="group" aria-label="Filter by status">
          <span className="tl-stabs-label">Status:</span>
          {STATUS_TABS.map((t) => {
            const on = statusFilter === t.key;
            const n = counts?.[t.key || "ALL"];
            return (
              <button
                key={t.key || "all"}
                type="button"
                className={`tl-stab${on ? " tl-stab-on" : ""}`}
                aria-pressed={on}
                onClick={() => {
                  setStatusFilter(t.key);
                  setPage(1);
                }}
              >
                {t.label}
                {n !== undefined && <span className="tl-stab-n">{n}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="tl-card" style={{ overflow: "hidden" }}>
        <div className="tl-scroll">
          <div className="tl-table">
            <div className="tl-grid tl-thead">
              <span className="tl-th">Load No.</span>
              <span className="tl-th">Status</span>
              <span className="tl-th">Supplier</span>
              <span className="tl-th">Truck Capacity</span>
              <span className="tl-th" style={{ textAlign: "center" }}>
                Orders
              </span>
              <span className="tl-th">Customers</span>
              <span className="tl-sr">Actions</span>
            </div>

            {isLoading ? (
              <div className="tl-empty">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="tl-empty tl-error">
                Failed to load truck loads:{" "}
                {(error as any)?.response?.data?.message ||
                  (error as any)?.message ||
                  "Unknown error"}
              </div>
            ) : truckLoads.length === 0 ? (
              <div className="tl-empty">
                {search || statusFilter
                  ? "No truck loads match this search or status."
                  : "No truck loads yet. Create one to group orders for the same truck run."}
              </div>
            ) : (
              truckLoads.map((load: any) => {
                const customers = Array.from(
                  new Set(
                    (load.orders ?? [])
                      .map((o: any) => o.customer?.name)
                      .filter(Boolean),
                  ),
                ) as string[];
                const pallets: number = load.totalPallets || 0;
                const full = pallets >= MAX_PALLETS;
                const pct = Math.min(
                  Math.round((pallets / MAX_PALLETS) * 100),
                  100,
                );
                const status = STATUS_CONFIG[load.status]?.label ?? load.status;
                return (
                  <div
                    key={load.id}
                    className="tl-grid tl-row"
                    onClick={() => open(load.id)}
                  >
                    <span>
                      <button
                        type="button"
                        className="tl-id"
                        onClick={(e) => {
                          e.stopPropagation();
                          open(load.id);
                        }}
                      >
                        {load.loadNumber}
                      </button>
                    </span>
                    <span>
                      <span
                        className={`tl-pill ${PILL_CLS[load.status] ?? "tl-p-gray"}`}
                      >
                        {status}
                      </span>
                    </span>
                    <span>{load.supplierCompany?.name ?? "—"}</span>
                    <span className="tl-cap">
                      <span
                        className="tl-bar"
                        role="img"
                        aria-label={`${pallets} of ${MAX_PALLETS} pallets loaded`}
                      >
                        <span
                          style={{
                            width: `${pct}%`,
                            background: full ? "#00C950" : "#51A2FF",
                          }}
                        />
                      </span>
                      <span className="tl-cap-text">
                        {pallets} / {MAX_PALLETS} pallets
                      </span>
                    </span>
                    <span style={{ textAlign: "center" }}>
                      {load.orders?.length ?? 0}
                    </span>
                    <span className="tl-muted truncate">
                      {customers.length ? customers.join(", ") : "—"}
                    </span>
                    <span style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="tl-btn tl-btn-white tl-btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          open(load.id);
                        }}
                      >
                        <Eye aria-hidden="true" />
                        View Details
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="tl-pager">
          <span>
            {total
              ? `Showing ${from}–${to} of ${total} ${total === 1 ? "load" : "loads"}`
              : "Showing 0 loads"}
          </span>
          <div className="tl-pager-nav">
            <span>
              Page {Math.min(page, totalPages)} of {totalPages}
            </span>
            <button
              type="button"
              className="tl-pg-btn"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="tl-pg-btn"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateTruckLoadModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
};
