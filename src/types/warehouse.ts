import { Product } from "./common";

export interface WarehouseCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  customerType: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
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
}

export interface WarehouseInventory {
  id: string;
  productId: string;
  product?: Product;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}