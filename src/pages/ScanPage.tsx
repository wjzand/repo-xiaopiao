import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera as CameraIcon,
  Image,
  Trash2,
  Plus,
  Minus,
  Package,
  Calendar,
  Save,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAppStore } from '@/store';
import { STORE_NAMES, CATEGORY_LABELS } from '@/constants/shelfLife';
import {
  generateRandomProducts,
  createReceipt,
  createProductFromRandom,
  fileToBase64,
  compressImage,
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

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ScanPage() {
  const navigate = useNavigate();
  const addReceipt = useAppStore((state) => state.addReceipt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<number>(() => {
    return sessionStorage.getItem('scanImage') ? 1 : 0;
  });
  const [scanImage, setScanImage] = useState<string | null>(
    () => sessionStorage.getItem('scanImage')
  );
  const [storeName, setStoreName] = useState<string>(randomFrom(STORE_NAMES));
  const [purchaseDate, setPurchaseDate] = useState<string>(getTodayStr());
  const [items, setItems] = useState<EditItem[]>([]);
  const [progressKey, setProgressKey] = useState<number>(0);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => {
        const randomItems = generateRandomProducts();
        const editItems: EditItem[] = randomItems.map((r: RandomProductResult) => ({
          name: r.name,
          category: r.category,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
          productionDate: r.productionDate,
          shelfLifeDays: r.shelfLifeDays,
          expiryDate: addDays(r.productionDate, r.shelfLifeDays),
        }));
        sessionStorage.setItem('scanProducts', JSON.stringify(randomItems));
        setItems(editItems);
        setStep(2);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, progressKey]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64, 600, 0.6);
      sessionStorage.setItem('scanImage', compressed);
      setScanImage(compressed);
      setProgressKey((k) => k + 1);
      setStep(1);
    } catch {
      // ignore
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        },
        tempReceiptId
      )
    );
    const receipt = createReceipt(
      storeName.trim() || '未命名商店',
      purchaseDate,
      products,
      scanImage || undefined
    );
    products.forEach((p) => (p.receiptId = receipt.id));
    addReceipt(receipt, products);
    sessionStorage.removeItem('scanImage');
    sessionStorage.removeItem('scanProducts');
    navigate(`/receipts/${receipt.id}`);
  }, [items, storeName, purchaseDate, scanImage, addReceipt, navigate]);

  const totalAmount = items.reduce(
    (sum, it) => sum + (it.quantity * it.unitPrice || 0),
    0
  );

  if (step === 0) {
    return (
      <div className="app-container min-h-screen flex flex-col">
        <PageHeader showBack title="拍小票" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-8 shadow-float">
            <CameraIcon size={72} className="text-primary-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">拍下你的购物小票</h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-10 max-w-xs">
            我们将自动识别商品名称、数量和价格，并匹配保质期信息
          </p>
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4"
            >
              <CameraIcon size={20} />
              <span className="text-base">拍小票 / 选图片</span>
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
              <Image size={14} />
              <span>支持拍照或从相册选择</span>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="app-container min-h-screen flex flex-col bg-gray-900">
        <PageHeader showBack title="正在识别" variant="primary" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl mb-8">
            {scanImage && (
              <img
                src={scanImage}
                alt="小票"
                className="w-full object-contain bg-white"
              />
            )}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
            <div
              key={progressKey}
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-scan-line"
              style={{ boxShadow: '0 0 20px rgba(52, 211, 153, 0.8)' }}
            />
          </div>
          <div className="text-white text-center mb-6">
            <p className="text-lg font-semibold mb-2 animate-pulse-soft">正在识别商品...</p>
            <p className="text-sm text-gray-300">请稍候，AI 正在处理您的小票</p>
          </div>
          <div className="w-full max-w-sm h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              key={progressKey}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-full animate-progress"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container min-h-screen flex flex-col">
      <PageHeader showBack title="识别结果" />
      <div className="flex-1 overflow-y-auto pb-40">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 pl-1">
            <Package size={14} className="text-primary-500" />
            <span>可点击修改或删除商品</span>
          </div>
        </div>

        <div className="px-4 pt-3">
          <div className="card p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                商店名称
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="input-field"
                placeholder="请输入商店名称"
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
                                unitPrice:
                                  parseFloat(e.target.value) || 0,
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
                          className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 active:bg-red-100 transition-colors"
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
