import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Check,
  Sparkles,
  AlertTriangle,
  FileText,
  Store,
  CheckCircle2,
  Pencil,
  TrendingDown,
} from 'lucide-react';
import { useAppStore } from '@/store';
import ConfirmDialog from '@/components/ConfirmDialog';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import { generatePurchaseRecommendations } from '@/utils/consumption';
import type { PurchaseRecommendation, ProductCategory } from '@/types';

export default function ShoppingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getShoppingListById = useAppStore((s) => s.getShoppingListById);
  const updateShoppingList = useAppStore((s) => s.updateShoppingList);
  const addShoppingListItem = useAppStore((s) => s.addShoppingListItem);
  const updateShoppingListItem = useAppStore((s) => s.updateShoppingListItem);
  const removeShoppingListItem = useAppStore((s) => s.removeShoppingListItem);
  const toggleShoppingItemPurchased = useAppStore((s) => s.toggleShoppingItemPurchased);
  const completeShoppingList = useAppStore((s) => s.completeShoppingList);
  const products = useAppStore((s) => s.products);
  const receipts = useAppStore((s) => s.receipts);
  const budget = useAppStore((s) => s.settings.monthlyBudget);
  const getThisMonthBudgetSpent = useAppStore((s) => s.getThisMonthBudgetSpent);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('other');
  const [newQty, setNewQty] = useState('1');
  const [newPrice, setNewPrice] = useState('');
  const [showRecommend, setShowRecommend] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState('');
  const [editingItem, setEditingItem] = useState<{ id: string; field: 'name' | 'qty' | 'price'; value: string } | null>(null);

  const list = id ? getShoppingListById(id) : undefined;

  useEffect(() => {
    if (list && list.status === 'completed') {
    }
  }, [list]);

  const recommendations = useMemo(() => {
    const all = generatePurchaseRecommendations(products, receipts);
    const existingNames = new Set(list?.items.map((i) => i.name.trim()) || []);
    return all.filter((r) => !existingNames.has(r.name.trim()));
  }, [products, receipts, list]);

  const monthlySpent = getThisMonthBudgetSpent();
  const budgetRemaining = Math.max(0, budget - monthlySpent);

  const estimatedTotal = useMemo(() => {
    if (!list) return 0;
    return list.items.reduce((sum, i) => sum + i.estimatedPrice * i.quantity, 0);
  }, [list]);

  const purchasedTotal = useMemo(() => {
    if (!list) return 0;
    return list.items
      .filter((i) => i.isPurchased)
      .reduce((sum, i) => sum + (i.actualPrice ?? i.estimatedPrice) * i.quantity, 0);
  }, [list]);

  const overBudget = estimatedTotal > budgetRemaining;

  if (!list) {
    return (
      <div className="app-container min-h-screen flex items-center justify-center">
        <p className="text-gray-500">清单不存在</p>
      </div>
    );
  }

  const handleSaveNewItem = () => {
    if (!newName.trim() || !newQty || !newPrice) return;
    const qty = parseInt(newQty);
    const price = parseFloat(newPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;
    addShoppingListItem(list.id, {
      name: newName.trim(),
      category: newCategory,
      quantity: qty,
      estimatedPrice: Math.round(price * 100) / 100,
      isPurchased: false,
    });
    setNewName('');
    setNewCategory('other');
    setNewQty('1');
    setNewPrice('');
    setShowAddForm(false);
  };

  const handleAddRecommendation = (r: PurchaseRecommendation) => {
    addShoppingListItem(list.id, {
      name: r.name,
      category: r.category,
      quantity: r.suggestedQuantity,
      estimatedPrice: r.estimatedPrice,
      isPurchased: false,
      isRecommended: true,
      lastPurchaseDate: r.lastPurchaseDate ?? undefined,
      lastPurchasePrice: r.lastPurchasePrice ?? undefined,
      historyLowPrice: r.historyLowPrice ?? undefined,
      historyAvgPrice: r.historyAvgPrice ?? undefined,
    });
  };

  const handleConfirmComplete = () => {
    const purchasedItems = list.items.filter((i) => i.isPurchased);
    if (purchasedItems.length === 0) return;
    const storeName = storeNameInput.trim() || list.name || '购物';
    const result = completeShoppingList(list.id, storeName);
    if (result) {
      navigate('/receipts');
    }
  };

  const handleCompleteClick = () => {
    const purchasedItems = list.items.filter((i) => i.isPurchased);
    if (purchasedItems.length === 0) {
      alert('请至少勾选一件已购买的商品');
      return;
    }
    setStoreNameInput(list.name || '');
    setShowCompleteDialog(true);
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = list.items.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    updateShoppingListItem(list.id, itemId, { quantity: newQty });
  };

  const handleEditSave = (itemId: string) => {
    if (!editingItem) return;
    const updates: Record<string, any> = {};
    if (editingItem.field === 'name') {
      updates.name = editingItem.value.trim() || '商品';
    } else if (editingItem.field === 'qty') {
      const v = parseInt(editingItem.value);
      updates.quantity = isNaN(v) || v <= 0 ? 1 : v;
    } else if (editingItem.field === 'price') {
      const v = parseFloat(editingItem.value);
      updates.estimatedPrice = isNaN(v) || v <= 0 ? 0 : Math.round(v * 100) / 100;
    }
    updateShoppingListItem(list.id, itemId, updates);
    setEditingItem(null);
  };

  useEffect(() => {
    if (overBudget && !showBudgetWarning && estimatedTotal > 0) {
      const timer = setTimeout(() => setShowBudgetWarning(true), 300);
      return () => clearTimeout(timer);
    }
  }, [overBudget]);

  const purchasedCount = list.items.filter((i) => i.isPurchased).length;
  const isCompleted = list.status === 'completed';

  return (
    <div className="app-container min-h-screen flex flex-col">
      <div className="bg-gradient-to-br from-primary-600 to-primary-500 text-white px-4 pt-11 pb-5">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">{list.name}</h1>
          <button
            onClick={() => !isCompleted && handleCompleteClick()}
            className={`w-9 h-9 -mr-1.5 flex items-center justify-center rounded-full ${
              isCompleted ? 'bg-white/10' : 'bg-white/20 active:bg-white/30'
            }`}
            disabled={isCompleted}
          >
            <CheckCircle2 size={20} className={isCompleted ? 'opacity-50' : ''} />
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs opacity-80">预估总金额</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">¥{estimatedTotal.toFixed(2)}</p>
            {purchasedTotal > 0 && (
              <p className="text-xs opacity-80 mt-1">
                已支付 <span className="font-semibold">¥{purchasedTotal.toFixed(2)}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">{purchasedCount} / {list.items.length} 已采购</p>
          </div>
        </div>
        <div className="mt-4 bg-white/15 rounded-full h-2 overflow-hidden backdrop-blur">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${list.items.length > 0 ? (purchasedCount / list.items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 font-medium">本月预算</span>
            </div>
            <span className={`text-xs font-bold tabular-nums ${overBudget ? 'text-red-600' : 'text-amber-700'}`}>
              剩余 ¥{budgetRemaining.toFixed(0)}
            </span>
          </div>
          <div className="bg-amber-100/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, (monthlySpent / budget) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs text-amber-700">
            <span>已花 ¥{monthlySpent.toFixed(0)}</span>
            <span>上限 ¥{budget.toFixed(0)}</span>
          </div>
        </div>

        {showBudgetWarning && overBudget && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 animate-fade-in-up">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">预算超支提醒</p>
                <p className="text-xs text-red-600 mt-0.5">
                  当前清单预估超出剩余预算 <span className="font-bold">¥{(estimatedTotal - budgetRemaining).toFixed(2)}</span>
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowBudgetWarning(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs text-red-600 font-medium"
                  >
                    继续采购
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-xs text-white font-medium"
                  >
                    调整预算
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mt-4 pb-40">
        {!isCompleted && !showRecommend && recommendations.length > 0 && list.items.length > 0 && (
          <div className="mx-4 mb-4">
            <button
              onClick={() => setShowRecommend(true)}
              className="w-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-violet-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-violet-900">{recommendations.length} 件智能推荐</p>
                <p className="text-xs text-violet-600 mt-0.5">根据消耗速度即将需要购买的商品</p>
              </div>
              <ChevronArrow />
            </button>
          </div>
        )}

        {showRecommend && recommendations.length > 0 && (
          <div className="mx-4 mb-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-violet-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-violet-600" />
                智能推荐（{recommendations.length}）
              </h3>
              <button
                onClick={() => setShowRecommend(false)}
                className="text-xs text-violet-600 font-medium"
              >
                收起
              </button>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 10).map((r) => (
                <div
                  key={r.name}
                  className="bg-white/80 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">{r.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 flex-shrink-0">
                        {CATEGORY_LABELS[r.category]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{r.suggestedQuantity}件</span>
                      <span>¥{r.estimatedPrice.toFixed(2)}</span>
                      {r.daysUntilFinish !== null && (
                        <span className={r.daysUntilFinish <= 0 ? 'text-red-500' : 'text-amber-600'}>
                          {r.daysUntilFinish <= 0 ? '已用完' : `${r.daysUntilFinish}天内用完`}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddRecommendation(r)}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold flex items-center gap-1 active:bg-violet-700"
                  >
                    <Plus size={13} />
                    添加
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mx-4 space-y-2">
          {list.items.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FileText size={32} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 mb-3">清单还是空的</p>
              <div className="flex flex-col items-center gap-2">
                {recommendations.length > 0 && (
                  <button
                    onClick={() => recommendations.slice(0, 5).forEach(handleAddRecommendation)}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold flex items-center gap-2"
                  >
                    <Sparkles size={16} />
                    一键加入推荐
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center gap-2"
                >
                  <Plus size={16} />
                  手动添加商品
                </button>
              </div>
            </div>
          ) : (
            <>
              {list.items.map((item, idx) => {
                const priceHigh =
                  item.historyAvgPrice &&
                  item.estimatedPrice > item.historyAvgPrice * 1.2;
                return (
                  <div
                    key={item.id}
                    className={`group bg-white rounded-2xl p-3.5 shadow-sm border transition-all ${
                      item.isPurchased ? 'border-green-200 bg-green-50/40 opacity-90' : 'border-gray-100'
                    }`}
                    style={{ animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both` }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => !isCompleted && toggleShoppingItemPurchased(list.id, item.id)}
                        disabled={isCompleted}
                        className={`w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          item.isPurchased
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {item.isPurchased && <Check size={14} strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingItem?.id === item.id && editingItem.field === 'name' ? (
                              <div className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  value={editingItem.value}
                                  onChange={(e) =>
                                    setEditingItem({ ...editingItem, value: e.target.value })
                                  }
                                  onBlur={() => handleEditSave(item.id)}
                                  onKeyDown={(e) =>
                                    e.key === 'Enter' && handleEditSave(item.id)
                                  }
                                  className="font-semibold text-sm bg-gray-50 rounded-lg px-2 py-1 border border-primary-300 focus:outline-none w-full"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p
                                  className={`font-semibold text-sm truncate ${
                                    item.isPurchased ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}
                                  onClick={() =>
                                    !isCompleted &&
                                    setEditingItem({ id: item.id, field: 'name', value: item.name })
                                  }
                                >
                                  {item.name}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItem({ id: item.id, field: 'name', value: item.name });
                                  }}
                                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded text-gray-400 flex items-center justify-center active:bg-gray-100 -ml-1"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                            )}
                            {item.isRecommended && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                  智能推荐
                                </span>
                                {priceHigh && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
                                    <TrendingDown size={9} />
                                    价高
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                              {editingItem?.id === item.id && editingItem.field === 'qty' ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    autoFocus
                                    type="number"
                                    min={1}
                                    value={editingItem.value}
                                    onChange={(e) =>
                                      setEditingItem({ ...editingItem, value: e.target.value })
                                    }
                                    onBlur={() => handleEditSave(item.id)}
                                    onKeyDown={(e) =>
                                      e.key === 'Enter' && handleEditSave(item.id)
                                    }
                                    className="w-16 bg-gray-50 rounded-lg px-2 py-0.5 border border-primary-300 focus:outline-none text-xs font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="text-gray-500">件</span>
                                </div>
                              ) : (
                                <span className="text-gray-600 font-medium tabular-nums">
                                  × {item.quantity}件
                                </span>
                              )}
                              {editingItem?.id === item.id && editingItem.field === 'price' ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-500">¥</span>
                                  <input
                                    autoFocus
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={editingItem.value}
                                    onChange={(e) =>
                                      setEditingItem({ ...editingItem, value: e.target.value })
                                    }
                                    onBlur={() => handleEditSave(item.id)}
                                    onKeyDown={(e) =>
                                      e.key === 'Enter' && handleEditSave(item.id)
                                    }
                                    className="w-20 bg-gray-50 rounded-lg px-2 py-0.5 border border-primary-300 focus:outline-none text-xs font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ) : (
                                <span className="text-primary-600 font-bold tabular-nums">
                                  ¥{item.estimatedPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {(item.lastPurchaseDate || item.historyLowPrice) && (
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-gray-400">
                                {item.lastPurchaseDate && (
                                  <span>上次 {item.lastPurchaseDate.slice(5)}</span>
                                )}
                                {item.historyLowPrice != null && (
                                  <span>
                                    历史最低{' '}
                                    <span className="text-green-600 font-medium">
                                      ¥{item.historyLowPrice.toFixed(2)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900 tabular-nums">
                              ¥{(item.quantity * item.estimatedPrice).toFixed(2)}
                            </p>
                            {!isCompleted && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <button
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200"
                                >
                                  <Minus size={13} />
                                </button>
                                <button
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center active:bg-primary-200"
                                >
                                  <Plus size={13} />
                                </button>
                                <button
                                  onClick={() => !isCompleted && removeShoppingListItem(list.id, item.id)}
                                  className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center active:bg-red-100 ml-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {!isCompleted && list.items.length > 0 && (
          <div className="mx-4 mt-5">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 active:border-primary-400 active:text-primary-500 active:bg-primary-50 transition-colors"
            >
              <Plus size={18} />
              继续添加商品
            </button>
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-4 py-3 bg-white/95 backdrop-blur border-t border-gray-100 z-40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500">共 {list.items.length} 件，预估</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">¥{estimatedTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={handleCompleteClick}
              disabled={purchasedCount === 0}
              className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all ${
                purchasedCount === 0
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 active:scale-95'
              }`}
            >
              <CheckCircle2 size={18} />
              完成并生成小票
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in">
          <div
            className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">添加采购商品</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">商品名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：鲜牛奶"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">分类</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                  className="input-field"
                >
                  {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">预估单价（元）</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    className="input-field"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveNewItem}
                disabled={!newName.trim() || !newQty || !newPrice}
                className="w-full btn-primary py-3.5 disabled:opacity-50"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showCompleteDialog}
        title="完成采购并生成小票"
        message="已勾选的商品将生成一条正式小票记录，进入保质期管理和消耗分析。"
        confirmText="确认生成"
        variant="success"
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteDialog(false)}
        customContent={
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
              <Store size={12} />
              商店名称
            </label>
            <input
              type="text"
              value={storeNameInput}
              onChange={(e) => setStoreNameInput(e.target.value)}
              placeholder="如：盒马鲜生"
              className="input-field"
            />
          </div>
        }
      />
    </div>
  );
}

function ChevronArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-violet-400 flex-shrink-0">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
