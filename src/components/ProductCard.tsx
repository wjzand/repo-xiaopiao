import { Product } from '@/types';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import { getExpiryStatus, getRemainingDays, STATUS_CONFIG } from '@/utils/date';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  storeName?: string;
  showStore?: boolean;
  compact?: boolean;
}

export default function ProductCard({
  product,
  storeName,
  showStore = false,
  compact = false,
}: ProductCardProps) {
  const status = getExpiryStatus(product.expiryDate);
  const remaining = getRemainingDays(product.expiryDate);
  const cfg = STATUS_CONFIG[status];

  const remainingLabel =
    remaining < 0
      ? `已过期 ${-remaining} 天`
      : remaining === 0
      ? '今日到期'
      : `还剩 ${remaining} 天`;

  return (
    <Link
      to={`/products/${product.id}`}
      className={`card-hover block p-4 ${compact ? 'py-3' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${cfg.bg} bg-opacity-15`}
        >
          <span className={`text-lg font-bold ${cfg.text}`}>
            {remaining < 0 ? '!' : remaining === 0 ? '今' : remaining > 30 ? '✓' : remaining}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
            <span
              className={`chip flex-shrink-0 ${cfg.bg} bg-opacity-15 ${cfg.text}`}
              style={{ color: cfg.color }}
            >
              {remainingLabel}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{CATEGORY_LABELS[product.category]}</span>
            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
            <span>数量 x{product.quantity}</span>
            {showStore && storeName && (
              <>
                <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                <span className="truncate">{storeName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
