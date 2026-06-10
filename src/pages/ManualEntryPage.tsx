import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Trash2,
  Plus,
  Minus,
  Package,
  Calendar,
  Save,
  X,
  Camera as CameraIcon,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAppStore } from '@/store';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import {
  createReceipt,
  createProductFromRandom,
  fileToBase64,
  RandomProductResult,
} from '@/utils/common';
import { matchShelfLife } from '@/utils/shelfLife';
import { getTodayStr, formatCNDate, addDays } from '@/utils/date';
import type { ProductCategory } from '@/types';

interface EditItem {
  name: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  productionDate: string;
  shelfLifeDays: number;
  expiryDate: string;
}

function createEmptyItem(): EditItem {
  return {
    name: '',
    category: 'other',
    quantity: 1,
    unitPrice: 0,
    productionDate: getTodayStr(),
    shelfLifeDays: 30,
    expiryDate: addDays(getTodayStr(), 30),
  };
}

export default function ManualEntryPage() {
  const navigate = useNavigate();
  const addReceipt = useAppStore((state) => state.addReceipt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState<string>('便利店');
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayStr());
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [items, setItems] = useState<EditItem[]>([createEmptyItem()]);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setReceiptImage(base64);
    } catch {
      // ignore
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const removeImage = useCallback(() => {
    setReceiptImage(null);
  }, []);

  const updateItem = useCallback((index: number, patch: Partial<EditItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      if (patch.name !== undefined) {
        const matched = matchShelfLife(patch.name);
        next[index].category = matched.category;
        next[index].shelfLifeDays = matched.days;
        next[index].expiryDate = addDays(next[index].productionDate, matched.days);
      }
      if (patch.productionDate !== undefined || patch.shelfLifeDays !== undefined) {
        next[index].expiryDate = addDays(
          next[index].productionDate,
          next[index].shelfLifeDays
        );
      }
      return next;
    });
  }, []);

  const updateItemName = useCallback((index: number, name: string) => {
    updateItem(index, { name });
  }, [updateItem]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    if (!storeName.trim()) {
      alert('请填写商店名称');
      return;
    }
    const validItems = items.filter((it) => it.name.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      alert('请至少添加一件商品');
      return;
    }
    const tempReceiptId = 'temp';
    const products = validItems.map((it) =>
      createProductFromRandom(
        {
          name: it.name,
          category: it.category,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          productionDate: it.productionDate,
          shelfLifeDays: it.shelfLifeDays,
        } as RandomProductResult,
        tempReceiptId
      )
    );
    const receipt = createReceipt(
      storeName.trim(),
      purchaseDate,
      products,
      receiptImage || undefined
    );
    products.forEach((p) => (p.receiptId = receipt.id));
    addReceipt(receipt, products);
    navigate(`/receipts/${receipt.id}`);
  }, [items, storeName, purchaseDate, receiptImage, addReceipt, navigate]);

  const totalAmount = items.reduce(
    (sum, it) => sum + (it.quantity * it.unitPrice || 0),
    0
  );

  return (
    <div className="app-container min-h-screen flex flex-col">
      <PageHeader showBack title="手动录入" />
      <div className="flex-1 overflow-y-auto pb-40">
        <div className="px-4 pt-3">
          <div className="card p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                商店名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="input-field"
                placeholder="请输入商店名称"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                购物日期
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                小票图片（可选）
              </label>
              {receiptImage ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-100">
                  <img
                    src={receiptImage}
                    alt="小票预览"
                    className="w-full object-contain max-h-64 bg-gray-50"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-500 active:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                    <CameraIcon size={22} className="text-primary-500" />
                  </div>
                  <div className="text-sm font-medium">点击上传小票图片</div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <ImageIcon size={12} />
                    <span>支持 JPG / PNG 格式</span>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between mb-3 pl-1">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-primary-500" />
              商品列表
            </h3>
            <span className="text-xs text-gray-500">共 {items.length} 件</span>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="card p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItemName(index, e.target.value)}
                      className="w-full bg-transparent font-semibold text-gray-900 focus:outline-none focus:bg-gray-50 rounded-lg px-2 py-1 -mx-2 placeholder-gray-400"
                      placeholder="请输入商品名称"
                    />
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="chip bg-gray-100 text-gray-600">
                        {CATEGORY_LABELS[item.category] || '其他'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>生产日期 {formatCNDate(item.productionDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-gray-500">
                        保质期 {item.shelfLifeDays} 天
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-primary-600 font-medium">
                        到期 {formatCNDate(item.expiryDate)}
                      </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 mt-3 items-center">
                      <div className="col-span-5 flex items-center bg-gray-50 rounded-xl p-1">
                        <button
                          onClick={() =>
                            updateItem(index, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, {
                              quantity: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            })
                          }
                          className="flex-1 bg-transparent text-center text-sm font-semibold text-gray-900 focus:outline-none w-10"
                        />
                        <button
                          onClick={() =>
                            updateItem(index, { quantity: item.quantity + 1 })
                          }
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                      <div className="col-span-6">
                        <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1.5">
                          <span className="text-sm text-gray-500 mr-1">¥</span>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.unitPrice || ''}
                            onChange={(e) =>
                              updateItem(index, {
                                unitPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none placeholder-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            items.length <= 1
                              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              : 'bg-red-50 text-red-500 active:bg-red-100'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 pl-1">
                          生产日期
                        </label>
                        <input
                          type="date"
                          value={item.productionDate}
                          onChange={(e) =>
                            updateItem(index, { productionDate: e.target.value })
                          }
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1 pl-1">
                          保质期 (天)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.shelfLifeDays}
                          onChange={(e) =>
                            updateItem(index, {
                              shelfLifeDays: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            })
                          }
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-primary-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="w-full mt-4 py-3.5 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-500 font-medium active:bg-gray-50 transition-colors"
          >
            <Plus size={18} />
            <span>添加商品</span>
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 pt-3 pb-4 z-40">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm text-gray-500">合计</span>
          <span className="text-2xl font-bold text-gray-900">
            ¥{totalAmount.toFixed(2)}
          </span>
        </div>
        <button
          onClick={handleSave}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
        >
          <Save size={18} />
          <span>保存小票</span>
        </button>
      </div>
    </div>
  );
}
