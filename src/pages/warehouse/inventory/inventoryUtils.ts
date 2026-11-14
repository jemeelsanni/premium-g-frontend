// Formatting and stock rules shared by the Inventory Management screens
import type { InventoryProduct, InventoryPurchase, StockMovement } from '../../../services/inventoryService';

export const n0 = (x: number | null | undefined) =>
  Number(x ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

export const ngn = (x: number | null | undefined) =>
  x == null ? '—' : '₦' + Number(x).toLocaleString('en-US', { maximumFractionDigits: 2 });

export const ngn2 = (x: number | null | undefined) =>
  x == null ? 'N/A' : '₦' + Number(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// YYYY-MM-DD -> DD/MM/YYYY
export const fd = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const dn = (iso: string) => Date.parse(iso.slice(0, 10) + 'T00:00:00Z') / 86400000;
export const daysBetween = (fromISO: string, toISO: string) => Math.round(dn(toISO) - dn(fromISO));
export const daysText = (d: number) => (d === 1 ? '1 day left' : `${d} days left`);

export const parseNum = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
};

export const statusLabel = (p: Pick<InventoryProduct, 'stockStatus'>) =>
  p.stockStatus === 'OUT_OF_STOCK' ? 'Out of stock' : p.stockStatus === 'LOW_STOCK' ? 'Low stock' : 'Normal';

export const statusPill = (p: Pick<InventoryProduct, 'stockStatus'>) =>
  'ivm-pill ' + (p.stockStatus === 'OUT_OF_STOCK' ? 'ivm-p-red' : p.stockStatus === 'LOW_STOCK' ? 'ivm-p-yellow' : 'ivm-p-green');

export const isLow = (p: Pick<InventoryProduct, 'currentStock' | 'minStockLevel'>) => p.currentStock <= p.minStockLevel;

export type PurchaseCategory = 'stock' | 'used' | 'expired';
export const purchaseCategory = (b: InventoryPurchase): PurchaseCategory =>
  b.quantityRemaining <= 0 ? 'used' : b.expired ? 'expired' : 'stock';

// Newest first
export const sortPurchases = (list: InventoryPurchase[]) =>
  list.slice().sort((a, b) =>
    a.purchaseDate === b.purchaseDate
      ? (a.createdAt < b.createdAt ? 1 : -1)
      : (a.purchaseDate < b.purchaseDate ? 1 : -1));

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const medianCostPerPack = (purchases: InventoryPurchase[]) =>
  median(purchases.map((b) => b.costPerPack).filter((u): u is number => u != null && u > 0));

// A cost per pack that's far off the selling price (or the usual cost) is
// probably a typo in quantity or cost.
export const isUnusualCost = (u: number | null, pricePerPack: number | null, med: number | null) => {
  if (u == null || !(u > 0)) return false;
  if (pricePerPack) return u > pricePerPack * 2 || u < pricePerPack * 0.1;
  return med != null && (u > med * 3 || u < med / 3);
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', POS: 'POS', CREDIT: 'Credit',
  CHECK: 'Check', CARD: 'Card', MOBILE_MONEY: 'Mobile Money'
};

export const paymentPill = (status: string) =>
  status === 'PAID' ? { text: 'Paid', cls: 'ivm-pill ivm-pill-up ivm-p-green' }
    : status === 'PENDING' ? { text: 'Unpaid', cls: 'ivm-pill ivm-pill-up ivm-p-red' }
      : { text: 'Partial', cls: 'ivm-pill ivm-pill-up ivm-p-yellow' };

export interface HistoryRow extends StockMovement {
  count: number;
}

// Sales on the same day collapse into one line; newest first
export const groupHistory = (moves: StockMovement[]): HistoryRow[] => {
  const groups: HistoryRow[] = [];
  for (const m of moves) {
    const last = groups[groups.length - 1];
    if (m.type === 'Sale' && last && last.type === 'Sale' && last.date === m.date) {
      last.qty += m.qty;
      last.count += 1;
      last.balance = m.balance;
    } else {
      groups.push({ ...m, count: 1 });
    }
  }
  return groups.reverse();
};

export const MOVE_PILL: Record<string, string> = {
  Purchase: 'ivm-p-blue',
  Sale: 'ivm-p-gray',
  Sales: 'ivm-p-gray',
  Expired: 'ivm-p-red',
  Adjustment: 'ivm-p-yellow',
  'Purchase deleted': 'ivm-p-red'
};

export const pageInfo = (total: number, page: number, per: number) => {
  const pages = Math.max(1, Math.ceil(total / per));
  const pg = Math.min(Math.max(1, page), pages);
  return { pages, page: pg, start: (pg - 1) * per };
};
