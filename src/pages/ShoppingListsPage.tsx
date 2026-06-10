import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store';
import PageHeader from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { ShoppingList } from '@/types';

type TabType = 'active' | 'completed';

export default function ShoppingListsPage() {
  const navigate = useNavigate();
  const shoppingLists = useAppStore((s) => s.shoppingLists);
  const createShoppingList = useAppStore((s) => s.createShoppingList);
  const deleteShoppingList = useAppStore((s) => s.deleteShoppingList);
  const getPurchaseRecommendations = useAppStore((s) => s.getPurchaseRecommendations);

  const [tab, setTab] = useState<TabType>('active');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const recommendations = useMemo(() => getPurchaseRecommendations(), [getPurchaseRecommendations]);

  const filteredLists = useMemo(() => {
    let result = shoppingLists.filter((l) => l.status === tab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.items.some((it) => it.name.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [shoppingLists, tab, search]);

  const handleCreateNew = () => {
    const list = createShoppingList(`采购清单 ${new Date().toLocaleDateString('zh-CN')}`);
    navigate(`/shopping/${list.id}`);
  };

  const handleCreateFromRecommend = () => {
    const list = createShoppingList('智能推荐采购');
    recommendations.forEach((r) => {
      useAppStore.getState().addShoppingListItem(list.id, {
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
    });
    navigate(`/shopping/${list.id}`);
  };

  return (
    <div className="app-container min-h-screen flex flex-col">
      <PageHeader
        title="采购清单"
        variant="primary"
        showBack={true}
        right={
          <button
            onClick={handleCreateNew}
            className="w-9 h-9 -mr-1.5 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {tab === 'active' && recommendations.length > 0 && (
          <div className="mx-4 mt-4">
            <button
              onClick={handleCreateFromRecommend}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 shadow-card text-white flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-sm">智能推荐采购清单</p>
                <p className="text-xs opacity-90 mt-0.5">
                  根据消耗速度，为您推荐 {recommendations.length} 件即将需要购买的商品
                </p>
              </div>
              <ChevronRight size={20} className="flex-shrink-0" />
            </button>
          </div>
        )}

        <div className="mx-4 mt-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索清单或商品"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>
        </div>

        <div className="mx-4 mt-3 flex gap-2">
          <TabButton active={tab === 'active'} onClick={() => setTab('active')}>
            <Clock size={14} />
            进行中 ({shoppingLists.filter((l) => l.status === 'active').length})
          </TabButton>
          <TabButton active={tab === 'completed'} onClick={() => setTab('completed')}>
            <CheckCircle2 size={14} />
            已完成 ({shoppingLists.filter((l) => l.status === 'completed').length})
          </TabButton>
        </div>

        <div className="mx-4 mt-4 space-y-3">
          {filteredLists.length === 0 ? (
            <EmptyState
              type="shopping"
              onAction={tab === 'active' ? handleCreateNew : undefined}
            />
          ) : (
            filteredLists.map((list) => (
              <ShoppingListCard
                key={list.id}
                list={list}
                onClick={() => navigate(`/shopping/${list.id}`)}
                onDelete={() => setDeleteTarget(list.id)}
              />
            ))
          )}
        </div>

        <div className="pb-6" />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除采购清单"
        message="确定要删除此采购清单吗？删除后无法恢复。"
        confirmText="删除"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteShoppingList(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
        active
          ? 'bg-primary-500 text-white shadow-float'
          : 'bg-white text-gray-600 border border-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function ShoppingListCard({
  list,
  onClick,
  onDelete,
}: {
  list: ShoppingList;
  onClick: () => void;
  onDelete: () => void;
}) {
  const totalItems = list.items.length;
  const purchasedCount = list.items.filter((i) => i.isPurchased).length;
  const progress = totalItems > 0 ? (purchasedCount / totalItems) * 100 : 0;
  const estimatedTotal = list.items.reduce((sum, i) => sum + i.estimatedPrice * i.quantity, 0);
  const isCompleted = list.status === 'completed';

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-2xl card-hover ${
          isCompleted ? 'opacity-75' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isCompleted
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600'
            }`}
          >
            <ShoppingCart size={22} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{list.name}</h3>
              <span className="flex-shrink-0 font-bold text-lg text-gray-900 tabular-nums">
                ¥{estimatedTotal.toFixed(0)}
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>
                  已采购 {purchasedCount} / {totalItems} 件
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCompleted
                      ? 'bg-gray-400'
                      : 'bg-gradient-to-r from-primary-500 to-primary-400'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-50 text-gray-400 items-center justify-center hidden group-hover:flex active:bg-red-50 active:text-red-500"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
