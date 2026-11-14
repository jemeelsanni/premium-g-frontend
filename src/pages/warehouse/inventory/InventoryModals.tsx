// Modals for Inventory Management: product, purchase, adjustment, deletes
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Mail, Hash, FileText, Clock, Package, DollarSign, Calendar } from 'lucide-react';
import { Btn, ModalShell } from './InventoryUi';
import {
  inventoryService, inventoryKeys, apiError,
  type InventoryProduct, type InventoryPurchase, type ProductInput,
  type PurchasePaymentMethod, type PurchasePaymentStatus
} from '../../../services/inventoryService';
import {
  n0, ngn, fd, parseNum, isUnusualCost, medianCostPerPack
} from './inventoryUtils';

// ---------- small form pieces ----------

const inputCls = 'ivm-inp';

const Field: React.FC<{ id: string; label: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode }> = ({ id, label, icon, hint, children }) => (
  <div>
    <label htmlFor={id} className="ivm-lbl">{icon}{label}</label>
    {children}
    {hint && <div className="ivm-hint">{hint}</div>}
  </div>
);

const ErrorBox: React.FC<{ msg: string }> = ({ msg }) =>
  msg ? <div role="alert" className="ivm-err">{msg}</div> : null;

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: inventoryKeys.all });
};

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());

// =====================================================================
// ADD / EDIT PRODUCT
// =====================================================================

interface ProductModalProps {
  open: boolean;
  product: InventoryProduct | null; // null = add
  onClose: () => void;
  onSaved: (product: InventoryProduct, created: boolean) => void;
  onDelete: (product: InventoryProduct) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ open, product, onClose, onSaved, onDelete }) => {
  const editing = !!product;
  const invalidate = useInvalidate();
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');

  const { data: nextNumber } = useQuery({
    queryKey: ['inventory-management', 'next-number'],
    queryFn: () => inventoryService.getNextProductNumber(),
    enabled: open && !editing,
    staleTime: 0
  });

  useEffect(() => {
    if (!open) return;
    setErr('');
    const s = (v: number | null | undefined) => (v == null ? '' : String(v));
    setF(product ? {
      name: product.name, desc: product.description || '', price: s(product.pricePerPack), cost: s(product.costPerPack),
      ppp: s(product.packsPerPallet), rmin: s(product.minSellingPrice), rmax: s(product.maxSellingPrice),
      min: String(product.minStockLevel), status: product.isActive ? 'Active' : 'Inactive'
    } : { name: '', desc: '', price: '', cost: '', ppp: '', rmin: '', rmax: '', min: '20', status: 'Active' });
  }, [open, product]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((o) => ({ ...o, [k]: e.target.value }));
    setErr('');
  };

  const save = useMutation({
    mutationFn: (data: ProductInput) => (editing ? inventoryService.updateProduct(product!.id, data) : inventoryService.createProduct(data)),
    onSuccess: (saved) => { invalidate(); onSaved(saved, !editing); },
    onError: (e) => setErr(apiError(e, 'Could not save the product.'))
  });

  const submit = () => {
    const name = (f.name || '').trim();
    if (!name) return setErr('Enter a product name.');
    const min = parseNum(f.min);
    if (min == null || min < 0 || Math.floor(min) !== min) return setErr('Min stock level must be a whole number of packs.');
    const opt = (k: string) => (f[k] === '' || f[k] == null ? null : parseNum(f[k]));
    for (const k of ['price', 'cost', 'ppp', 'rmin', 'rmax']) {
      if (f[k] !== '' && f[k] != null && (parseNum(f[k]) == null || (parseNum(f[k]) as number) < 0)) {
        return setErr('Prices and packs per pallet must be numbers.');
      }
    }
    const ppp = opt('ppp');
    if (ppp != null && (ppp < 1 || Math.floor(ppp) !== ppp)) return setErr('Packs per pallet must be a whole number.');
    const rmin = opt('rmin'), rmax = opt('rmax');
    if (rmin != null && rmax != null && rmin > rmax) return setErr('Min selling price can’t be higher than max selling price.');
    save.mutate({
      name, description: (f.desc || '').trim() || null,
      pricePerPack: opt('price'), costPerPack: opt('cost'), packsPerPallet: ppp,
      minSellingPrice: rmin, maxSellingPrice: rmax, minStockLevel: min,
      ...(editing ? { isActive: f.status === 'Active' } : {})
    });
  };

  if (!open) return null;
  return (
    <ModalShell title={editing ? 'Edit Product' : 'Add New Product'} width={512} onClose={onClose}
      footer={<>
        {editing && <Btn variant="del" onClick={() => onDelete(product!)}>Delete Product</Btn>}
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="blue" onClick={submit} loading={save.isPending}>{editing ? 'Save Changes' : 'Create Product'}</Btn>
      </>}>
      <Field id="mp-num" label="Product Number">
        <input id="mp-num" className={inputCls} disabled value={editing ? product!.productNo : (nextNumber || '…')} readOnly />
      </Field>
      <Field id="mp-name" label="Name *">
        <input id="mp-name" className={inputCls} value={f.name || ''} onChange={set('name')} />
      </Field>
      <Field id="mp-desc" label="Description">
        <textarea id="mp-desc" className={inputCls} style={{ borderColor: '#101828' }} value={f.desc || ''} onChange={set('desc')} />
      </Field>
      <div className="ivm-g3">
        <Field id="mp-price" label="Price per Pack"><input id="mp-price" inputMode="decimal" className={inputCls} value={f.price || ''} onChange={set('price')} /></Field>
        <Field id="mp-cost" label="Cost per Pack"><input id="mp-cost" inputMode="decimal" className={inputCls} value={f.cost || ''} onChange={set('cost')} /></Field>
        <Field id="mp-ppp" label="Packs per Pallet"><input id="mp-ppp" inputMode="numeric" className={inputCls} value={f.ppp || ''} onChange={set('ppp')} /></Field>
      </div>
      <div className="ivm-g3">
        <Field id="mp-rmin" label="Min Selling Price"><input id="mp-rmin" inputMode="decimal" className={inputCls} value={f.rmin || ''} onChange={set('rmin')} /></Field>
        <Field id="mp-rmax" label="Max Selling Price"><input id="mp-rmax" inputMode="decimal" className={inputCls} value={f.rmax || ''} onChange={set('rmax')} /></Field>
        <Field id="mp-min" label="Min Stock Level *"><input id="mp-min" inputMode="numeric" className={inputCls} value={f.min || ''} onChange={set('min')} /></Field>
      </div>
      {editing && (
        <Field id="mp-status" label="Status">
          <select id="mp-status" className={inputCls} value={f.status} onChange={set('status')}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
      )}
      <div className="ivm-hint" style={{ marginTop: 0 }}>The low stock alert shows when stock falls to the min stock level or below.</div>
      <ErrorBox msg={err} />
    </ModalShell>
  );
};

// =====================================================================
// DELETE PRODUCT (or mark inactive when it has history)
// =====================================================================

interface DeleteProductModalProps {
  product: InventoryProduct | null;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onInactive: (message: string) => void;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({ product, onClose, onDeleted, onInactive }) => {
  const invalidate = useInvalidate();
  const [err, setErr] = useState('');
  const { data: detail, isLoading } = useQuery({
    queryKey: product ? inventoryKeys.product(product.id) : ['none'],
    queryFn: () => inventoryService.getProduct(product!.id),
    enabled: !!product
  });

  useEffect(() => setErr(''), [product]);

  const del = useMutation({
    mutationFn: () => inventoryService.deleteProduct(product!.id),
    onSuccess: () => { invalidate(); onDeleted(`${product!.name} (${product!.productNo}) deleted.`); },
    onError: (e) => setErr(apiError(e, 'Could not delete the product.'))
  });

  const inactive = useMutation({
    mutationFn: () => inventoryService.updateProduct(product!.id, {
      name: product!.name, description: product!.description, pricePerPack: product!.pricePerPack,
      costPerPack: product!.costPerPack, packsPerPallet: product!.packsPerPallet,
      minSellingPrice: product!.minSellingPrice, maxSellingPrice: product!.maxSellingPrice,
      minStockLevel: product!.minStockLevel, isActive: false
    }),
    onSuccess: () => { invalidate(); onInactive(`${product!.name} is now Inactive. Its purchase and sales history is kept.`); },
    onError: (e) => setErr(apiError(e, 'Could not update the product.'))
  });

  if (!product) return null;

  const nPur = detail?.purchases.length ?? 0;
  const hasSales = (detail?.product.salesCount ?? 0) > 0;
  const hist = !!detail && (nPur > 0 || detail.history.length > 0 || hasSales);
  const bits: string[] = [];
  if (nPur) bits.push(nPur + (nPur === 1 ? ' purchase' : ' purchases'));
  if (hasSales) bits.push('sales');
  const list = bits.length > 1 ? bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1] : (bits[0] || 'stock history');

  return (
    <ModalShell alert width={460} onClose={onClose} title={isLoading ? 'Delete Product' : hist ? 'Can’t delete this product' : 'Delete Product'}
      footer={<>
        <Btn variant="gray" onClick={onClose}>{hist ? 'Close' : 'Cancel'}</Btn>
        {!isLoading && !hist && <Btn variant="red" onClick={() => del.mutate()} loading={del.isPending}>Delete Product</Btn>}
        {!isLoading && hist && product.isActive && <Btn variant="blue" onClick={() => inactive.mutate()} loading={inactive.isPending}>Mark Inactive</Btn>}
      </>}>
      {isLoading ? (
        <p>Checking what’s recorded against {product.name}…</p>
      ) : (
        <>
          <p>
            {hist
              ? `${product.name} (${product.productNo}) has ${list} recorded. Deleting it would remove that history from stock and payment records.`
              : `Delete ${product.name} (${product.productNo})? Nothing has been recorded against it yet. This can’t be undone.`}
          </p>
          {hist && (
            <p>
              {product.isActive
                ? 'Mark it Inactive instead. It stays in the list with its history, but can’t be picked for new purchases.'
                : 'It is already Inactive, so it can’t be picked for new purchases.'}
            </p>
          )}
          <ErrorBox msg={err} />
        </>
      )}
    </ModalShell>
  );
};

// =====================================================================
// RECORD / EDIT PURCHASE
// =====================================================================

interface PurchaseModalProps {
  open: boolean;
  products: InventoryProduct[];
  initialProductId?: string;
  // editing
  purchase?: InventoryPurchase | null;
  purchaseProduct?: InventoryProduct | null;
  onClose: () => void;
  onSaved: (message: string, productId: string) => void;
}

const PAY_METHODS: [PurchasePaymentMethod, string][] = [['CASH', 'Cash'], ['BANK_TRANSFER', 'Bank Transfer'], ['POS', 'POS'], ['CREDIT', 'Credit']];
const PAY_STATUS: [PurchasePaymentStatus, string][] = [['PAID', 'Paid'], ['PARTIAL', 'Partially Paid'], ['PENDING', 'Unpaid']];

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  open, products, initialProductId, purchase, purchaseProduct, onClose, onSaved
}) => {
  const editing = !!purchase;
  const invalidate = useInvalidate();
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setErr('');
    if (purchase) {
      setF({
        productId: purchaseProduct?.id || '', vendor: purchase.vendorName || '', phone: purchase.vendorPhone || '',
        email: purchase.vendorEmail || '', order: purchase.orderNumber || '', batch: purchase.batchNumber || '',
        expiry: purchase.expiryDate || '', method: purchase.paymentMethod, pay: purchase.paymentStatus,
        paid: purchase.amountPaid == null ? '' : String(purchase.amountPaid), date: purchase.purchaseDate,
        invoice: purchase.invoiceNumber || '', notes: purchase.notes || ''
      });
    } else {
      setF({
        productId: initialProductId || '', vendor: '', phone: '', email: '', order: '', batch: '', expiry: '',
        qty: '1', unit: 'PACKS', cost: '', method: 'CASH', pay: 'PAID', paid: '', date: today(), invoice: '', notes: ''
      });
    }
  }, [open, purchase, purchaseProduct, initialProductId]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((o) => ({ ...o, [k]: e.target.value }));
    setErr('');
  };

  const rp = editing ? purchaseProduct : products.find((p) => p.id === f.productId);

  // The product's own purchases give the usual cost for the unusual-cost check
  const { data: rpDetail } = useQuery({
    queryKey: rp ? inventoryKeys.product(rp.id) : ['none'],
    queryFn: () => inventoryService.getProduct(rp!.id),
    enabled: open && !editing && !!rp
  });
  const history = useMemo(() => rpDetail?.purchases || [], [rpDetail]);

  const qtyN = parseNum(f.qty) || 0;
  const costN = parseNum(f.cost) || 0;
  const unitPerPack = f.unit === 'PALLETS' ? (rp?.packsPerPallet ? costN / rp.packsPerPallet : null) : costN;
  const med = useMemo(() => medianCostPerPack(history), [history]);
  const odd = !editing && !!rp && isUnusualCost(unitPerPack, rp.pricePerPack, med);
  const expired = editing && !!purchase?.expired;

  const productOptions = products.filter((p) => p.isActive || p.id === f.productId);

  const save = useMutation({
    mutationFn: async () => {
      const common = {
        vendorName: f.vendor.trim(), vendorPhone: f.phone.trim() || undefined, vendorEmail: f.email.trim() || undefined,
        orderNumber: f.order.trim() || undefined, batchNumber: f.batch.trim() || undefined,
        paymentMethod: f.method as PurchasePaymentMethod, paymentStatus: f.pay as PurchasePaymentStatus,
        amountPaid: f.paid === '' ? undefined : (parseNum(f.paid) as number),
        purchaseDate: f.date, invoiceNumber: f.invoice.trim() || undefined, notes: f.notes.trim() || undefined
      };
      if (editing) {
        return inventoryService.updatePurchase(purchase!.id, {
          ...common,
          vendorPhone: f.phone.trim(), vendorEmail: f.email.trim(), orderNumber: f.order.trim(),
          batchNumber: f.batch.trim(), invoiceNumber: f.invoice.trim(), notes: f.notes.trim(),
          ...(expired ? {} : { expiryDate: f.expiry || '' })
        });
      }
      return inventoryService.createPurchase({
        ...common, productId: f.productId, expiryDate: f.expiry || undefined,
        quantity: qtyN, unitType: f.unit as 'PACKS' | 'PALLETS', costPerUnit: costN
      });
    },
    onSuccess: () => {
      invalidate();
      if (editing) return onSaved('Purchase updated.', rp!.id);
      const packs = f.unit === 'PALLETS' ? qtyN * (rp!.packsPerPallet || 0) : qtyN;
      onSaved(`Purchase recorded. ${rp!.name} stock is now ${n0(rp!.currentStock + packs)} packs.`, rp!.id);
    },
    onError: (e) => setErr(apiError(e, 'Could not save the purchase.'))
  });

  const submit = () => {
    if (!rp) return setErr('Select a product.');
    if (!f.vendor.trim()) return setErr('Enter the vendor name.');
    if (!f.date) return setErr('Enter the purchase date.');
    if (f.date > today()) return setErr('Purchase date can’t be in the future.');
    if (f.paid !== '' && parseNum(f.paid) == null) return setErr('Amount paid must be a number.');
    if (editing) {
      if (!expired && f.expiry !== (purchase!.expiryDate || '') && f.expiry && f.expiry <= today()) {
        return setErr('Expiry date must be after today. To write off stock, use Adjust.');
      }
      if (f.expiry && f.expiry <= f.date) return setErr('Expiry date must be after the purchase date.');
    } else {
      if (!qtyN || qtyN <= 0 || Math.floor(qtyN) !== qtyN) return setErr('Quantity must be a whole number above 0.');
      if (!costN || costN <= 0) return setErr('Enter the cost per unit (greater than 0).');
      if (f.unit === 'PALLETS' && !rp.packsPerPallet) {
        return setErr(`${rp.name} has no packs per pallet set. Record in packs, or set packs per pallet in Product Details.`);
      }
      if (f.expiry && f.expiry <= today()) return setErr('Expiry date must be after today.');
    }
    save.mutate();
  };

  const total = qtyN * costN;
  const packsNote = f.unit === 'PALLETS' && rp?.packsPerPallet ? ` (${n0(qtyN * rp.packsPerPallet)} packs)` : '';

  if (!open) return null;
  return (
    <ModalShell title={editing ? 'Edit Purchase' : 'Record Warehouse Purchase'} width={512} onClose={onClose}
      footer={<>
        <Btn variant="gray" onClick={onClose}>Cancel</Btn>
        <Btn variant="blue" onClick={submit} loading={save.isPending}>{editing ? 'Update Purchase' : 'Record Purchase'}</Btn>
      </>}>
      <Field id="mr-prod" label="Product *"
        hint={editing ? 'Product cannot be changed after creation'
          : rp ? `In stock now: ${n0(rp.currentStock)} packs${rp.packsPerPallet ? ` · ${n0(rp.packsPerPallet)} packs per pallet` : ''}` : undefined}>
        {editing ? (
          <input id="mr-prod" className={inputCls} disabled readOnly value={rp ? `${rp.name} (${rp.productNo})` : ''} />
        ) : (
          <select id="mr-prod" className={inputCls} value={f.productId || ''} onChange={set('productId')}>
            <option value="">Select Product</option>
            {productOptions.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.productNo})</option>)}
          </select>
        )}
      </Field>
      <div className="ivm-g3">
        <Field id="mr-vn" label="Vendor Name *" icon={<User aria-hidden="true" />}><input id="mr-vn" className={inputCls} value={f.vendor || ''} onChange={set('vendor')} /></Field>
        <Field id="mr-vp" label="Vendor Phone" icon={<Phone aria-hidden="true" />}><input id="mr-vp" type="tel" className={inputCls} value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field id="mr-ve" label="Vendor Email" icon={<Mail aria-hidden="true" />}><input id="mr-ve" type="email" className={inputCls} value={f.email || ''} onChange={set('email')} /></Field>
        <Field id="mr-on" label="Order Number" icon={<Hash aria-hidden="true" />}><input id="mr-on" placeholder="e.g., ORD-2024-001" className={inputCls} value={f.order || ''} onChange={set('order')} /></Field>
        <Field id="mr-bn" label="Batch Number" icon={<FileText aria-hidden="true" />}><input id="mr-bn" placeholder="e.g., BATCH-A123" className={inputCls} value={f.batch || ''} onChange={set('batch')} /></Field>
        <Field id="mr-ex" label="Expiry Date" icon={<Clock aria-hidden="true" />}><input id="mr-ex" type="date" className={inputCls} style={{ paddingRight: 8 }} value={f.expiry || ''} onChange={set('expiry')} disabled={expired} /></Field>
      </div>
      {!editing && (
        <>
          <div className="ivm-g3">
            <Field id="mr-q" label="Quantity *" icon={<Package aria-hidden="true" />}><input id="mr-q" inputMode="numeric" className={inputCls} value={f.qty || ''} onChange={set('qty')} /></Field>
            <Field id="mr-u" label="Unit Type *">
              <select id="mr-u" className={inputCls} value={f.unit} onChange={set('unit')}>
                <option value="PACKS">Packs</option>
                <option value="PALLETS">Pallets</option>
              </select>
            </Field>
            <Field id="mr-c" label="Cost Per Unit *" icon={<DollarSign aria-hidden="true" />}><input id="mr-c" inputMode="decimal" placeholder="Enter cost" className={inputCls} value={f.cost || ''} onChange={set('cost')} /></Field>
          </div>
          <div className="ivm-total">
            <span>Total Cost{packsNote}</span>
            <b>{ngn(total)}</b>
          </div>
          {odd && (
            <div role="status" className="ivm-caution">
              This works out to {ngn(Math.round((unitPerPack as number) * 100) / 100)} per pack
              {rp!.pricePerPack ? `, and ${rp!.name} sells for ${ngn(rp!.pricePerPack)} per pack` : med != null ? `, far from the usual ${ngn(Math.round(med))} per pack` : ''}.
              {' '}Check the quantity and cost before saving.
            </div>
          )}
        </>
      )}
      <div className="ivm-g3">
        <Field id="mr-pm" label="Payment Method *">
          <select id="mr-pm" className={inputCls} value={f.method} onChange={set('method')}>
            {PAY_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            {f.method && !PAY_METHODS.some(([v]) => v === f.method) && <option value={f.method}>{f.method}</option>}
          </select>
        </Field>
        <Field id="mr-ps" label="Payment Status *">
          <select id="mr-ps" className={inputCls} value={f.pay} onChange={set('pay')}>
            {PAY_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field id="mr-ap" label="Amount Paid" icon={<DollarSign aria-hidden="true" />}><input id="mr-ap" inputMode="decimal" className={inputCls} value={f.paid || ''} onChange={set('paid')} /></Field>
      </div>
      <div className="ivm-g2">
        <Field id="mr-pd" label="Purchase Date *" icon={<Calendar aria-hidden="true" />}><input id="mr-pd" type="date" className={inputCls} value={f.date || ''} onChange={set('date')} /></Field>
        <Field id="mr-in" label="Invoice Number" icon={<FileText aria-hidden="true" />}><input id="mr-in" className={inputCls} value={f.invoice || ''} onChange={set('invoice')} /></Field>
      </div>
      <Field id="mr-nt" label="Notes">
        <textarea id="mr-nt" placeholder="Additional notes about this purchase..." className={inputCls} value={f.notes || ''} onChange={set('notes')} />
      </Field>
      <ErrorBox msg={err} />
    </ModalShell>
  );
};

// =====================================================================
// ADJUST STOCK
// =====================================================================

const REASONS = ['Damaged', 'Expired', 'Count correction', 'Returned to vendor', 'Other'];

interface AdjustModalProps {
  product: InventoryProduct | null;
  purchase: InventoryPurchase | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export const AdjustModal: React.FC<AdjustModalProps> = ({ product, purchase, onClose, onSaved }) => {
  const invalidate = useInvalidate();
  const [f, setF] = useState({ dir: 'remove', qty: '', reason: 'Damaged', note: '' });
  const [err, setErr] = useState('');

  useEffect(() => {
    setF({ dir: 'remove', qty: '', reason: 'Damaged', note: '' });
    setErr('');
  }, [purchase]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((o) => ({ ...o, [k]: e.target.value }));
    setErr('');
  };

  const save = useMutation({
    mutationFn: () => inventoryService.adjustStock(purchase!.id, {
      direction: f.dir as 'add' | 'remove', quantity: parseNum(f.qty) as number, reason: f.reason, note: f.note.trim()
    }),
    onSuccess: (res) => { invalidate(); onSaved(res.message); },
    onError: (e) => setErr(apiError(e, 'Could not save the adjustment.'))
  });

  if (!product || !purchase) return null;

  const q = parseNum(f.qty) || 0;
  const after = product.currentStock + (f.dir === 'remove' ? -q : q);
  const ref = `Order ${purchase.orderNumber || '—'} · Batch ${purchase.batchNumber || '—'}`;

  const submit = () => {
    if (!q || q <= 0 || Math.floor(q) !== q) return setErr('Enter a whole number of packs above 0.');
    if (f.dir === 'remove' && q > purchase.quantityRemaining) {
      return setErr(`You can remove at most ${n0(purchase.quantityRemaining)} packs from this purchase.`);
    }
    if (!f.note.trim()) return setErr('Add a note explaining the adjustment.');
    save.mutate();
  };

  return (
    <ModalShell title="Adjust Stock" width={480} onClose={onClose}
      footer={<>
        <Btn variant="gray" onClick={onClose}>Cancel</Btn>
        <Btn variant="blue" onClick={submit} loading={save.isPending}>Save Adjustment</Btn>
      </>}>
      <div className="ivm-total" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <b>{product.name} ({product.productNo})</b>
        <span>{ref} · {n0(purchase.quantityRemaining)} packs left from this purchase</span>
      </div>
      <div className="ivm-g2">
        <Field id="ma-dir" label="Adjustment *">
          <select id="ma-dir" className={inputCls} value={f.dir} onChange={set('dir')}>
            <option value="remove">Remove from stock</option>
            <option value="add">Add to stock</option>
          </select>
        </Field>
        <Field id="ma-q" label="Quantity (packs) *"><input id="ma-q" inputMode="numeric" placeholder="e.g. 5" className={inputCls} value={f.qty} onChange={set('qty')} /></Field>
      </div>
      <Field id="ma-r" label="Reason *">
        <select id="ma-r" className={inputCls} value={f.reason} onChange={set('reason')}>
          {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <Field id="ma-n" label="Note *">
        <textarea id="ma-n" placeholder="What happened? This is saved in the stock history." className={inputCls} value={f.note} onChange={set('note')} />
      </Field>
      <div className="ivm-total">
        <span>Stock after adjustment</span>
        <b>{n0(after)} packs</b>
      </div>
      <ErrorBox msg={err} />
    </ModalShell>
  );
};

// =====================================================================
// DELETE PURCHASE
// =====================================================================

interface DeletePurchaseModalProps {
  product: InventoryProduct | null;
  purchase: InventoryPurchase | null;
  onClose: () => void;
  onDeleted: (message: string) => void;
}

export const DeletePurchaseModal: React.FC<DeletePurchaseModalProps> = ({ product, purchase, onClose, onDeleted }) => {
  const invalidate = useInvalidate();
  const [err, setErr] = useState('');
  useEffect(() => setErr(''), [purchase]);

  const del = useMutation({
    mutationFn: () => inventoryService.deletePurchase(purchase!.id),
    onSuccess: () => {
      invalidate();
      const after = purchase!.expired ? product!.currentStock : product!.currentStock - purchase!.quantityReceived;
      onDeleted(`Purchase deleted. ${product!.name} stock is now ${n0(after)} packs.`);
    },
    onError: (e) => setErr(apiError(e, 'Could not delete the purchase.'))
  });

  if (!product || !purchase) return null;

  return (
    <ModalShell alert title="Delete Purchase" width={440} onClose={onClose}
      footer={<>
        <Btn variant="gray" onClick={onClose}>Cancel</Btn>
        <Btn variant="red" onClick={() => del.mutate()} loading={del.isPending}>Delete Purchase</Btn>
      </>}>
      <p>
        Delete the purchase of {n0(purchase.quantityReceived)} packs of {product.name}
        {purchase.orderNumber ? ` (Order ${purchase.orderNumber})` : ''} from {purchase.vendorName || 'the vendor'} on {fd(purchase.purchaseDate)}?{' '}
        {purchase.expired
          ? 'This purchase has expired, so current stock won’t change.'
          : `Current stock will drop by ${n0(purchase.quantityReceived)} packs.`}
      </p>
      <ErrorBox msg={err} />
    </ModalShell>
  );
};
