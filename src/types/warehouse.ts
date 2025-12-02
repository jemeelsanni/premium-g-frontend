// src/types/warehouse.ts - FIXED VERSION

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
  discountPercentage?: number | null;
  discountReason?: string | null;
  originalUnitPrice?: number | null;
  approvedBy?: string | null;
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
  stockStatus: string;
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

// ✅ FIXED: Changed minSellingPrice and maxSellingPrice from boolean to number | null
export interface Product {
  id: string;
  name: string;
  productNo: string;
  description?: string;
  pricePerPack?: number;
  costPerPack?: number;
  minSellingPrice?: number | null;  // ✅ FIXED: was boolean, now number | null
  maxSellingPrice?: number | null;  // ✅ FIXED: was boolean, now number | null
  isActive: boolean;
  currentStock?: number;  // Optional to match main Product type
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

export interface WarehouseDiscount {
  id: string;
  productId: string;
  product?: Product;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  reason?: string | null;
  minimumQuantity?: number | null;
  maximumDiscountAmount?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  requiresApproval: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  approvalRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseDebtor {
  id: string;
  saleId: string;
  warehouseCustomerId: string;
  warehouseCustomer?: WarehouseCustomer;
  sale?: WarehouseSale;
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  dueDate?: string | null;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: DebtorPayment[];
}

export interface DebtorPayment {
  id: string;
  debtorId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface OffloadPurchase {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitType: string;
  costPerUnit: number;
  totalCost: number;
  supplierName: string;
  supplierContact?: string | null;
  purchaseDate: string;
  notes?: string | null;
  recordedBy: string;
  recordedByUser?: {
    id: string;
    username: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyOpeningStock {
  id: string;
  date: string;
  productId: string;
  product?: Product;
  openingStock: number;
  unitType: string;
  recordedBy: string;
  recordedByUser?: {
    id: string;
    username: string;
    role: string;
  };
  notes?: string | null;
  createdAt: string;
}

export interface WarehouseCashFlow {
  id: string;
  transactionType: 'SALE' | 'EXPENSE' | 'PURCHASE' | 'ADJUSTMENT';
  amount: number;
  description: string;
  referenceId?: string | null;
  referenceType?: string | null;
  balanceAfter: number;
  recordedBy: string;
  recordedByUser?: {
    id: string;
    username: string;
    role: string;
  };
  transactionDate: string;
  createdAt: string;
}