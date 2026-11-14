// Product page: stock KPIs, purchases (batches), stock history, product details
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, SquarePen, Plus } from 'lucide-react';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { globalToast } from '../../../components/ui/Toast';
import { inventoryService, inventoryKeys, type InventoryPurchase } from '../../../services/inventoryService';
import { canAccessWarehouseFeature, WarehouseFeature } from '../../../utils/warehousePermissions';
import {
  n0, ngn, ngn2, fd, daysBetween, daysText, statusLabel, statusPill, isLow, purchaseCategory,
  sortPurchases, medianCostPerPack, isUnusualCost, paymentPill, groupHistory, MOVE_PILL, pageInfo,
  type PurchaseCategory
} from './inventoryUtils';
import { AdjustModal, DeleteProductModal, DeletePurchaseModal, ProductModal, PurchaseModal } from './InventoryModals';
import { Btn, Pager } from './InventoryUi';

const PER_PAGE = 10;
type Tab = 'purchases' | 'history' | 'details';

export const InventoryProductPage: React.FC = () => {
  const { productId = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('purchases');
  const [purFilter, setPurFilter] = useState<PurchaseCategory | 'all' | null>(null);
  const [purPage, setPurPage] = useState(1);
  const [hisPeriod, setHisPeriod] = useState('90');
  const [hisPage, setHisPage] = useState(1);

  const [editingProduct, setEditingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [recording, setRecording] = useState(false);
  const [editPurchase, setEditPurchase] = useState<InventoryPurchase | null>(null);
  const [adjustPurchase, setAdjustPurchase] = useState<InventoryPurchase | null>(null);
  const [deletePurchase, setDeletePurchase] = useState<InventoryPurchase | null>(null);

  const canRecord = canAccessWarehouseFeature(WarehouseFeature.PURCHASES);
  const canEditPurchase = canAccessWarehouseFeature(WarehouseFeature.EDIT_PURCHASES);
  const canDeletePurchase = canAccessWarehouseFeature(WarehouseFeature.DELETE_PURCHASES);
  const showActions = canEditPurchase || canDeletePurchase;

  const { data, isLoading, isError } = useQuery({
    queryKey: inventoryKeys.product(productId),
    queryFn: () => inventoryService.getProduct(productId),
    enabled: !!productId
  });
  const { data: listData } = useQuery({ queryKey: inventoryKeys.list, queryFn: () => inventoryService.getProducts() });

  const view = useMemo(() => {
    if (!data) return null;
    const { product: p, purchases, history, today } = data;
    const counts = { stock: 0, used: 0, expired: 0 };
    purchases.forEach((b) => { counts[purchaseCategory(b)] += 1; });
    const sel = purFilter || (counts.stock ? 'stock' : 'all');
    const filtered = sortPurchases(purchases).filter((b) => sel === 'all' || purchaseCategory(b) === sel);
    const pi = pageInfo(filtered.length, purPage, PER_PAGE);
    const defs = ([['stock', 'In stock'], ['used', 'Used up'], ['expired', 'Expired'], ['all', 'All']] as [PurchaseCategory | 'all', string][])
      .filter(([k]) => k !== 'expired' || counts.expired > 0);

    const cutoff = hisPeriod === 'all' ? null : daysBetween('1970-01-01', today) - Number(hisPeriod);
    const hisAll = groupHistory(history).filter((g) => cutoff == null || daysBetween('1970-01-01', g.date) > cutoff);
    const hi = pageInfo(hisAll.length, hisPage, PER_PAGE);

    const nd = p.nextExpiry ? daysBetween(today, p.nextExpiry) : null;
    return {
      p, today, counts, sel, filtered, pi, defs, hisAll, hi, nd,
      purRows: filtered.slice(pi.start, pi.start + PER_PAGE),
      hisRows: hisAll.slice(hi.start, hi.start + PER_PAGE),
      med: medianCostPerPack(purchases)
    };
  }, [data, purFilter, purPage, hisPeriod, hisPage]);

  const back = (
    <div>
      <button type="button" className="ivm-back" onClick={() => navigate('/warehouse/inventory')}>
        <ArrowLeft aria-hidden="true" />Back to Inventory
      </button>
    </div>
  );

  if (isLoading) return <div className="ivm"><div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}><LoadingSpinner /></div></div>;
  if (isError || !view) {
    return (
      <div className="ivm">
        {back}
        <div className="ivm-card ivm-empty">This product couldn’t be loaded. It may have been deleted.</div>
      </div>
    );
  }

  const { p, today } = view;
  const emptyMsg: Record<string, string> = { stock: 'No purchase has stock left.', used: 'No purchase has been fully used up yet.', expired: 'No expired stock.', all: 'No purchases yet.' };
  const openRecord = () => {
    if (!p.isActive) return globalToast.error(`${p.name} is Inactive. Edit the product and set it to Active to record a purchase.`);
    setRecording(true);
  };
  const purCols = showActions ? undefined : { gridTemplateColumns: '1fr .9fr .85fr 1.1fr .9fr 1fr .8fr .9fr' };

  return (
    <div className="ivm">
      {back}

      <div className="ivm-head">
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <h1 className="ivm-h1">{p.name}</h1>
            <span className={statusPill(p)}>{statusLabel(p)}</span>
            {!p.isActive && <span className="ivm-pill ivm-p-gray">Inactive</span>}
          </div>
          <p className="ivm-sub">{p.productNo} · Sells at {ngn(p.pricePerPack)} per pack</p>
        </div>
        {canRecord && (
          <div className="ivm-actions">
            <Btn onClick={() => setEditingProduct(true)}><SquarePen aria-hidden="true" />Edit Product</Btn>
            <Btn variant="blue" onClick={openRecord}><Plus aria-hidden="true" />Record Purchase</Btn>
          </div>
        )}
      </div>

      <div className="ivm-page-kpis">
        <div className="ivm-card">
          <div className="ivm-kpi-l">Current Stock</div>
          <div className="ivm-kpi-v">
            <span className={isLow(p) ? 'ivm-qty-low' : 'ivm-qty-ok'}>{n0(p.currentStock)}</span>{' '}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#6A7282' }}>packs</span>
          </div>
        </div>
        <div className="ivm-card">
          <div className="ivm-kpi-l">Stock Value (Cost)</div>
          <div className="ivm-kpi-v" style={{ color: '#009966', fontSize: 22 }}>{ngn2(p.stockValue)}</div>
        </div>
        <div className="ivm-card">
          <div className="ivm-kpi-l">Next Expiry</div>
          <div className="ivm-kpi-v" style={{ fontSize: 22 }}>{fd(p.nextExpiry)}</div>
          {view.nd != null && view.nd <= 30 && <span className="ivm-warn"><AlertTriangle aria-hidden="true" />{daysText(view.nd)}</span>}
          {p.expiredQuantity > 0 && <div className="ivm-bad">{n0(p.expiredQuantity)} packs expired</div>}
        </div>
        <div className="ivm-card">
          <div className="ivm-kpi-l">Last Restocked</div>
          <div className="ivm-kpi-v" style={{ fontSize: 22 }}>{fd(p.lastRestocked)}</div>
        </div>
        <div className="ivm-card">
          <div className="ivm-kpi-l">Min Stock Level</div>
          <div className="ivm-kpi-v" style={{ fontSize: 22 }}>{n0(p.minStockLevel)} packs</div>
        </div>
      </div>

      <div className="ivm-card" style={{ padding: '0 24px 24px' }}>
        <div className="ivm-tabs">
          <div role="tablist" aria-label="Product sections" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <button type="button" role="tab" aria-selected={tab === 'purchases'} className={`ivm-tab${tab === 'purchases' ? ' ivm-tab-on' : ''}`} onClick={() => { setTab('purchases'); setPurPage(1); }}>Purchases ({p.purchaseCount})</button>
            <button type="button" role="tab" aria-selected={tab === 'history'} className={`ivm-tab${tab === 'history' ? ' ivm-tab-on' : ''}`} onClick={() => { setTab('history'); setHisPage(1); }}>Stock History</button>
            <button type="button" role="tab" aria-selected={tab === 'details'} className={`ivm-tab${tab === 'details' ? ' ivm-tab-on' : ''}`} onClick={() => setTab('details')}>Product Details</button>
          </div>
        </div>

        {tab === 'purchases' && (
          p.purchaseCount === 0 ? (
            <div className="ivm-empty">
              <div>No purchases recorded for {p.name} yet.</div>
              {canRecord && <Btn variant="blue" onClick={openRecord}><Plus aria-hidden="true" />Record First Purchase</Btn>}
            </div>
          ) : (
            <>
              <div className="ivm-seg-bar">
                <div className="ivm-segs" role="group" aria-label="Filter purchases">
                  {view.defs.map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={view.sel === k}
                      className={`ivm-seg${view.sel === k ? ' ivm-seg-on' : ''}`}
                      onClick={() => { setPurFilter(k); setPurPage(1); }}>
                      {label} ({k === 'all' ? p.purchaseCount : view.counts[k]})
                    </button>
                  ))}
                </div>
                <span className="ivm-muted" style={{ fontSize: 14 }}>
                  {view.counts.stock ? `${n0(p.currentStock)} packs in stock across ${view.counts.stock} ${view.counts.stock === 1 ? 'purchase' : 'purchases'}` : 'No stock on hand'}
                </span>
              </div>
              <div className="ivm-subt">
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: showActions ? 1100 : 900 }}>
                    <div className="ivm-sub-row ivm-sub-head ivm-g-pur" style={purCols}>
                      <span className="ivm-th">Order/Batch</span><span className="ivm-th">Quantity</span><span className="ivm-th">Remaining</span>
                      <span className="ivm-th">Expiry Date</span><span className="ivm-th">Vendor</span><span className="ivm-th">Cost</span>
                      <span className="ivm-th">Status</span><span className="ivm-th">Date</span>{showActions && <span className="ivm-th">Actions</span>}
                    </div>
                    {view.purRows.map((b) => {
                      const d = b.expiryDate ? daysBetween(today, b.expiryDate) : null;
                      const pay = paymentPill(b.paymentStatus);
                      const odd = isUnusualCost(b.costPerPack, p.pricePerPack, view.med);
                      const noDelete = b.hasSales || b.hasAdjustments;
                      return (
                        <div key={b.id} className="ivm-sub-row ivm-g-pur" style={purCols}>
                          <span className="ivm-stack"><span>Order: {b.orderNumber || '—'}</span><span className="ivm-muted">Batch: {b.batchNumber || '—'}</span></span>
                          <span>{n0(b.quantityReceived)} PACKS</span>
                          <span>
                            {b.usedUp ? <span className="ivm-pill ivm-p-gray">Used up</span>
                              : b.expired ? <span className="ivm-pill ivm-p-red">{n0(b.quantityRemaining)} expired</span>
                                : n0(b.quantityRemaining)}
                          </span>
                          <span className="ivm-stack">
                            <span>{fd(b.expiryDate)}</span>
                            {!b.expired && !b.usedUp && d != null && d <= 30 && <span className="ivm-warn"><AlertTriangle aria-hidden="true" />{daysText(d)}</span>}
                            {b.expired && !b.usedUp && <span className="ivm-bad">Expired</span>}
                          </span>
                          <span>{b.vendorName || '—'}</span>
                          <span className="ivm-stack">
                            <span>{ngn(b.totalCost)}</span>
                            {b.costPerPack != null && <span className="ivm-muted" style={{ fontSize: 12 }}>{ngn(b.costPerPack)} / pack</span>}
                            {odd && <span className="ivm-warn"><AlertTriangle aria-hidden="true" />Unusual cost</span>}
                          </span>
                          <span><span className={pay.cls}>{pay.text}</span></span>
                          <span>{fd(b.purchaseDate)}</span>
                          {showActions && (
                            <span style={{ display: 'flex', gap: 6 }}>
                              {canEditPurchase && <Btn small variant="gray" title="Edit purchase details" onClick={() => setEditPurchase(b)}>Edit</Btn>}
                              {canEditPurchase && (
                                <Btn small disabled={b.expired}
                                  title={b.expired ? 'Expired stock is already left out of current stock' : 'Adjust stock for damage, expiry or a count correction'}
                                  onClick={() => setAdjustPurchase(b)}>Adjust</Btn>
                              )}
                              {canDeletePurchase && (
                                <Btn small variant="red" disabled={noDelete}
                                  title={b.hasSales ? 'Some of this purchase has already been sold' : b.hasAdjustments ? 'This purchase has stock adjustments' : 'Delete this purchase'}
                                  onClick={() => setDeletePurchase(b)}>Delete</Btn>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {view.purRows.length === 0 && <div className="ivm-sub-empty">{emptyMsg[view.sel]}</div>}
                  </div>
                </div>
                <Pager label="purchases" page={view.pi.page} pages={view.pi.pages} onPage={setPurPage}
                  showing={view.filtered.length ? `Showing ${view.pi.start + 1}–${view.pi.start + view.purRows.length} of ${view.filtered.length} purchases` : 'Showing 0 purchases'} />
              </div>
              <p className="ivm-note">
                Stock is sold oldest purchase first, so used-up purchases drop out of "In stock" on their own. Expired stock is not counted in current stock. A purchase can only be deleted before any of it is sold.
              </p>
            </>
          )
        )}

        {tab === 'history' && (
          <>
            <div className="ivm-seg-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label htmlFor="his-period" style={{ fontSize: 14, color: '#364153' }}>Period</label>
                <select id="his-period" className="ivm-inp" value={hisPeriod} style={{ width: 180, fontSize: 14 }}
                  onChange={(e) => { setHisPeriod(e.target.value); setHisPage(1); }}>
                  <option value="30">Last 30 days</option><option value="90">Last 3 months</option><option value="all">All time</option>
                </select>
              </div>
              <span className="ivm-muted" style={{ fontSize: 14 }}>Sales are grouped into one line per day</span>
            </div>
            <div className="ivm-subt">
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 820 }}>
                  <div className="ivm-sub-row ivm-sub-head ivm-g-his">
                    <span className="ivm-th">Date</span><span className="ivm-th">Type</span><span className="ivm-th">Change</span>
                    <span className="ivm-th">Details</span><span className="ivm-th">By</span><span className="ivm-th">Balance</span>
                  </div>
                  {view.hisRows.map((m, i) => {
                    const many = m.type === 'Sale' && m.count > 1;
                    const type = many ? 'Sales' : m.type;
                    return (
                      <div key={`${m.date}-${i}`} className="ivm-sub-row ivm-g-his">
                        <span>{fd(m.date)}</span>
                        <span><span className={`ivm-pill ${MOVE_PILL[type] || 'ivm-p-gray'}`}>{type}</span></span>
                        <span className={m.qty > 0 ? 'ivm-qty-plus' : m.qty < 0 ? 'ivm-qty-minus' : 'ivm-muted'}>
                          {(m.qty > 0 ? '+' : m.qty < 0 ? '−' : '') + n0(Math.abs(m.qty))}
                        </span>
                        <span className="ivm-muted">{many ? `${m.count} sales that day` : m.detail}</span>
                        <span className="ivm-muted">{m.by}</span>
                        <span>{n0(m.balance)}</span>
                      </div>
                    );
                  })}
                  {view.hisRows.length === 0 && <div className="ivm-sub-empty">No stock movements in this period.</div>}
                </div>
              </div>
              <Pager label="history" page={view.hi.page} pages={view.hi.pages} onPage={setHisPage}
                showing={view.hisAll.length ? `Showing ${view.hi.start + 1}–${view.hi.start + view.hisRows.length} of ${view.hisAll.length} entries` : 'Showing 0 entries'} />
            </div>
          </>
        )}

        {tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="ivm-dt-grid">
              {[
                ['Product Number', p.productNo],
                ['Price per Pack', ngn(p.pricePerPack)],
                ['Selling Price Range', p.minSellingPrice == null && p.maxSellingPrice == null ? '—' : `${ngn(p.minSellingPrice)} – ${p.maxSellingPrice == null ? 'N/A' : ngn(p.maxSellingPrice)}`],
                ['Cost per Pack', ngn(p.costPerPack)],
                ['Packs per Pallet', p.packsPerPallet == null ? '—' : n0(p.packsPerPallet)],
                ['Min Stock Level', `${n0(p.minStockLevel)} packs`],
                ['Status', p.isActive ? 'Active' : 'Inactive']
              ].map(([l, v]) => (
                <div key={l} className="ivm-dt"><div className="ivm-dt-l">{l}</div><div className="ivm-dt-v">{v}</div></div>
              ))}
            </div>
            <div className="ivm-dt"><div className="ivm-dt-l">Description</div><div className="ivm-dt-v">{p.description || '—'}</div></div>
            {canRecord && <div><Btn small onClick={() => setEditingProduct(true)}><SquarePen aria-hidden="true" />Edit Product</Btn></div>}
          </div>
        )}
      </div>

      <ProductModal open={editingProduct} product={p} onClose={() => setEditingProduct(false)}
        onSaved={(saved) => { setEditingProduct(false); globalToast.success(`${saved.name} updated.`); }}
        onDelete={() => { setEditingProduct(false); setDeletingProduct(true); }} />
      {deletingProduct && (
        <DeleteProductModal product={p} onClose={() => setDeletingProduct(false)}
          onDeleted={(msg) => { setDeletingProduct(false); globalToast.success(msg); navigate('/warehouse/inventory'); }}
          onInactive={(msg) => { setDeletingProduct(false); globalToast.success(msg); }} />
      )}
      <PurchaseModal open={recording} products={listData?.products || [p]} initialProductId={p.id}
        onClose={() => setRecording(false)}
        onSaved={(msg, pid) => {
          setRecording(false); globalToast.success(msg);
          setTab('purchases'); setPurFilter(null); setPurPage(1);
          if (pid !== p.id) navigate(`/warehouse/inventory/${pid}`);
        }} />
      <PurchaseModal open={!!editPurchase} products={[]} purchase={editPurchase} purchaseProduct={p}
        onClose={() => setEditPurchase(null)} onSaved={(msg) => { setEditPurchase(null); globalToast.success(msg); }} />
      <AdjustModal product={p} purchase={adjustPurchase} onClose={() => setAdjustPurchase(null)}
        onSaved={(msg) => { setAdjustPurchase(null); globalToast.success(msg); setTab('history'); setHisPage(1); }} />
      <DeletePurchaseModal product={p} purchase={deletePurchase} onClose={() => setDeletePurchase(null)}
        onDeleted={(msg) => { setDeletePurchase(null); globalToast.success(msg); }} />
    </div>
  );
};

export default InventoryProductPage;
