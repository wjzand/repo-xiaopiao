import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ShoppingBag,
  Package,
  TrendingUp,
  AlertCircle,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Coins,
  Percent,
} from 'lucide-react';
import { useAppStore } from '@/store';
import BarChart from '@/components/BarChart';
import LineChart from '@/components/LineChart';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import {
  addMonths,
  formatDate,
  getMonthLabel,
  getMonthKey,
  getTodayStr,
  parseDate,
} from '@/utils/date';
import type { MonthlyStats, ProductCategory } from '@/types';

export default function StatsPage() {
  const navigate = useNavigate();
  const getMonthlyStats = useAppStore((s) => s.getMonthlyStats);
  const settings = useAppStore((s) => s.settings);

  const [currentMonth, setCurrentMonth] = useState<string>(getMonthKey(getTodayStr()));

  const stats: MonthlyStats = getMonthlyStats(currentMonth);
  const budget = settings.monthlyBudget;
  const budgetUsedPercent = budget > 0 ? Math.min(100, (stats.totalAmount / budget) * 100) : 0;

  const topProductsChart = useMemo(() => {
    const colors = ['#10B981', '#34D399', '#6EE7B7', '#FCD34D', '#FBBF24'];
    return {
      labels: stats.topProducts.map((p) => p.name.length > 6 ? p.name.slice(0, 6) : p.name),
      values: stats.topProducts.map((p) => p.quantity),
      colors,
    };
  }, [stats]);

  const dailyTrendChart = useMemo(() => {
    const trend = stats.dailyTrend.filter((d) => d.amount > 0);
    const daysWithAmount = trend.length > 0 ? trend : stats.dailyTrend.slice(-7);
    return {
      labels: daysWithAmount.map((d) => d.date.slice(5)),
      values: daysWithAmount.map((d) => Math.round(d.amount)),
    };
  }, [stats]);

  const categoryChartData = useMemo(() => {
    const catKeys = (Object.keys(CATEGORY_LABELS) as ProductCategory[]).filter(
      (k) => stats.categoryBreakdown[k].count > 0
    );
    return {
      labels: catKeys.map((k) => CATEGORY_LABELS[k]),
      values: catKeys.map((k) => Math.round(stats.categoryBreakdown[k].amount)),
      colors: [
        '#84CC16',
        '#22C55E',
        '#10B981',
        '#06B6D4',
        '#F59E0B',
        '#F97316',
        '#8B5CF6',
        '#94A3B8',
      ],
    };
  }, [stats]);

  const prevMonth = () => {
    const dateStr = `${currentMonth}-01`;
    setCurrentMonth(getMonthKey(addMonths(dateStr, -1)));
  };

  const nextMonth = () => {
    const dateStr = `${currentMonth}-01`;
    setCurrentMonth(getMonthKey(addMonths(dateStr, 1)));
  };

  return (
    <div className="app-container min-h-screen flex flex-col">
      <div className="bg-gradient-to-br from-sky-600 to-cyan-500 text-white px-4 pt-11 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">消耗统计</h1>
          <div className="w-9" />
        </div>

        <div className="flex items-center justify-center gap-3 mb-5">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 py-1.5 rounded-full bg-white/20 text-sm font-semibold">
            <Calendar size={14} className="inline mr-1 -mt-0.5" />
            {stats.label}
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Coins} label="总花费" value={`¥${stats.totalAmount.toFixed(0)}`} accent="from-amber-400 to-orange-400" />
          <StatCard icon={ShoppingBag} label="购物次数" value={String(stats.receiptCount)} accent="from-emerald-400 to-teal-400" />
          <StatCard icon={Package} label="商品种类" value={String(stats.uniqueProducts)} accent="from-sky-400 to-blue-400" />
          <StatCard icon={Percent} label="临期处理率" value={`${stats.processingRate}%`} accent="from-violet-400 to-purple-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 mt-4 space-y-5">
        <div className="mx-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Coins size={16} className="text-amber-500" />
                本月预算进度
              </h3>
              <span className="text-xs text-gray-500">
                上限 ¥{budget.toFixed(0)}
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetUsedPercent >= 100
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : budgetUsedPercent >= 80
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                    : 'bg-gradient-to-r from-green-400 to-emerald-500'
                }`}
                style={{ width: `${budgetUsedPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                已花 <span className="font-bold text-gray-800">¥{stats.totalAmount.toFixed(0)}</span>
              </span>
              <span className={budgetUsedPercent >= 100 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                {budgetUsedPercent >= 100
                  ? `超支 ¥${(stats.totalAmount - budget).toFixed(0)}`
                  : `剩余 ¥${Math.max(0, budget - stats.totalAmount).toFixed(0)}`}
              </span>
            </div>
          </div>
        </div>

        {(stats.expiredCount > 0 || stats.processedCount > 0) && (
          <div className="mx-4">
            <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-4 border border-rose-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-3">
                <AlertCircle size={16} className="text-rose-500" />
                保质期处理情况
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-gray-500">已处理</p>
                  <p className="text-2xl font-bold text-green-600 mt-1 tabular-nums">
                    {stats.processedCount}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3">
                  <p className="text-xs text-gray-500">过期未处理</p>
                  <p className="text-2xl font-bold text-red-500 mt-1 tabular-nums">
                    {stats.expiredCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mx-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4">
              <TrendingUp size={16} className="text-cyan-500" />
              本月日消费趋势
            </h3>
            {dailyTrendChart.values.some((v) => v > 0) ? (
              <LineChart data={dailyTrendChart} yUnit="元" height={170} />
            ) : (
              <div className="py-12 text-center text-sm text-gray-400">本月暂无消费数据</div>
            )}
          </div>
        </div>

        {stats.topProducts.length > 0 && (
          <div className="mx-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4">
                <Package size={16} className="text-emerald-500" />
                本月消耗 TOP 5
              </h3>
              <BarChart data={topProductsChart} horizontal yUnit="件" height={220} />
              <div className="mt-4 divide-y divide-gray-50 border-t border-gray-50">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center py-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 flex-shrink-0 ${
                        i === 0
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : i === 1
                          ? 'bg-gradient-to-br from-slate-300 to-slate-400'
                          : i === 2
                          ? 'bg-gradient-to-br from-orange-300 to-amber-400'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">
                        {p.quantity} 件
                      </p>
                      <p className="text-xs text-gray-500 tabular-nums">¥{p.amount.toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {categoryChartData.values.some((v) => v > 0) && (
          <div className="mx-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-4">
                <PieChartIcon size={16} className="text-violet-500" />
                分类消费分布
              </h3>
              <BarChart data={categoryChartData} height={160} yUnit="元" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[])
                  .filter((k) => stats.categoryBreakdown[k].count > 0)
                  .map((k) => (
                    <div
                      key={k}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: categoryChartData.colors?.[0] }}
                      />
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {CATEGORY_LABELS[k]}
                      </span>
                      <span className="ml-auto text-xs text-gray-500 tabular-nums flex-shrink-0">
                        ¥{stats.categoryBreakdown[k].amount.toFixed(0)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {stats.totalAmount === 0 && (
          <div className="mx-4 py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <TrendingUp size={32} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-1">{stats.label}暂无数据</p>
            <p className="text-xs text-gray-400">多添加一些小票就能看到统计啦</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-2xl p-3.5 border border-white/20">
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-2`}>
        <Icon size={15} className="text-white" />
      </div>
      <p className="text-[11px] opacity-85">{label}</p>
      <p className="text-xl font-bold mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
