import { useState, useEffect } from 'react';
import { Plus, Minus, Clock, Save, Coins } from 'lucide-react';
import { useAppStore } from '@/store';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const getThisMonthBudgetSpent = useAppStore((s) => s.getThisMonthBudgetSpent);
  const getThisMonthBudgetRemaining = useAppStore((s) => s.getThisMonthBudgetRemaining);

  const [reminderDays, setReminderDays] = useState(settings.reminderDays);
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget);

  useEffect(() => {
    updateSettings({ reminderDays });
  }, [reminderDays, updateSettings]);

  useEffect(() => {
    updateSettings({ monthlyBudget });
  }, [monthlyBudget, updateSettings]);

  const monthlySpent = getThisMonthBudgetSpent();
  const monthlyRemaining = getThisMonthBudgetRemaining();
  const budgetPercent = monthlyBudget > 0 ? Math.min(100, (monthlySpent / monthlyBudget) * 100) : 0;

  const handleDecrease = () => {
    setReminderDays((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setReminderDays((prev) => Math.min(14, prev + 1));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReminderDays(Number(e.target.value));
  };

  const presets = [3, 7, 14];
  const budgetPresets = [1000, 2000, 3000, 5000];

  const handleBudgetAdjust = (delta: number) => {
    setMonthlyBudget((prev) => Math.max(0, Math.round((prev + delta) / 100) * 100));
  };

  const budgetDisplay =
    monthlyBudget / 1000 >= 10
      ? (monthlyBudget / 1000).toFixed(1).replace('.0', '') + 'k'
      : monthlyBudget.toLocaleString();

  const progressClass =
    budgetPercent >= 100
      ? 'bg-gradient-to-r from-red-400 to-red-500'
      : budgetPercent >= 80
      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
      : 'bg-gradient-to-r from-emerald-400 to-teal-500';

  const remainingColor = monthlyRemaining <= 0 ? 'text-red-600' : 'text-emerald-900';

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-bottom">
      <PageHeader title="设置" showBack />

      <div className="mx-4 mt-5">
        <div className="bg-white rounded-3xl p-5 shadow-card mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Coins size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">月度采购预算</h2>
              <p className="text-xs text-gray-500 mt-0.5">本月预算上限，超出时自动提醒</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-amber-700 mb-0.5">已花费</p>
              <p className="text-xl font-bold text-amber-900 tabular-nums">¥{monthlySpent.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-emerald-700 mb-0.5">剩余</p>
              <p className={`text-xl font-bold tabular-nums ${remainingColor}`}>¥{monthlyRemaining.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-violet-700 mb-0.5">使用</p>
              <p className="text-xl font-bold text-violet-900 tabular-nums">{Math.round(budgetPercent)}%</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all ${progressClass}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-5 mb-5">
            <button
              onClick={() => handleBudgetAdjust(-500)}
              className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
            >
              <span className="text-sm font-bold">-500</span>
            </button>

            <div className="relative">
              <div className="w-36 h-28 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-400 flex flex-col items-center justify-center shadow-lg">
                <span className="text-xs text-white/70 mb-0.5">¥</span>
                <span className="text-3xl font-bold text-white tabular-nums animate-scale-in">
                  {budgetDisplay}
                </span>
                <span className="text-xs text-white/70 mt-0.5">/月</span>
              </div>
            </div>

            <button
              onClick={() => handleBudgetAdjust(500)}
              className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all"
            >
              <span className="text-sm font-bold">+500</span>
            </button>
          </div>

          <p className="px-1 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            快捷选择
          </p>
          <div className="flex gap-2">
            {budgetPresets.map((amount) => {
              const active = monthlyBudget === amount;
              return (
                <button
                  key={amount}
                  onClick={() => setMonthlyBudget(amount)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-violet-500 to-purple-400 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ¥{amount.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">提前提醒天数</h2>
              <p className="text-xs text-gray-500 mt-0.5">在商品到期前 N 天开始提醒您</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={handleDecrease}
              disabled={reminderDays <= 1}
              className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-40"
            >
              <Minus size={22} strokeWidth={2.5} />
            </button>

            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-400 flex flex-col items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white tabular-nums animate-scale-in">
                  {reminderDays}
                </span>
                <span className="text-xs text-white/80 mt-0.5">天</span>
              </div>
            </div>

            <button
              onClick={handleIncrease}
              disabled={reminderDays >= 14}
              className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-40"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="px-2 mb-2">
            <div className="relative">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-200"
                  style={{ width: `${((reminderDays - 1) / (14 - 1)) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={1}
                max={14}
                value={reminderDays}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
              <span>1天</span>
              <span>7天</span>
              <span>14天</span>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="px-1 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            快捷选择
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex gap-3">
              {presets.map((days) => {
                const active = reminderDays === days;
                return (
                  <button
                    key={days}
                    onClick={() => setReminderDays(days)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                      active
                        ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {days}天
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 bg-primary-50 rounded-2xl p-4 border border-primary-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Save size={16} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-800">自动保存</p>
              <p className="text-xs text-primary-600 mt-1 leading-relaxed">
                设置会实时自动保存到本地存储，下次打开应用时继续生效
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
