import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductWithReceipt, Receipt, Settings, ShelfLifeItem } from '@/types';
import { SHELF_LIFE_DEFAULTS } from '@/constants/shelfLife';
import { createSampleData } from '@/utils/common';
import {
  getExpiryStatus,
  getRemainingDays,
  getTodayStr,
} from '@/utils/date';

interface AppState {
  receipts: Receipt[];
  products: Product[];
  shelfLifeDefaults: ShelfLifeItem[];
  settings: Settings;
  reminderBannerDate: string | null;

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
}

const INITIAL_SETTINGS: Settings = {
  reminderDays: 3,
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
        });
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
