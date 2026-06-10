import { useState, useMemo } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '@/store';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import { getRemainingDays } from '@/utils/date';
import { ProductCategory, ProductWithReceipt } from '@/types';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';

type SortOrder = 'asc' | 'desc';

const CATEGORY_KEYS: (ProductCategory | 'all')[] = [
  'all',
  'dairy',
  'meat',
  'vegetable',
  'fruit',
  'snack',
  'beverage',
  'seasoning',
  'other',
];

export default function ProductsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const getActiveProducts = useAppStore((state) => state.getActiveProducts);
  const allProducts = getActiveProducts();

  const filteredProducts = useMemo(() => {
    let result: ProductWithReceipt[] = [...allProducts];

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(keyword));
    }

    result.sort((a, b) => {
      const ra = getRemainingDays(a.expiryDate);
      const rb = getRemainingDays(b.expiryDate);
      return sortOrder === 'asc' ? ra - rb : rb - ra;
    });

    return result;
  }, [allProducts, activeCategory, searchKeyword, sortOrder]);

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const showSearchEmpty = searchKeyword.trim() !== '' && filteredProducts.length === 0;
  const showProductsEmpty = searchKeyword.trim() === '' && allProducts.length === 0;
  const showCategoryEmpty = searchKeyword.trim() === '' && activeCategory !== 'all' && filteredProducts.length === 0 && allProducts.length > 0;

  return (
    <div className="app-container flex flex-col min-h-screen">
      <PageHeader
        title="商品清单"
        right={
          <button
            onClick={handleSortToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowUpDown size={16} />
            <span>到期排序</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品名称"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input-field pl-11"
            />
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORY_KEYS.map((key) => {
              const isActive = activeCategory === key;
              const label = key === 'all' ? '全部' : CATEGORY_LABELS[key];
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-float'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          {allProducts.length === 0 && searchKeyword.trim() === '' ? (
            <EmptyState type="products" />
          ) : showSearchEmpty ? (
            <EmptyState type="search" />
          ) : showCategoryEmpty ? (
            <EmptyState type="search" />
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeName={product.storeName}
                showStore={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
