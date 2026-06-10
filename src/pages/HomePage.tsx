import { useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  Settings,
  X,
  ShoppingCart,
  ChartBarStacked,
  Sparkles,
  Coins,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { fileToBase64 } from '@/utils/common';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';

export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shouldShowBanner = useAppStore((s) => s.shouldShowBanner);
  const markBannerShown = useAppStore((s) => s.markBannerShown);
  const getExpiredCount = useAppStore((s) => s.getExpiredCount);
  const getTodayExpiringCount = useAppStore((s) => s.getTodayExpiringCount);
  const getUrgentCount = useAppStore((s) => s.getUrgentCount);
  const getUrgentProducts = useAppStore((s) => s.getUrgentProducts);
  const settings = useAppStore((s) => s.settings);
  const getThisMonthBudgetSpent = useAppStore((s) => s.getThisMonthBudgetSpent);
  const getLowStockList = useAppStore((s) => s.getLowStockList);
  const shoppingLists = useAppStore((s) => s.shoppingLists);
  const showBanner = shouldShowBanner();

  const expiredCount = getExpiredCount();
  const todayCount = getTodayExpiringCount();
  const urgentCount = getUrgentCount(3);
  const urgentProducts = getUrgentProducts(30).slice(0, 20);

  const monthlySpent = getThisMonthBudgetSpent();
  const budget = settings.monthlyBudget;
  const budgetPercent = budget > 0 ? Math.min(100, (monthlySpent / budget) * 100) : 0;
  const budgetRemaining = Math.max(0, budget - monthlySpent);
  const budgetOver = monthlySpent > budget;

  const lowStockList = useMemo(() => getLowStockList().slice(0, 3), [getLowStockList]);
  const activeShoppingLists = useMemo(
    () => shoppingLists.filter((l) => l.status === 'active'),
    [shoppingLists]
  );

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      sessionStorage.setItem('scanImage', base64);
      navigate('/scan');
    } catch (error) {
      console.error('Failed to convert file to base64:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const settingsRight = (
    <Link to="/settings" className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/20">
      <Settings size={22} strokeWidth={2} />
    </Link>
  );

  const handleCreateListFromLowStock = () => {
    navigate('/shopping-lists');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-bottom">
      <PageHeader title="小票管家" variant="primary" right={settingsRight} />

      <div className="mx-4 mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 shadow-sm border border-amber-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Coins size={15} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700">本月采购预算</p>
            </div>
          </div>
          <Link
            to="/settings"
            className="text-xs text-amber-600 font-medium active:opacity-70"
          >
            设置
          </Link>
        </div>
        <div className="bg-amber-100/60 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              budgetOver
                ? 'bg-gradient-to-r from-red-400 to-red-500'
                : budgetPercent >= 80
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-emerald-400 to-green-500'
            }`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-xs text-amber-700">
              已花 <span className={`font-bold tabular-nums ${budgetOver ? 'text-red-600' : 'text-amber-900'}`}>¥{monthlySpent.toFixed(0)}</span>
            </span>
            <span className="text-xs text-amber-600 mx-1">/</span>
            <span className="text-xs text-amber-600">¥{budget.toFixed(0)}</span>
          </div>
          <span className={`text-xs font-bold tabular-nums ${budgetOver ? 'text-red-600' : 'text-emerald-600'}`}>
            {budgetOver ? `超支 ¥${(monthlySpent - budget).toFixed(0)}` : `剩 ¥${budgetRemaining.toFixed(0)}`}
          </span>
        </div>
      </div>

      {showBanner && (
        <div className="sticky top-0 z-20 mx-4 mt-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0 text-white">
              <p className="font-semibold text-sm">保质期提醒</p>
              <p className="text-xs mt-0.5 opacity-90">
                已过期 <span className="font-bold">{expiredCount}</span> 件，今日到期{' '}
                <span className="font-bold">{todayCount}</span> 件
              </p>
            </div>
            <button
              onClick={markBannerShown}
              className="flex-shrink-0 w-8 h-8 -mr-1 -mt-1 flex items-center justify-center rounded-full active:bg-white/20"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="sticky z-10 mx-4 mt-4">
        <button
          onClick={handleScanClick}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-400 text-white font-semibold rounded-2xl py-4 shadow-float active:scale-[0.98] transition-transform"
        >
          <Camera size={22} strokeWidth={2.2} />
          <span className="text-base">拍小票存档</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/shopping-lists')}
          className="bg-white rounded-2xl p-4 shadow-card text-left flex flex-col gap-2 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">采购清单</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeShoppingLists.length > 0
                ? `${activeShoppingLists.length} 个清单进行中`
                : '智能生成采购计划'}
            </p>
          </div>
        </button>
        <button
          onClick={() => navigate('/stats')}
          className="bg-white rounded-2xl p-4 shadow-card text-left flex flex-col gap-2 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
            <ChartBarStacked size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">消耗统计</p>
            <p className="text-xs text-gray-500 mt-0.5">家庭消费数据分析</p>
          </div>
        </button>
      </div>

      {lowStockList.length > 0 && (
        <div className="mx-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" />
              即将需要补货
            </h2>
            <button
              onClick={handleCreateListFromLowStock}
              className="text-xs text-primary-600 font-medium"
            >
              加入采购清单 →
            </button>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-3 border border-amber-100">
            {lowStockList.map((item, i) => (
              <div
                key={item.normalizedName}
                className={`flex items-center justify-between py-2.5 ${
                  i !== lowStockList.length - 1 ? 'border-b border-amber-100/70' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-white text-amber-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {item.estimatedFinishDate && (
                        <>预计 {item.estimatedFinishDate.slice(5)} 用完</>
                      )}
                      {!item.estimatedFinishDate && item.lastPurchaseDate && (
                        <>距上次购买 {Math.round((Date.now() - new Date(item.lastPurchaseDate).getTime()) / 86400000)} 天</>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-100/60 px-2 py-1 rounded-lg">
                  {item.isLowStock ? '需补货' : '快用完'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 p-4 text-white shadow-card">
          <p className="text-xs opacity-90">已过期</p>
          <p className="mt-1 text-3xl font-bold leading-none">{expiredCount}</p>
          <p className="mt-2 text-[10px] opacity-75">需要处理</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-4 text-white shadow-card">
          <p className="text-xs opacity-90">今日到期</p>
          <p className="mt-1 text-3xl font-bold leading-none">{todayCount}</p>
          <p className="mt-2 text-[10px] opacity-75">尽快食用</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-lime-400 p-4 text-white shadow-card">
          <p className="text-xs opacity-90">3天内到期</p>
          <p className="mt-1 text-3xl font-bold leading-none">{urgentCount}</p>
          <p className="mt-2 text-[10px] opacity-75">留意查看</p>
        </div>
      </div>

      <div className="mx-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">即将到期</h2>
          <span className="text-xs text-gray-400">
            共 {urgentProducts.length} 件
          </span>
        </div>

        {urgentProducts.length === 0 ? (
          <EmptyState type="home" onAction={handleScanClick} />
        ) : (
          <div className="space-y-3">
            {urgentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeName={product.storeName}
                showStore
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
