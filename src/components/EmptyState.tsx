import { Camera, FileText, Package, Leaf } from 'lucide-react';

interface EmptyStateProps {
  type: 'home' | 'receipts' | 'products' | 'search' | 'shopping';
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  const configs = {
    home: {
      icon: Leaf,
      iconBg: 'bg-primary-100 text-primary-500',
      title: '暂无临期商品',
      desc: '继续保持！拍张小票开始管理你的冰箱吧～',
      actionText: '立即拍小票',
    },
    receipts: {
      icon: FileText,
      iconBg: 'bg-blue-100 text-blue-500',
      title: '还没有小票记录',
      desc: '拍照存档或手动录入，开始追踪食品保质期',
      actionText: '添加小票',
    },
    products: {
      icon: Package,
      iconBg: 'bg-amber-100 text-amber-500',
      title: '还没有商品',
      desc: '添加小票后，商品会自动出现在这里',
      actionText: undefined,
    },
    search: {
      icon: Package,
      iconBg: 'bg-gray-100 text-gray-500',
      title: '没有找到相关商品',
      desc: '试试其他关键词',
      actionText: undefined,
    },
    shopping: {
      icon: FileText,
      iconBg: 'bg-sky-100 text-sky-500',
      title: '还没有采购清单',
      desc: '创建清单开始规划采购，智能推荐即将用完的商品',
      actionText: '创建清单',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in">
      <div className={`w-20 h-20 rounded-3xl ${config.iconBg} flex items-center justify-center mb-5`}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-2">{config.title}</h3>
      <p className="text-sm text-gray-500 text-center leading-relaxed mb-6 max-w-xs">
        {config.desc}
      </p>
      {config.actionText && onAction && (
        <button onClick={onAction} className="btn-primary flex items-center gap-2">
          <Camera size={18} />
          <span>{config.actionText}</span>
        </button>
      )}
    </div>
  );
}
