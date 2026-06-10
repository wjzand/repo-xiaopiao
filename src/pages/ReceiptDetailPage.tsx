import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MapPin, Calendar, Hash, ShoppingBag, Receipt as ReceiptIcon, Check } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCNDate } from '@/utils/date';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

export default function ReceiptDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getReceiptById = useAppStore((state) => state.getReceiptById);
  const getProductsByReceiptId = useAppStore((state) => state.getProductsByReceiptId);
  const updateProduct = useAppStore((state) => state.updateProduct);

  const receipt = getReceiptById(id);
  const products = getProductsByReceiptId(id);

  if (!receipt) {
    return (
      <div className="app-container min-h-screen flex flex-col">
        <PageHeader title="小票详情" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ReceiptIcon size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">小票不存在</p>
            <button
              onClick={() => navigate('/receipts')}
              className="mt-4 btn-primary"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMarkProcessed = (productId: string) => {
    updateProduct(productId, { isProcessed: true });
  };

  return (
    <div className="app-container min-h-screen flex flex-col">
      <PageHeader title="小票详情" showBack />

      <div className="flex-1 overflow-y-auto pb-24">
        {receipt.imageBase64 && (
          <div className="px-4 pt-4">
            <div className="rounded-2xl overflow-hidden shadow-card bg-white p-3">
              <img
                src={receipt.imageBase64}
                alt="小票图片"
                className="w-full rounded-xl object-contain max-h-80"
              />
            </div>
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white shadow-card p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ReceiptIcon size={18} className="text-primary-500" />
              小票信息
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">商店名称</p>
                  <p className="font-semibold text-gray-900 truncate">{receipt.storeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">购物日期</p>
                  <p className="font-semibold text-gray-900">{formatCNDate(receipt.purchaseDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Hash size={18} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">商品件数</p>
                  <p className="font-semibold text-gray-900">{products.length} 件</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={18} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">总金额</p>
                  <p className="font-bold text-xl text-gray-900">¥{receipt.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-3 pl-1">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary-500" />
              商品列表
            </h3>
            <span className="text-xs text-gray-500">共 {products.length} 件</span>
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onMarkProcessed={() => handleMarkProcessed(product.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductListItemProps {
  product: Product;
  onMarkProcessed: () => void;
}

function ProductListItem({ product, onMarkProcessed }: ProductListItemProps) {
  const [hover, setHover] = useState(false);

  if (product.isProcessed) {
    return (
      <div className="rounded-2xl bg-gray-50 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gray-200 flex items-center justify-center">
            <Check size={22} className="text-gray-500" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-600 truncate line-through">{product.name}</h3>
              <span className="chip flex-shrink-0 bg-gray-200 text-gray-600">已处理</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              数量 x{product.quantity} · ¥{product.unitPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ProductCard product={product} />
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMarkProcessed();
        }}
        className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all z-10 ${
          hover ? 'opacity-100' : 'opacity-90'
        }`}
      >
        <Check size={20} strokeWidth={3} />
      </button>
    </div>
  );
}
