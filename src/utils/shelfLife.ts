import { ProductCategory, ShelfLifeItem } from '@/types';
import { SHELF_LIFE_DEFAULTS } from '@/constants/shelfLife';

export function matchShelfLife(name: string): { category: ProductCategory; days: number } {
  const trimmedName = name.trim();
  for (const item of SHELF_LIFE_DEFAULTS) {
    if (trimmedName.includes(item.keyword)) {
      return { category: item.category, days: item.days };
    }
  }
  return { category: 'other', days: 30 };
}

export function getShelfLifeDefaults(): ShelfLifeItem[] {
  return [...SHELF_LIFE_DEFAULTS];
}

export function findShelfLifeByKeyword(keyword: string): ShelfLifeItem | undefined {
  return SHELF_LIFE_DEFAULTS.find((item) => item.keyword === keyword);
}
