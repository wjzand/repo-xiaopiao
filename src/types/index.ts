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
  monthlyBudget: number;
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

export interface ShoppingListItem {
  id: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  estimatedPrice: number;
  isPurchased: boolean;
  actualPrice?: number;
  isRecommended?: boolean;
  lastPurchaseDate?: string;
  lastPurchasePrice?: number;
  historyLowPrice?: number;
  historyAvgPrice?: number;
  note?: string;
}

export type ShoppingListStatus = 'active' | 'completed';

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  status: ShoppingListStatus;
  budgetLimit?: number;
  createdAt: string;
  completedAt?: string;
  targetStoreName?: string;
}

export interface ConsumptionAnalysis {
  productName: string;
  normalizedName: string;
  purchaseHistory: {
    date: string;
    quantity: number;
    unitPrice: number;
    receiptId: string;
  }[];
  avgConsumptionCycleDays: number | null;
  avgPurchaseQuantity: number;
  lastPurchaseDate: string | null;
  estimatedFinishDate: string | null;
  isLowStock: boolean;
  historyLowPrice: number | null;
  historyAvgPrice: number | null;
  latestPrice: number | null;
}

export interface PurchaseRecommendation {
  name: string;
  category: ProductCategory;
  suggestedQuantity: number;
  estimatedPrice: number;
  lastPurchaseDate: string | null;
  lastPurchasePrice: number | null;
  historyLowPrice: number | null;
  historyAvgPrice: number | null;
  estimatedFinishDate: string | null;
  daysUntilFinish: number | null;
  reason: 'low-stock' | 'upcoming' | 'cycle';
}

export interface MonthlyStats {
  monthKey: string;
  label: string;
  totalAmount: number;
  receiptCount: number;
  uniqueProducts: number;
  processedCount: number;
  expiredCount: number;
  processingRate: number;
  categoryBreakdown: Record<ProductCategory, { count: number; amount: number }>;
  topProducts: { name: string; quantity: number; amount: number }[];
  dailyTrend: { date: string; amount: number }[];
}

export interface LineChartData {
  labels: string[];
  values: number[];
  color?: string;
}

export interface BarChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}
