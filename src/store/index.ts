import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Product,
  ProductWithReceipt,
  Receipt,
  Settings,
  ShelfLifeItem,
  ShoppingList,
  ShoppingListItem,
  MonthlyStats,
  ConsumptionAnalysis,
  PurchaseRecommendation,
  ProductCategory,
} from '@/types';
import { SHELF_LIFE_DEFAULTS } from '@/constants/shelfLife';
import { createSampleData, generateUUID, createReceipt, createProductFromRandom, RandomProductResult } from '@/utils/common';
import {
  getExpiryStatus,
  getRemainingDays,
  getTodayStr,
  getMonthKey,
  addDays,
} from '@/utils/date';
import {
  calculateMonthlyStats,
  generatePurchaseRecommendations,
  getLowStockProducts,
  getProductConsumptionAnalysis,
  getThisMonthSpent,
} from '@/utils/consumption';
import { matchShelfLife } from '@/utils/shelfLife';

interface AppState {
  receipts: Receipt[];
  products: Product[];
  shelfLifeDefaults: ShelfLifeItem[];
  settings: Settings;
  reminderBannerDate: string | null;
  shoppingLists: ShoppingList[];

  initSampleData: () => void;
  addReceipt: (receipt: Receipt, products: Product[]) => void;
  deleteReceipt: (receiptId: string) => void;
  getReceiptById: (id: string) => Receipt | undefined;
  getProductsByReceiptId: (receiptId: string) => Product[];

  updateProduct: (productId: string, updates: Partial<Product>) => void;
  getProductById: (id: string) => Product | undefined;
  getProductWithReceipt: (id: string) => ProductWithReceipt | undefined;

  getActiveProducts: () => ProductWithReceipt[];
  getExpiredCount: () => number;
  getTodayExpiringCount: () => number;
  getUrgentCount: (days?: number) => number;
  getUrgentProducts: (days?: number) => ProductWithReceipt[];

  shouldShowBanner: () => boolean;
  markBannerShown: () => void;

  updateSettings: (updates: Partial<Settings>) => void;
  updateShelfLifeDefaults: (items: ShelfLifeItem[]) => void;
  addShelfLifeItem: (item: ShelfLifeItem) => void;
  removeShelfLifeItem: (keyword: string) => void;

  clearAllData: () => void;

  createShoppingList: (name: string, budgetLimit?: number) => ShoppingList;
  updateShoppingList: (listId: string, updates: Partial<ShoppingList>) => void;
  deleteShoppingList: (listId: string) => void;
  getShoppingListById: (id: string) => ShoppingList | undefined;
  addShoppingListItem: (listId: string, item: Omit<ShoppingListItem, 'id'>) => void;
  updateShoppingListItem: (listId: string, itemId: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (listId: string, itemId: string) => void;
  toggleShoppingItemPurchased: (listId: string, itemId: string) => void;
  completeShoppingList: (listId: string, storeName?: string) => { receipt: Receipt; products: Product[] } | null;

  getPurchaseRecommendations: () => PurchaseRecommendation[];
  getProductConsumption: (productName: string) => ConsumptionAnalysis | null;
  getLowStockList: () => ConsumptionAnalysis[];
  getMonthlyStats: (monthKey?: string) => MonthlyStats;
  getThisMonthBudgetSpent: () => number;
  getThisMonthBudgetRemaining: () => number;
}

const INITIAL_SETTINGS: Settings = {
  reminderDays: 3,
  monthlyBudget: 2000,
};

const { receipts: sampleReceipts, products: sampleProducts } = createSampleData();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      receipts: sampleReceipts,
      products: sampleProducts,
      shelfLifeDefaults: SHELF_LIFE_DEFAULTS,
      settings: INITIAL_SETTINGS,
      reminderBannerDate: null,
      shoppingLists: [],

      initSampleData: () => {
        const { receipts, products } = createSampleData();
        set({ receipts, products });
      },

      addReceipt: (receipt, products) => {
        set((state) => ({
          receipts: [receipt, ...state.receipts],
          products: [...products, ...state.products],
        }));
      },

      deleteReceipt: (receiptId) => {
        set((state) => ({
          receipts: state.receipts.filter((r) => r.id !== receiptId),
          products: state.products.filter((p) => p.receiptId !== receiptId),
        }));
      },

      getReceiptById: (id) => get().receipts.find((r) => r.id === id),

      getProductsByReceiptId: (receiptId) =>
        get().products.filter((p) => p.receiptId === receiptId),

      updateProduct: (productId, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, ...updates } : p
          ),
        }));
      },

      getProductById: (id) => get().products.find((p) => p.id === id),

      getProductWithReceipt: (id) => {
        const product = get().products.find((p) => p.id === id);
        if (!product) return undefined;
        const receipt = get().receipts.find((r) => r.id === product.receiptId);
        return { ...product, storeName: receipt?.storeName ?? '未知' };
      },

      getActiveProducts: () => {
        const { receipts, products } = get();
        return products
          .filter((p) => !p.isProcessed)
          .map((p) => ({
            ...p,
            storeName: receipts.find((r) => r.id === p.receiptId)?.storeName ?? '未知',
          }));
      },

      getExpiredCount: () => {
        return get()
          .products.filter((p) => !p.isProcessed && getExpiryStatus(p.expiryDate) === 'expired')
          .length;
      },

      getTodayExpiringCount: () => {
        return get()
          .products.filter((p) => !p.isProcessed && getExpiryStatus(p.expiryDate) === 'today')
          .length;
      },

      getUrgentCount: (days) => {
        const threshold = days ?? get().settings.reminderDays;
        return get().products.filter((p) => {
          if (p.isProcessed) return false;
          const remaining = getRemainingDays(p.expiryDate);
          return remaining >= 0 && remaining <= threshold;
        }).length;
      },

      getUrgentProducts: (days) => {
        const threshold = days ?? get().settings.reminderDays;
        const active = get().getActiveProducts();
        return active
          .filter((p) => {
            const remaining = getRemainingDays(p.expiryDate);
            return remaining <= threshold;
          })
          .sort((a, b) => {
            const ra = getRemainingDays(a.expiryDate);
            const rb = getRemainingDays(b.expiryDate);
            return ra - rb;
          });
      },

      shouldShowBanner: () => {
        const today = getTodayStr();
        const shownDate = get().reminderBannerDate;
        if (shownDate === today) return false;
        const expiredCount = get().getExpiredCount();
        const todayCount = get().getTodayExpiringCount();
        return expiredCount > 0 || todayCount > 0;
      },

      markBannerShown: () => {
        set({ reminderBannerDate: getTodayStr() });
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      updateShelfLifeDefaults: (items) => {
        set({ shelfLifeDefaults: items });
      },

      addShelfLifeItem: (item) => {
        set((state) => ({
          shelfLifeDefaults: [item, ...state.shelfLifeDefaults],
        }));
      },

      removeShelfLifeItem: (keyword) => {
        set((state) => ({
          shelfLifeDefaults: state.shelfLifeDefaults.filter(
            (item) => item.keyword !== keyword
          ),
        }));
      },

      clearAllData: () => {
        set({
          receipts: [],
          products: [],
          reminderBannerDate: null,
          shoppingLists: [],
        });
      },

      createShoppingList: (name, budgetLimit) => {
        const list: ShoppingList = {
          id: generateUUID(),
          name,
          items: [],
          status: 'active',
          budgetLimit,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          shoppingLists: [list, ...state.shoppingLists],
        }));
        return list;
      },

      updateShoppingList: (listId, updates) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId ? { ...l, ...updates } : l
          ),
        }));
      },

      deleteShoppingList: (listId) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.filter((l) => l.id !== listId),
        }));
      },

      getShoppingListById: (id) => get().shoppingLists.find((l) => l.id === id),

      addShoppingListItem: (listId, itemData) => {
        const item: ShoppingListItem = {
          id: generateUUID(),
          isPurchased: false,
          ...itemData,
        };
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId ? { ...l, items: [...l.items, item] } : l
          ),
        }));
      },

      updateShoppingListItem: (listId, itemId, updates) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((it) =>
                    it.id === itemId ? { ...it, ...updates } : it
                  ),
                }
              : l
          ),
        }));
      },

      removeShoppingListItem: (listId, itemId) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? { ...l, items: l.items.filter((it) => it.id !== itemId) }
              : l
          ),
        }));
      },

      toggleShoppingItemPurchased: (listId, itemId) => {
        set((state) => ({
          shoppingLists: state.shoppingLists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.map((it) =>
                    it.id === itemId
                      ? {
                          ...it,
                          isPurchased: !it.isPurchased,
                          actualPrice: it.isPurchased ? undefined : it.estimatedPrice,
                        }
                      : it
                  ),
                }
              : l
          ),
        }));
      },

      completeShoppingList: (listId, customStoreName) => {
        const state = get();
        const list = state.shoppingLists.find((l) => l.id === listId);
        if (!list) return null;

        const purchasedItems = list.items.filter((it) => it.isPurchased);
        if (purchasedItems.length === 0) return null;

        const tempReceiptId = 'temp';
        const today = getTodayStr();
        const storeName = customStoreName ?? list.targetStoreName ?? list.name ?? '购物';

        const products: Product[] = purchasedItems.map((it) => {
          const matched = matchShelfLife(it.name);
          const price = it.actualPrice ?? it.estimatedPrice;
          return createProductFromRandom(
            {
              name: it.name,
              category: it.category,
              quantity: it.quantity,
              unitPrice: price,
              productionDate: today,
              shelfLifeDays: matched.days,
            } as RandomProductResult,
            tempReceiptId
          );
        });

        const receipt = createReceipt(storeName, today, products);
        products.forEach((p) => (p.receiptId = receipt.id));

        set((s) => ({
          receipts: [receipt, ...s.receipts],
          products: [...products, ...s.products],
          shoppingLists: s.shoppingLists.map((l) =>
            l.id === listId
              ? { ...l, status: 'completed', completedAt: new Date().toISOString() }
              : l
          ),
        }));

        return { receipt, products };
      },

      getPurchaseRecommendations: () => {
        const { products, receipts, settings } = get();
        return generatePurchaseRecommendations(products, receipts, settings.reminderDays);
      },

      getProductConsumption: (productName) => {
        const { products, receipts } = get();
        return getProductConsumptionAnalysis(productName, products, receipts);
      },

      getLowStockList: () => {
        const { products, receipts } = get();
        return getLowStockProducts(products, receipts, 3);
      },

      getMonthlyStats: (monthKey) => {
        const key = monthKey ?? getMonthKey(getTodayStr());
        const { products, receipts } = get();
        return calculateMonthlyStats(key, products, receipts);
      },

      getThisMonthBudgetSpent: () => {
        const { receipts } = get();
        return getThisMonthSpent(receipts);
      },

      getThisMonthBudgetRemaining: () => {
        const { settings } = get();
        const spent = get().getThisMonthBudgetSpent();
        return Math.max(0, settings.monthlyBudget - spent);
      },
    }),
    {
      name: 'receipt-manager-storage',
      partialize: (state) => ({
        receipts: state.receipts,
        products: state.products,
        shelfLifeDefaults: state.shelfLifeDefaults,
        settings: state.settings,
        reminderBannerDate: state.reminderBannerDate,
        shoppingLists: state.shoppingLists,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state && state.receipts.length === 0 && state.products.length === 0) {
            state.initSampleData();
          }
        };
      },
    }
  )
);
