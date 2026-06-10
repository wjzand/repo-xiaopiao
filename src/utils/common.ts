import { Product, ProductCategory, Receipt } from '@/types';
import { SHELF_LIFE_DEFAULTS, STORE_NAMES } from '@/constants/shelfLife';
import { addDays, formatDate, getTodayStr, randomDaysBack } from './date';

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface RandomProductResult {
  name: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
  productionDate: string;
  shelfLifeDays: number;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomProducts(count?: number): RandomProductResult[] {
  const numProducts = count ?? (Math.floor(Math.random() * 6) + 3);
  const shuffled = [...SHELF_LIFE_DEFAULTS].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(numProducts, shuffled.length));

  const units = ['', ' 500g', ' 1kg', ' 1L', ' 250ml', ' 一盒', ' 一包', ' 一袋'];
  const basePrices: Record<ProductCategory, [number, number]> = {
    dairy: [5, 30],
    meat: [15, 60],
    vegetable: [2, 10],
    fruit: [3, 20],
    snack: [3, 25],
    beverage: [2, 15],
    seasoning: [5, 20],
    other: [5, 50],
  };

  return picked.map((item) => {
    const [minP, maxP] = basePrices[item.category];
    const unitPrice = Math.round((minP + Math.random() * (maxP - minP)) * 100) / 100;
    const quantity = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 2 : 1;
    const productionDaysBack = Math.floor(Math.random() * 30) + 1;

    return {
      name: item.keyword + pickRandom(units),
      category: item.category,
      unitPrice,
      quantity,
      productionDate: randomDaysBack(productionDaysBack),
      shelfLifeDays: item.days,
    };
  });
}

export function createProductFromRandom(
  randomItem: RandomProductResult,
  receiptId: string
): Product {
  return {
    id: generateUUID(),
    receiptId,
    name: randomItem.name,
    category: randomItem.category,
    quantity: randomItem.quantity,
    unitPrice: randomItem.unitPrice,
    productionDate: randomItem.productionDate,
    shelfLifeDays: randomItem.shelfLifeDays,
    expiryDate: addDays(randomItem.productionDate, randomItem.shelfLifeDays),
    isProcessed: false,
    createdAt: new Date().toISOString(),
  };
}

export function createReceipt(
  storeName: string,
  purchaseDate: string,
  products: Product[],
  imageBase64?: string
): Receipt {
  const totalAmount = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  return {
    id: generateUUID(),
    storeName,
    purchaseDate,
    totalAmount: Math.round(totalAmount * 100) / 100,
    imageBase64,
    createdAt: new Date().toISOString(),
  };
}

export function generateRandomReceipt(): {
  receipt: Receipt;
  products: Product[];
} {
  const tempReceiptId = generateUUID();
  const randomProducts = generateRandomProducts();
  const products = randomProducts.map((rp) => createProductFromRandom(rp, tempReceiptId));
  const storeName = pickRandom(STORE_NAMES);
  const purchaseDate = randomDaysBack(14);
  const receipt = createReceipt(storeName, purchaseDate, products);
  products.forEach((p) => (p.receiptId = receipt.id));
  return { receipt, products };
}

export function createSampleData(): { receipts: Receipt[]; products: Product[] } {
  const today = getTodayStr();
  const receiptId = generateUUID();

  const sampleProducts: Product[] = [
    {
      id: generateUUID(),
      receiptId,
      name: '鸡蛋 30枚',
      category: 'other',
      quantity: 1,
      unitPrice: 28.9,
      productionDate: formatDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)),
      shelfLifeDays: 30,
      expiryDate: formatDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
      isProcessed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      receiptId,
      name: '牛奶 1L',
      category: 'dairy',
      quantity: 1,
      unitPrice: 15.8,
      productionDate: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      shelfLifeDays: 7,
      expiryDate: today,
      isProcessed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      receiptId,
      name: '酸奶 4连杯',
      category: 'dairy',
      quantity: 1,
      unitPrice: 12.5,
      productionDate: formatDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      shelfLifeDays: 7,
      expiryDate: formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      isProcessed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      receiptId,
      name: '苹果 500g',
      category: 'fruit',
      quantity: 2,
      unitPrice: 6.5,
      productionDate: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      shelfLifeDays: 14,
      expiryDate: formatDate(new Date(Date.now() + 11 * 24 * 60 * 60 * 1000)),
      isProcessed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: generateUUID(),
      receiptId,
      name: '苏打饼干',
      category: 'snack',
      quantity: 1,
      unitPrice: 8.9,
      productionDate: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      shelfLifeDays: 180,
      expiryDate: formatDate(new Date(Date.now() + 179 * 24 * 60 * 60 * 1000)),
      isProcessed: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const receipt: Receipt = {
    id: receiptId,
    storeName: '盒马鲜生',
    purchaseDate: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    totalAmount: 79.1,
    createdAt: new Date().toISOString(),
  };

  return { receipts: [receipt], products: sampleProducts };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressImage(
  base64: string,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = base64;
  });
}
