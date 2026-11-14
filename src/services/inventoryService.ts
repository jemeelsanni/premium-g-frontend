// src/services/inventoryService.ts
// Warehouse Inventory Management: products, stock, purchases, history, adjustments
import { BaseApiService } from './api';

export type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NORMAL';
export type PurchasePaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'POS' | 'CREDIT' | 'CHECK' | 'CARD' | 'MOBILE_MONEY';
export type PurchasePaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';

export interface InventoryProduct {
  id: string;
  productNo: string;
  name: string;
  description: string | null;
  pricePerPack: number | null;
  costPerPack: number | null;
  packsPerPallet: number | null;
  minSellingPrice: number | null;
  maxSellingPrice: number | null;
  isActive: boolean;
  module: string;
  currentStock: number;
  minStockLevel: number;
  stockStatus: StockStatus;
  stockValue: number | null;
  nextExpiry: string | null;
  expiredQuantity: number;
  expiredBatches: number;
  expiringBatches: number;
  lastRestocked: string | null;
  purchaseCount: number;
}

export interface InventoryPurchase {
  id: string;
  orderNumber: string | null;
  batchNumber: string | null;
  invoiceNumber: string | null;
  quantityReceived: number;
  quantityRemaining: number;
  quantitySold: number;
  quantityAdjusted: number;
  expiryDate: string | null;
  expired: boolean;
  usedUp: boolean;
  vendorName: string;
  vendorPhone: string | null;
  vendorEmail: string | null;
  totalCost: number | null;
  costPerPack: number | null;
  paymentMethod: PurchasePaymentMethod;
  paymentStatus: PurchasePaymentStatus;
  amountPaid: number | null;
  amountDue: number | null;
  purchaseDate: string;
  notes: string | null;
  createdAt: string;
  hasSales: boolean;
  hasAdjustments: boolean;
}

export type MovementType = 'Purchase' | 'Sale' | 'Expired' | 'Adjustment' | 'Purchase deleted';

export interface StockMovement {
  date: string;
  type: MovementType;
  qty: number;
  detail: string;
  by: string;
  balance: number;
}

export interface InventoryProductDetail {
  today: string;
  product: InventoryProduct & { salesCount: number };
  purchases: InventoryPurchase[];
  history: StockMovement[];
}

export interface ProductInput {
  name: string;
  description?: string | null;
  pricePerPack?: number | null;
  costPerPack?: number | null;
  packsPerPallet?: number | null;
  minSellingPrice?: number | null;
  maxSellingPrice?: number | null;
  minStockLevel: number;
  isActive?: boolean;
}

export interface CreatePurchaseInput {
  productId: string;
  vendorName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  orderNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitType: 'PACKS' | 'PALLETS';
  costPerUnit: number;
  paymentMethod: PurchasePaymentMethod;
  paymentStatus: PurchasePaymentStatus;
  amountPaid?: number;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
}

export type UpdatePurchaseInput = Omit<CreatePurchaseInput, 'productId' | 'quantity' | 'unitType' | 'costPerUnit'>;

export interface AdjustInput {
  direction: 'add' | 'remove';
  quantity: number;
  reason: string;
  note: string;
}

class InventoryService extends BaseApiService {
  constructor() {
    super('/warehouse');
  }

  async getProducts(): Promise<{ products: InventoryProduct[]; today: string }> {
    const res = await this.get<{ data: { products: InventoryProduct[]; today: string } }>('/inventory-management/products');
    return res.data;
  }

  async getProduct(id: string): Promise<InventoryProductDetail> {
    const res = await this.get<{ data: InventoryProductDetail }>(`/inventory-management/products/${id}`);
    return res.data;
  }

  async getNextProductNumber(): Promise<string> {
    const res = await this.get<{ data: { productNumber: string } }>('/inventory-management/products/next-number');
    return res.data.productNumber;
  }

  async createProduct(data: ProductInput): Promise<InventoryProduct> {
    const res = await this.post<{ data: { product: InventoryProduct } }>(data, '/inventory-management/products');
    return res.data.product;
  }

  async updateProduct(id: string, data: ProductInput): Promise<InventoryProduct> {
    const res = await this.put<{ data: { product: InventoryProduct } }>(data, `/inventory-management/products/${id}`);
    return res.data.product;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.delete(`/inventory-management/products/${id}`);
  }

  async createPurchase(data: CreatePurchaseInput): Promise<{ message: string; warning?: { message: string } }> {
    return this.post(data, '/purchases');
  }

  async updatePurchase(id: string, data: UpdatePurchaseInput): Promise<{ message: string }> {
    return this.put(data, `/purchases/${id}`);
  }

  async deletePurchase(id: string): Promise<{ message: string }> {
    return this.delete(`/purchases/${id}`);
  }

  async adjustStock(batchId: string, data: AdjustInput): Promise<{ message: string; data: { currentStock: number } }> {
    return this.post(data, `/inventory-management/batches/${batchId}/adjust`);
  }
}

export const inventoryService = new InventoryService();

// Query keys shared by the page, the product page and the header bell
export const inventoryKeys = {
  list: ['inventory-management', 'products'] as const,
  product: (id: string) => ['inventory-management', 'product', id] as const,
  all: ['inventory-management'] as const
};

// Pull the backend's message out of an axios error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiError = (e: any, fallback: string): string =>
  (Array.isArray(e?.response?.data?.details) && e.response.data.details[0]?.msg)
  || e?.response?.data?.message
  || fallback;
