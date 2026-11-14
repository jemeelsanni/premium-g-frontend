// Inventory Management: warehouse products, stock levels and purchases in one place
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, SquarePen, AlertTriangle, Package, Plus, Search, Download, DollarSign } from 'lucide-react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { globalToast } from '../../../components/ui/Toast';
import { inventoryService, inventoryKeys, type InventoryProduct } from '../../../services/inventoryService';
import { canAccessWarehouseFeature, WarehouseFeature } from '../../../utils/warehousePermissions';
import {
  n0, ngn, ngn2, fd, daysBetween, daysText, statusLabel, statusPill, isLow, sortPurchases
} from './inventoryUtils';
import { DeleteProductModal, ProductModal, PurchaseModal } from './InventoryModals';
import { Btn } from './InventoryUi';

export type InventoryView = 'all' | 'low' | 'expiring' | 'expired';
const VIEWS: InventoryView[] = ['all', 'low', 'expiring', 'expired'];

const matchesView = (p: InventoryProduct, view: InventoryView) =>
  view === 'all' || (view === 'low' && isLow(p)) || (view === 'expiring' && p.expiringBatches > 0) || (view === 'expired' && p.expiredQuantity > 0);

// Latest purchases for one product, shown under its row
const QuickLook: React.FC<{ product: InventoryProduct; canRecord: boolean; onRecord: () => void; onOpen: () => void }> = ({ product, canRecord, onRecord, onOpen }) => {
  const { data, isLoading } = useQuery({
    queryKey: inventoryKeys.product(product.id),
    queryFn: () => inventoryService.getProduct(product.id)
  });
  const total = data?.purchases.length ?? product.purchaseCount;
  const latest = data ? sortPurchases(data.purchases).slice(0, 5) : [];
  const sub = total
    ? `${total > 5 ? `Last 5 of ${total} purchases, newest first. ` : total === 1 ? '1 purchase. ' : `All ${total} purchases, newest first. `}${n0(product.currentStock)} ${product.currentStock === 1 ? 'pack' : 'packs'} in stock now.`
    : '';

  return (
    <div className="ivm-panel">
      <div className="ivm-peek-head">
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>Latest purchases</div>
          <div className="ivm-muted" style={{ fontSize: 13, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {canRecord && <Btn small onClick={onRecord}><Plus aria-hidden="true" />Record Purchase</Btn>}
          <Btn small variant="blue" onClick={onOpen}>
            {total > 5 ? `View all ${total} purchases & history` : 'View purchases & history'}<ChevronRight aria-hidden="true" />
          </Btn>
        </div>
      </div>
      {isLoading ? (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}><LoadingSpinner /></div>
      ) : total === 0 ? (
        <div className="ivm-muted" style={{ fontSize: 14 }}>No purchases recorded yet.</div>
      ) : (
        <div className="ivm-subt">
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 720 }}>
              <div className="ivm-sub-row ivm-sub-head ivm-g-peek">
                <span className="ivm-th">Order/Batch</span><span className="ivm-th">Received</span><span className="ivm-th">Remaining</span>
                <span className="ivm-th">Expiry Date</span><span className="ivm-th">Cost / Pack</span><span className="ivm-th">Vendor</span>
              </div>
              {latest.map((b) => {
                const d = b.expiryDate && data ? daysBetween(data.today, b.expiryDate) : null;
                const inStock = b.quantityRemaining > 0 && !b.expired;
                return (
                  <div key={b.id} className="ivm-sub-row ivm-g-peek">
                    <span className="ivm-stack"><span>Order: {b.orderNumber || '—'}</span><span className="ivm-muted">Batch: {b.batchNumber || '—'}</span></span>
                    <span>{fd(b.purchaseDate)}</span>
                    <span>
                      {inStock ? `${n0(b.quantityRemaining)} of ${n0(b.quantityReceived)}`
                        : b.usedUp ? <span className="ivm-pill ivm-p-gray">Used up</span>
                          : <span className="ivm-pill ivm-p-red">{n0(b.quantityRemaining)} expired</span>}
                    </span>
                    <span className="ivm-stack">
                      <span>{fd(b.expiryDate)}</span>
                      {inStock && d != null && d <= 30 && <span className="ivm-warn"><AlertTriangle aria-hidden="true" />{daysText(d)}</span>}
                    </span>
                    <span>{ngn(b.costPerPack)}</span>
                    <span>{b.vendorName || '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = (VIEWS.includes(params.get('view') as InventoryView) ? params.get('view') : 'all') as InventoryView;
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const [productModal, setProductModal] = useState<{ open: boolean; product: InventoryProduct | null }>({ open: false, product: null });
  const [deleting, setDeleting] = useState<InventoryProduct | null>(null);
  const [record, setRecord] = useState<{ open: boolean; productId: string }>({ open: false, productId: '' });

  const canRecord = canAccessWarehouseFeature(WarehouseFeature.PURCHASES);

  const { data, isLoading, isError } = useQuery({
    queryKey: inventoryKeys.list,
    queryFn: () => inventoryService.getProducts()
  });
  const all = useMemo(() => data?.products ?? [], [data]);

  const setView = (v: InventoryView) => {
    const next = new URLSearchParams(params);
    if (v === 'all') next.delete('view'); else next.set('view', v);
    setParams(next, { replace: true });
  };

  const stats = useMemo(() => {
    const low = all.filter(isLow).length;
    return {
      total: all.length, low, well: all.length - low,
      stock: all.reduce((s, p) => s + p.currentStock, 0),
      value: all.reduce((s, p) => s + (p.stockValue ?? 0), 0)
    };
  }, [all]);

  const q = search.trim().toLowerCase();
  const rows = all.filter((p) => (!q || p.name.toLowerCase().includes(q) || p.productNo.toLowerCase().includes(q)) && matchesView(p, view));

  const viewNames: Record<InventoryView, string> = { all: '', low: 'are low on stock', expiring: 'expiring within 30 days', expired: 'with expired stock' };
  const emptyText = view === 'all' ? 'No products match your search.' : `No products ${viewNames[view]}${q ? ' match your search.' : '.'}`;

  const openRecord = (pid: string) => {
    const p = all.find((x) => x.id === pid);
    if (p && !p.isActive) return globalToast.error(`${p.name} is Inactive. Edit the product and set it to Active to record a purchase.`);
    setRecord({ open: true, productId: pid });
  };

  const exportReport = () => {
    const cols = ['Product', 'Product Number', 'Status', 'Current Stock (packs)', 'Min Stock', 'Next Expiry', 'Expired (packs)', 'Last Restocked', 'Stock Value (Cost)', 'Active'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.map(esc).join(',')].concat(rows.map((p) => [
      p.name, p.productNo, statusLabel(p), p.currentStock, p.minStockLevel, p.nextExpiry || '', p.expiredQuantity,
      p.lastRestocked || '', p.stockValue ?? '', p.isActive ? 'Yes' : 'No'
    ].map(esc).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${data?.today || 'today'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    globalToast.success('Inventory report exported.');
  };

  return (
    <div className="ivm">
      <div className="ivm-head">
        <div>
          <h1 className="ivm-h1">Inventory Management</h1>
          <p className="ivm-sub">Add products, record purchases and monitor warehouse stock levels</p>
        </div>
        {canRecord && (
          <div className="ivm-actions">
            <Btn onClick={() => setProductModal({ open: true, product: null })}><Package aria-hidden="true" />Add Product</Btn>
            <Btn variant="blue" onClick={() => openRecord('')}><Plus aria-hidden="true" />Record Purchase</Btn>
          </div>
        )}
      </div>

      <div className="ivm-kpis">
        <div className="ivm-card ivm-kpi">
          <Package size={32} color="#155DFC" strokeWidth={2} aria-hidden="true" style={{ flex: 'none' }} />
          <div><div className="ivm-kpi-l">Total Items</div><div className="ivm-kpi-v">{n0(stats.total)}</div></div>
        </div>
        <button type="button" className="ivm-card ivm-kpi ivm-kpi-btn" title="Show low stock products" onClick={() => { setSearch(''); setView('low'); }}>
          <AlertTriangle size={32} color="#E7000B" strokeWidth={2} aria-hidden="true" style={{ flex: 'none' }} />
          <div><div className="ivm-kpi-l">Low Stock</div><div className="ivm-kpi-v" style={{ color: '#E7000B' }}>{stats.low}</div></div>
        </button>
        <div className="ivm-card ivm-kpi">
          <div className="ivm-dot" style={{ background: '#DCFCE7' }} aria-hidden="true"><div style={{ width: 16, height: 16, borderRadius: 9999, background: '#00A63E' }} /></div>
          <div><div className="ivm-kpi-l">Well Stocked</div><div className="ivm-kpi-v" style={{ color: '#00A63E' }}>{n0(stats.well)}</div></div>
        </div>
        <div className="ivm-card ivm-kpi">
          <div className="ivm-dot" style={{ background: '#F3E8FF', fontSize: 10, fontWeight: 700, color: '#9810FA' }} aria-hidden="true">TTL</div>
          <div><div className="ivm-kpi-l">Total Stock</div><div className="ivm-kpi-v">{n0(stats.stock)}</div></div>
        </div>
        <div className="ivm-card ivm-kpi">
          <DollarSign size={32} color="#009966" strokeWidth={2} aria-hidden="true" style={{ flex: 'none' }} />
          <div><div className="ivm-kpi-l">Stock Value</div><div className="ivm-kpi-v" style={{ color: '#009966' }}>{ngn2(stats.value)}</div></div>
        </div>
      </div>

      <div className="ivm-card ivm-filters">
        <div className="ivm-search">
          <label htmlFor="inv-search" className="ivm-sr">Search products</label>
          <Search aria-hidden="true" />
          <input id="inv-search" className="ivm-inp" type="search" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 38, fontSize: 14 }} />
        </div>
        <div className="ivm-filter-by">
          <label htmlFor="inv-show">Filter by</label>
          <select id="inv-show" className="ivm-inp" value={view} onChange={(e) => setView(e.target.value as InventoryView)} style={{ width: 230, fontSize: 14 }}>
            <option value="all">All products</option>
            <option value="low">Low stock only</option>
            <option value="expiring">Expiring within 30 days</option>
            <option value="expired">Expired stock</option>
          </select>
        </div>
        <Btn onClick={exportReport} disabled={!rows.length}><Download aria-hidden="true" />Export Report</Btn>
      </div>

      <div className="ivm-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}><LoadingSpinner /></div>
        ) : isError ? (
          <div className="ivm-empty">Inventory couldn’t be loaded. Refresh the page to try again.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 1080 }}>
              <div className="ivm-grid ivm-grid-head">
                <span className="ivm-th" style={{ paddingLeft: 26 }}>Product</span><span className="ivm-th">Current Stock</span>
                <span className="ivm-th">Min Stock</span><span className="ivm-th">Status</span><span className="ivm-th">Next Expiry</span>
                <span className="ivm-th">Last Restocked</span><span className="ivm-th">Stock Value (Cost)</span><span className="ivm-sr">Actions</span>
              </div>
              {rows.map((p) => {
                const isOpen = open === p.id;
                const nd = p.nextExpiry && data ? daysBetween(data.today, p.nextExpiry) : null;
                const low = isLow(p);
                return (
                  <div key={p.id}>
                    <div className={`ivm-grid ivm-row${isOpen ? ' ivm-row-open' : ''}`}>
                      <div className="ivm-pcell">
                        <button type="button" className="ivm-chev-btn" aria-expanded={isOpen} title="Quick look at the latest purchases"
                          aria-label={`${isOpen ? 'Hide' : 'Show'} latest purchases for ${p.name}`}
                          onClick={() => setOpen(isOpen ? null : p.id)}>
                          <ChevronRight className={`ivm-chev${isOpen ? ' ivm-chev-open' : ''}`} aria-hidden="true" />
                        </button>
                        <Package className="ivm-pkg" aria-hidden="true" />
                        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button type="button" className="ivm-pname-link" onClick={() => navigate(`/warehouse/inventory/${p.id}`)}>{p.name}</button>
                            {!p.isActive && <span className="ivm-pill ivm-p-gray">Inactive</span>}
                          </span>
                          <span className="ivm-pnum">{p.productNo}</span>
                        </span>
                      </div>
                      <span className={low ? 'ivm-qty-low' : 'ivm-qty-ok'}>
                        {n0(p.currentStock)}{low && <AlertTriangle role="img" aria-label="Low stock" />}
                      </span>
                      <span>{n0(p.minStockLevel)}</span>
                      <span><span className={statusPill(p)}>{statusLabel(p)}</span></span>
                      <span className="ivm-stack">
                        <span>{fd(p.nextExpiry)}</span>
                        {nd != null && nd <= 30 && <span className="ivm-warn"><AlertTriangle aria-hidden="true" />{daysText(nd)}</span>}
                        {p.expiredQuantity > 0 && <span className="ivm-bad">{n0(p.expiredQuantity)} packs expired</span>}
                      </span>
                      <span>{fd(p.lastRestocked)}</span>
                      <span>{ngn2(p.stockValue)}</span>
                      <span>
                        {canRecord && (
                          <button type="button" className="ivm-icon-btn" title="Edit product" aria-label={`Edit ${p.name}`}
                            onClick={() => setProductModal({ open: true, product: p })}>
                            <SquarePen aria-hidden="true" />
                          </button>
                        )}
                      </span>
                    </div>
                    {isOpen && (
                      <QuickLook product={p} canRecord={canRecord} onRecord={() => openRecord(p.id)} onOpen={() => navigate(`/warehouse/inventory/${p.id}`)} />
                    )}
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div className="ivm-empty">
                  <div>{emptyText}</div>
                  <Btn small onClick={() => { setSearch(''); setView('all'); }}>Clear filters</Btn>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="ivm-foot">Showing {rows.length} of {all.length} products</div>
      </div>

      <ProductModal open={productModal.open} product={productModal.product}
        onClose={() => setProductModal({ open: false, product: null })}
        onSaved={(saved, created) => {
          setProductModal({ open: false, product: null });
          if (created) {
            globalToast.success(`${saved.name} added. Record a purchase to add its first stock.`);
            navigate(`/warehouse/inventory/${saved.id}`);
          } else {
            globalToast.success(`${saved.name} updated.`);
          }
        }}
        onDelete={(p) => { setProductModal({ open: false, product: null }); setDeleting(p); }} />
      {deleting && (
        <DeleteProductModal product={deleting} onClose={() => setDeleting(null)}
          onDeleted={(msg) => { setDeleting(null); setOpen(null); globalToast.success(msg); }}
          onInactive={(msg) => { setDeleting(null); globalToast.success(msg); }} />
      )}
      <PurchaseModal open={record.open} products={all} initialProductId={record.productId}
        onClose={() => setRecord({ open: false, productId: '' })}
        onSaved={(msg, pid) => { setRecord({ open: false, productId: '' }); setOpen(pid); globalToast.success(msg); }} />
    </div>
  );
};

export default InventoryManagement;
