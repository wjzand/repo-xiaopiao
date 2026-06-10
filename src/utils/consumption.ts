import {
  ConsumptionAnalysis,
  Product,
  PurchaseRecommendation,
  Receipt,
  MonthlyStats,
  ProductCategory,
} from '@/types';
import {
  addDays,
  formatDate,
  getDaysBetween,
  getMonthKey,
  getMonthLabel,
  getThisMonthRange,
  getTodayStr,
  parseDate,
} from './date';
import { CATEGORY_LABELS } from '@/constants/shelfLife';

export function normalizeProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\d+g|\d+kg|\d+ml|\d+l|\d+盒|\d+包|\d+袋|\d+枚|\d+连杯|\d+瓶装|装/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function groupProductsByName(products: Product[], receipts: Receipt[]): Map<string, ConsumptionAnalysis> {
  const map = new Map<string, ConsumptionAnalysis>();

  const sortedProducts = [...products].sort((a, b) => {
    const ra = receipts.find((r) => r.id === a.receiptId)?.purchaseDate ?? '';
    const rb = receipts.find((r) => r.id === b.receiptId)?.purchaseDate ?? '';
    return ra.localeCompare(rb);
  });

  for (const product of sortedProducts) {
    const receipt = receipts.find((r) => r.id === product.receiptId);
    if (!receipt) continue;
    const normalized = normalizeProductName(product.name);
    const shortName = product.name.trim();
    const key = normalized.length >= 2 ? normalized : shortName;

    if (!map.has(key)) {
      map.set(key, {
        productName: shortName,
        normalizedName: key,
        purchaseHistory: [],
        avgConsumptionCycleDays: null,
        avgPurchaseQuantity: 0,
        lastPurchaseDate: null,
        estimatedFinishDate: null,
        isLowStock: false,
        historyLowPrice: null,
        historyAvgPrice: null,
        latestPrice: null,
      });
    }

    const analysis = map.get(key)!;
    analysis.productName = shortName;
    analysis.purchaseHistory.push({
      date: receipt.purchaseDate,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      receiptId: product.receiptId,
    });
  }

  for (const analysis of map.values()) {
    computeConsumptionMetrics(analysis);
  }

  return map;
}

export function computeConsumptionMetrics(analysis: ConsumptionAnalysis): void {
  const { purchaseHistory } = analysis;

  if (purchaseHistory.length === 0) {
    analysis.avgConsumptionCycleDays = null;
    analysis.avgPurchaseQuantity = 0;
    analysis.lastPurchaseDate = null;
    analysis.estimatedFinishDate = null;
    analysis.isLowStock = false;
    analysis.historyLowPrice = null;
    analysis.historyAvgPrice = null;
    analysis.latestPrice = null;
    return;
  }

  const totalQty = purchaseHistory.reduce((sum, h) => sum + h.quantity, 0);
  analysis.avgPurchaseQuantity = Math.round((totalQty / purchaseHistory.length) * 10) / 10;
  analysis.lastPurchaseDate = purchaseHistory[purchaseHistory.length - 1].date;

  const prices = purchaseHistory.map((h) => h.unitPrice).filter((p) => p > 0);
  if (prices.length > 0) {
    analysis.historyLowPrice = Math.min(...prices);
    analysis.historyAvgPrice = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
    analysis.latestPrice = prices[prices.length - 1];
  }

  if (purchaseHistory.length >= 2) {
    const sorted = [...purchaseHistory].sort((a, b) => a.date.localeCompare(b.date));
    const intervals: number[] = [];
    const startIdx = Math.max(0, sorted.length - 4);
    for (let i = startIdx + 1; i < sorted.length; i++) {
      const diff = getDaysBetween(sorted[i - 1].date, sorted[i].date);
      if (diff > 0 && diff <= 180) intervals.push(diff);
    }
    if (intervals.length > 0) {
      analysis.avgConsumptionCycleDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }
  }

  if (analysis.avgConsumptionCycleDays && analysis.lastPurchaseDate) {
    analysis.estimatedFinishDate = addDays(analysis.lastPurchaseDate, analysis.avgConsumptionCycleDays);
    const remaining = getDaysBetween(getTodayStr(), analysis.estimatedFinishDate);
    analysis.isLowStock = remaining <= 3;
  }
}

export function getProductConsumptionAnalysis(
  productName: string,
  products: Product[],
  receipts: Receipt[]
): ConsumptionAnalysis | null {
  const targetNormalized = normalizeProductName(productName);
  const allHistory: ConsumptionAnalysis['purchaseHistory'] = [];

  for (const product of products) {
    const normalized = normalizeProductName(product.name);
    if (normalized !== targetNormalized && !productName.includes(product.name) && !product.name.includes(productName)) continue;
    const receipt = receipts.find((r) => r.id === product.receiptId);
    if (!receipt) continue;
    allHistory.push({
      date: receipt.purchaseDate,
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      receiptId: product.receiptId,
    });
  }

  if (allHistory.length === 0) return null;

  allHistory.sort((a, b) => a.date.localeCompare(b.date));

  const analysis: ConsumptionAnalysis = {
    productName,
    normalizedName: targetNormalized,
    purchaseHistory: allHistory,
    avgConsumptionCycleDays: null,
    avgPurchaseQuantity: 0,
    lastPurchaseDate: null,
    estimatedFinishDate: null,
    isLowStock: false,
    historyLowPrice: null,
    historyAvgPrice: null,
    latestPrice: null,
  };

  computeConsumptionMetrics(analysis);
  return analysis;
}

export function generatePurchaseRecommendations(
  products: Product[],
  receipts: Receipt[],
  reminderDays = 3
): PurchaseRecommendation[] {
  const grouped = groupProductsByName(products, receipts);
  const recommendations: PurchaseRecommendation[] = [];
  const today = getTodayStr();

  for (const analysis of grouped.values()) {
    if (analysis.purchaseHistory.length < 1) continue;

    let reason: PurchaseRecommendation['reason'] | null = null;
    let daysUntilFinish: number | null = null;

    if (analysis.estimatedFinishDate) {
      daysUntilFinish = getDaysBetween(today, analysis.estimatedFinishDate);
      if (daysUntilFinish <= reminderDays) {
        reason = daysUntilFinish <= 0 ? 'low-stock' : 'upcoming';
      }
    } else if (analysis.avgConsumptionCycleDays && analysis.lastPurchaseDate) {
      const daysSinceLast = getDaysBetween(analysis.lastPurchaseDate, today);
      if (daysSinceLast >= analysis.avgConsumptionCycleDays - 2) {
        reason = 'cycle';
      }
    }

    if (!reason && analysis.purchaseHistory.length === 1) continue;

    if (!reason) continue;

    recommendations.push({
      name: analysis.productName,
      category: guessCategoryByName(analysis.productName),
      suggestedQuantity: Math.max(1, Math.round(analysis.avgPurchaseQuantity)),
      estimatedPrice: analysis.historyAvgPrice ?? analysis.latestPrice ?? 0,
      lastPurchaseDate: analysis.lastPurchaseDate,
      lastPurchasePrice: analysis.latestPrice,
      historyLowPrice: analysis.historyLowPrice,
      historyAvgPrice: analysis.historyAvgPrice,
      estimatedFinishDate: analysis.estimatedFinishDate,
      daysUntilFinish,
      reason,
    });
  }

  recommendations.sort((a, b) => {
    const scoreA = a.daysUntilFinish ?? 999;
    const scoreB = b.daysUntilFinish ?? 999;
    return scoreA - scoreB;
  });

  return recommendations;
}

function guessCategoryByName(name: string): ProductCategory {
  const keywords: Record<ProductCategory, string[]> = {
    dairy: ['奶', '乳', '奶酪', '酸奶', '黄油', '奶油'],
    meat: ['肉', '猪', '牛', '鸡', '鱼', '虾', '培根', '火腿', '香肠'],
    vegetable: ['菜', '生菜', '白菜', '番茄', '西红柿', '黄瓜', '胡萝卜', '土豆', '青椒', '菠菜', '芹菜', '茄子', '玉米', '洋葱', '韭菜'],
    fruit: ['果', '苹果', '香蕉', '橙', '橘', '葡萄', '草莓', '西瓜', '梨', '芒', '菠萝', '猕猴桃', '桃', '樱桃'],
    snack: ['饼', '薯片', '巧克力', '面包', '蛋糕', '方便面', '辣条', '坚果', '瓜子', '糖', '火腿肠'],
    beverage: ['水', '可乐', '雪碧', '果汁', '啤酒', '酒', '奶茶', '咖啡', '豆浆'],
    seasoning: ['油', '盐', '酱', '醋', '糖', '料酒', '蚝油', '味精', '鸡精', '胡椒', '辣椒', '调味'],
    other: [],
  };
  for (const [cat, words] of Object.entries(keywords) as [ProductCategory, string[]][]) {
    for (const w of words) {
      if (name.includes(w)) return cat;
    }
  }
  return 'other';
}

export function getProductPriceHistory(
  productName: string,
  products: Product[],
  receipts: Receipt[]
): { date: string; price: number; quantity: number }[] {
  const result: { date: string; price: number; quantity: number }[] = [];
  const normalized = normalizeProductName(productName);

  for (const p of products) {
    if (normalizeProductName(p.name) !== normalized) continue;
    const receipt = receipts.find((r) => r.id === p.receiptId);
    if (!receipt) continue;
    result.push({
      date: receipt.purchaseDate,
      price: p.unitPrice,
      quantity: p.quantity,
    });
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

export function calculateMonthlyStats(
  monthKey: string,
  products: Product[],
  receipts: Receipt[]
): MonthlyStats {
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = formatDate(new Date(year, month - 1, 1));
  const endDate = formatDate(new Date(year, month, 0));

  const monthReceipts = receipts.filter(
    (r) => r.purchaseDate >= startDate && r.purchaseDate <= endDate
  );
  const receiptIds = new Set(monthReceipts.map((r) => r.id));
  const monthProducts = products.filter((p) => receiptIds.has(p.receiptId));

  const totalAmount = monthReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const uniqueNames = new Set(monthProducts.map((p) => normalizeProductName(p.name)));

  const categoryBreakdown = {} as Record<ProductCategory, { count: number; amount: number }>;
  const catKeys: ProductCategory[] = ['dairy', 'meat', 'vegetable', 'fruit', 'snack', 'beverage', 'seasoning', 'other'];
  for (const k of catKeys) {
    categoryBreakdown[k] = { count: 0, amount: 0 };
  }

  const productAggregate = new Map<string, { name: string; quantity: number; amount: number }>();

  for (const p of monthProducts) {
    const cat = p.category;
    categoryBreakdown[cat].count += p.quantity;
    categoryBreakdown[cat].amount += p.unitPrice * p.quantity;

    const key = normalizeProductName(p.name);
    if (!productAggregate.has(key)) {
      productAggregate.set(key, { name: p.name, quantity: 0, amount: 0 });
    }
    const agg = productAggregate.get(key)!;
    agg.quantity += p.quantity;
    agg.amount += p.unitPrice * p.quantity;
  }

  const topProducts = [...productAggregate.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const processedCount = monthProducts.filter((p) => p.isProcessed).length;
  const today = getTodayStr();
  const expiredCount = monthProducts.filter((p) => !p.isProcessed && p.expiryDate < today).length;

  const dailyMap = new Map<string, number>();
  for (const r of monthReceipts) {
    const prev = dailyMap.get(r.purchaseDate) ?? 0;
    dailyMap.set(r.purchaseDate, prev + r.totalAmount);
  }
  const dailyTrend: { date: string; amount: number }[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailyTrend.push({ date: dateStr, amount: dailyMap.get(dateStr) ?? 0 });
  }

  const totalProducts = monthProducts.length;
  const processingRate = totalProducts > 0 ? Math.round((processedCount / totalProducts) * 100) : 0;

  return {
    monthKey,
    label: getMonthLabel(startDate),
    totalAmount: Math.round(totalAmount * 100) / 100,
    receiptCount: monthReceipts.length,
    uniqueProducts: uniqueNames.size,
    processedCount,
    expiredCount,
    processingRate,
    categoryBreakdown,
    topProducts,
    dailyTrend,
  };
}

export function getThisMonthSpent(receipts: Receipt[]): number {
  const { start, end } = getThisMonthRange();
  return receipts
    .filter((r) => r.purchaseDate >= start && r.purchaseDate <= end)
    .reduce((sum, r) => sum + r.totalAmount, 0);
}

export function getLowStockProducts(
  products: Product[],
  receipts: Receipt[],
  thresholdDays = 3
): ConsumptionAnalysis[] {
  const grouped = groupProductsByName(products, receipts);
  const result: ConsumptionAnalysis[] = [];
  const today = getTodayStr();

  for (const analysis of grouped.values()) {
    if (!analysis.estimatedFinishDate) continue;
    const remaining = getDaysBetween(today, analysis.estimatedFinishDate);
    if (remaining <= thresholdDays) {
      result.push(analysis);
    }
  }

  result.sort((a, b) => {
    const ra = a.estimatedFinishDate ? getDaysBetween(today, a.estimatedFinishDate) : 999;
    const rb = b.estimatedFinishDate ? getDaysBetween(today, b.estimatedFinishDate) : 999;
    return ra - rb;
  });

  return result;
}

export { CATEGORY_LABELS };
