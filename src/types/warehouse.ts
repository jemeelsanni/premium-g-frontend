// src/types/warehouse.ts - COMPLETE FIXED VERSION

export interface WarehouseCustomer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  customerType: string;
  businessName?: string | null;
  preferredPaymentMethod?: string | null;
  creditLimit?: number | null;
  totalPurchases: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastPurchaseDate?: string | null;
   paymentReliabilityScore: number;
    outstandingDebt: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  isVIP?: boolean;
    isRecent?: boolean;
}

export interface WarehouseSaleRecord {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitType?: string;
  unitPrice: number;
  totalAmount: number;
  totalDiscountAmount?: number | null;
  totalCost?: number | null;
  costPerUnit?: number | null;
  grossProfit?: number | null;
  customerName: string;
  customerPhone?: string | null;
  warehouseCustomerId?: string | null;
  salesOfficer: string;
  salesOfficerUser?: {
    id?: string;
    username?: string;
    role?: string;
  } | null;
  createdAt: string;
  paymentMethod?: string;
  receiptNumber?: string;
  discountApplied?: boolean;
  discountPercentage?: number | null;
  discountReason?: string | null;
  originalUnitPrice?: number | null;
}

export interface WarehouseSaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalAmount: number;
  totalDiscountAmount: number;
  discountApplied: boolean;
  discountPercentage?: number | null;
  originalUnitPrice?: number | null;
  costPerUnit?: number | null;
  totalCost?: number | null;
  grossProfit?: number | null;
}

// ✅ FIXED: Added missing discount fields
export interface WarehouseSale {
  receiptNumber: string;
  saleIds: string[];
  warehouseCustomerId?: string | null;
  warehouseCustomer?: WarehouseCustomer | null;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod?: string;
  salesOfficer?: string;
  salesOfficerUser?: {
    id?: string;
    username?: string;
    role?: string;
  } | null;
  totalAmount: number;
  totalDiscountAmount: number;
  totalCost: number;
  grossProfit: number;
  discountApplied: boolean;
  discountPercentage?: number | null;  // ✅ ADDED
  discountReason?: string | null;      // ✅ ADDED - Fixes TypeScript error
  originalUnitPrice?: number | null;   // ✅ ADDED
  approvedBy?: string | null;          // ✅ ADDED
  createdAt: string;
  totalQuantity: number;
  itemsCount: number;
  paymentStatus: 'PAID' | 'CREDIT' | 'PARTIAL';
  creditDueDate?: string;
  debtor?: {
        amountPaid: number;
        amountDue: number;
    };
    creditNotes?: string;
  items: WarehouseSaleItem[];
}

export interface WarehouseInventory {
  id: string;
  productId: string;
  product?: Product;
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  pallets?: number;
  packs?: number;
  units?: number;
  reorderLevel?: number;
  maxStockLevel?: number | null;
  location?: string | null;
  lastRestocked?: string | null;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  productNo: string;
  description?: string;
  pricePerPack?: number;
  costPerPack?: number;
  isActive: boolean;
  currentStock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customerType?: string;
}

export interface WarehouseExpense {
  id: string;
  expenseType: string;
  category: string;
  amount: number | string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  isPaid: boolean;
  paymentDate?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  createdByUser?: {
    username?: string;
  };
  approver?: {
    username?: string;
  } | null;
}