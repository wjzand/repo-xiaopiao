import { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, Camera, Settings, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { fileToBase64 } from '@/utils/common';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';

export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shouldShowBanner = useAppStore((s) => s.shouldShowBanner());
  const markBannerShown = useAppStore((s) => s.markBannerShown);
  const getExpiredCount = useAppStore((s) => s.getExpiredCount);
  const getTodayExpiringCount = useAppStore((s) => s.getTodayExpiringCount);
  const getUrgentCount = useAppStore((s) => s.getUrgentCount);
  const getUrgentProducts = useAppStore((s) => s.getUrgentProducts);

  const expiredCount = getExpiredCount();
  const todayCount = getTodayExpiringCount();
  const urgentCount = getUrgentCount(3);
  const urgentProducts = getUrgentProducts(30).slice(0, 20);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-bottom">
      <PageHeader title="小票管家" variant="primary" right={settingsRight} />

      {shouldShowBanner && (
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
