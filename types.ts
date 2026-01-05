
export interface Store {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  salePrice: number;
  purchasePrice?: number;
  quantity: number;
  storeId: string;
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number; // Positive means they owe us
}

export interface SaleItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  paid: number;
  change: number;
  customerId?: string;
  paymentMethod: 'cash' | 'credit';
}

export interface Settings {
  companyName: string;
  currency: string;
  logo?: string;
  password?: string;
  username: string;
}

export interface DBState {
  items: Item[];
  customers: Customer[];
  stores: Store[];
  sales: Sale[];
  settings: Settings;
}

export type AppTab = 'sale' | 'items' | 'customers' | 'stores' | 'reports' | 'settings';
