
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
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseSale {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerName: string;
  salesOfficer: string;
  createdAt: string;
  updatedAt: string;
  unitType?: string;
  paymentMethod?: string;
  customerPhone?: string | null;
  receiptNumber?: string;
  discountApplied?: boolean;
  discountPercentage?: number | null;
  totalDiscountAmount?: number | null;
  discountReason?: string | null;
  originalUnitPrice?: number | null;
  salesOfficerUser?: {
    username?: string;
  } | null;
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
