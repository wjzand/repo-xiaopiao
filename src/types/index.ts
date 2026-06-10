export type ProductCategory =
  | 'dairy'
  | 'meat'
  | 'vegetable'
  | 'fruit'
  | 'snack'
  | 'beverage'
  | 'seasoning'
  | 'other';

export interface Receipt {
  id: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  imageBase64?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  receiptId: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  productionDate: string;
  shelfLifeDays: number;
  expiryDate: string;
  note?: string;
  isProcessed: boolean;
  createdAt: string;
}

export interface ShelfLifeItem {
  keyword: string;
  category: ProductCategory;
  days: number;
}

export interface Settings {
  reminderDays: number;
}

export type ExpiryStatus = 'expired' | 'today' | 'urgent' | 'warning' | 'normal';

export interface ProductWithReceipt extends Product {
  storeName: string;
}

export interface MonthlyReceipts {
  month: string;
  label: string;
  receipts: Receipt[];
}
