import { useState, useEffect } from 'react';
import { Plus, Minus, Clock, Save } from 'lucide-react';
import { useAppStore } from '@/store';
import PageHeader from '@/components/PageHeader';

export default function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [reminderDays, setReminderDays] = useState(settings.reminderDays);

  useEffect(() => {
    updateSettings({ reminderDays });
  }, [reminderDays, updateSettings]);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-bottom">
      <PageHeader title="提醒设置" showBack />

      <div className="mx-4 mt-5">
        <div className="bg-white rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">提前提醒天数</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                在商品到期前 N 天开始提醒您
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={handleDecrease}
              disabled={reminderDays <= 1}
              className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100"
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
              className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="px-2 mb-2">
            <div className="relative">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${((reminderDays - 1) / (14 - 1)) * 100}%`,
                  }}
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
            <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
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
              {presets.map((days) => (
                <button
                  key={days}
                  onClick={() => setReminderDays(days)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                    reminderDays === days
                      ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {days}天
                </button>
              ))}
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
