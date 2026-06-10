import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  FileText as FileTextIcon,
  ChevronRight,
  ShieldCheck,
  Share2,
  Settings2,
  AlertTriangle,
  Package as PackageIcon,
  Loader2,
  Download,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getTodayStr, getThisMonthRange } from '@/utils/date';
import { generateShareCanvas, downloadImage } from '@/utils/canvas';
import PageHeader from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function ProfilePage() {
  const navigate = useNavigate();

  const receipts = useAppStore((s) => s.receipts);
  const products = useAppStore((s) => s.products);
  const getUrgentProducts = useAppStore((s) => s.getUrgentProducts);
  const clearAllData = useAppStore((s) => s.clearAllData);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareDataUrl, setShareDataUrl] = useState<string | null>(null);

  const totalReceipts = receipts.length;
  const uniqueProductNames = new Set(products.map((p) => p.name)).size;
  const { start, end } = getThisMonthRange();
  const thisMonthSaved = receipts
    .filter((r) => r.purchaseDate >= start && r.purchaseDate <= end)
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const today = getTodayStr().replace(/-/g, '');

  const handleGenerateShare = async () => {
    setShareLoading(true);
    try {
      const urgentProducts = getUrgentProducts(30);
      const dataUrl = await generateShareCanvas(urgentProducts);
      setShareDataUrl(dataUrl);
    } catch (error) {
      console.error('生成分享图失败:', error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleDownloadShare = () => {
    if (shareDataUrl) {
      downloadImage(shareDataUrl, `冰箱清单_${today}.jpg`);
    }
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  const StatCard = ({
    label,
    value,
    gradient,
    delay,
  }: {
    label: string;
    value: string | number;
    gradient: string;
    delay: number;
  }) => (
    <div
      className={`rounded-2xl ${gradient} p-4 text-white shadow-card animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <p className="text-xs opacity-90">{label}</p>
      <p className="mt-1 text-3xl font-bold leading-none tabular-nums">{value}</p>
    </div>
  );

  const MenuItem = ({
    icon,
    label,
    onClick,
    danger,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors ${
        danger ? 'text-red-500' : 'text-gray-700'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {icon}
      </div>
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  );

  const MenuGroup = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mx-4 mt-5">
      <p className="px-1 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
        {title}
      </p>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 safe-bottom">
      <PageHeader title="我的" variant="primary" />

      <div className="mx-4 -mt-2">
        <div className="bg-white rounded-3xl p-5 shadow-card animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-4xl shadow-inner">
                🥬
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center border-2 border-white shadow-sm">
                <UserIcon size={12} className="text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">小票管家</h2>
              <div className="mt-1 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary-500" />
                <span className="text-xs text-gray-500">本地存储 · 隐私保护</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <StatCard
          label="总小票数"
          value={totalReceipts}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-400"
          delay={100}
        />
        <StatCard
          label="商品种类"
          value={uniqueProductNames}
          gradient="bg-gradient-to-br from-violet-500 to-purple-400"
          delay={200}
        />
        <StatCard
          label="本月节省"
          value={`¥${thisMonthSaved.toFixed(0)}`}
          gradient="bg-gradient-to-br from-emerald-500 to-green-400"
          delay={300}
        />
      </div>

      <MenuGroup title="工具">
        <MenuItem
          icon={<FileTextIcon size={18} />}
          label="手动录入小票"
          onClick={() => navigate('/manual')}
        />
        <MenuItem
          icon={<Share2 size={18} />}
          label="生成冰箱清单"
          onClick={handleGenerateShare}
        />
      </MenuGroup>

      <MenuGroup title="设置">
        <MenuItem
          icon={<PackageIcon size={18} />}
          label="默认保质期库"
          onClick={() => navigate('/shelf-life')}
        />
        <MenuItem
          icon={<Settings2 size={18} />}
          label="提醒设置"
          onClick={() => navigate('/settings')}
        />
      </MenuGroup>

      <MenuGroup title="数据">
        <MenuItem
          icon={<AlertTriangle size={18} />}
          label="清除全部数据"
          danger
          onClick={() => setShowClearConfirm(true)}
        />
      </MenuGroup>

      <div className="mt-8 mb-4 text-center">
        <p className="text-xs text-gray-400">v1.0.0</p>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed">
          使用说明：拍小票自动识别商品及保质期，
          <br />
          临期商品自动提醒，让每一份食物都不被浪费
        </p>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="清除全部数据"
        message="此操作将删除所有小票和商品记录，且无法恢复。确定要继续吗？"
        confirmText="确认清除"
        cancelText="取消"
        variant="danger"
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
      />

      {shareLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <Loader2 size={24} className="text-primary-500 animate-spin" />
            </div>
            <p className="text-sm text-gray-600">正在生成冰箱清单...</p>
          </div>
        </div>
      )}

      {shareDataUrl && !shareLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">冰箱清单预览</h3>
              <button
                onClick={() => setShareDataUrl(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50">
              <img
                src={shareDataUrl}
                alt="冰箱清单"
                className="w-full rounded-xl shadow-md"
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShareDataUrl(null)}
                className="flex-1 py-3 rounded-full font-medium bg-gray-100 text-gray-700 active:scale-95 transition-all"
              >
                关闭
              </button>
              <button
                onClick={handleDownloadShare}
                className="flex-1 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-400 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} />
                <span>下载图片</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
