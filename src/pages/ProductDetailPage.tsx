import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit2,
  Check,
  Calendar,
  Hash,
  Tag,
  Package,
  Store,
  FileText,
  Clock,
  ChevronRight,
  Trash2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import {
  formatCNDate,
  getExpiryStatus,
  getRemainingDays,
  STATUS_CONFIG,
  addDays,
  getDaysBetween,
  getTodayStr,
} from '@/utils/date';
import { Product, ProductCategory, ConsumptionAnalysis } from '@/types';
import PageHeader from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import LineChart from '@/components/LineChart';
import { getProductConsumptionAnalysis } from '@/utils/consumption';

type EditableField =
  | 'name'
  | 'category'
  | 'quantity'
  | 'unitPrice'
  | 'productionDate'
  | 'shelfLifeDays'
  | 'expiryDate'
  | 'note';

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  editContent?: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
}

function InfoItem({
  icon,
  label,
  value,
  editing,
  onEdit,
  onSave,
  editContent,
  clickable,
  onClick,
}: InfoItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-4 bg-white rounded-2xl ${
        clickable ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        {editing && editContent ? (
          editContent
        ) : (
          <div className="text-sm font-medium text-gray-800 truncate">{value}</div>
        )}
      </div>
      {!editing && !clickable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-95 transition-all"
        >
          <Edit2 size={16} />
        </button>
      )}
      {editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-primary-500 bg-primary-50 active:scale-95 transition-all"
        >
          <Check size={16} />
        </button>
      )}
      {!editing && clickable && <ChevronRight size={18} className="text-gray-300" />}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getProductWithReceipt = useAppStore((state) => state.getProductWithReceipt);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const getReceiptById = useAppStore((state) => state.getReceiptById);
  const products = useAppStore((s) => s.products);
  const receipts = useAppStore((s) => s.receipts);

  const product = useMemo(() => (id ? getProductWithReceipt(id) : undefined), [id, getProductWithReceipt]);

  const consumption = useMemo<ConsumptionAnalysis | null>(() => {
    if (!product) {
      return null;
    }
    return getProductConsumptionAnalysis(product.name, products, receipts);
  }, [product, products, receipts]);

  const purchaseChart = useMemo(() => {
    if (!consumption || consumption.purchaseHistory.length < 2) {
      return null;
    }
    const history = consumption.purchaseHistory.slice(-8);
    return {
      labels: history.map((h) => h.date.slice(5)),
      values: history.map((h) => h.quantity),
    };
  }, [consumption]);

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [noteText, setNoteText] = useState<string>(product?.note ?? '');
  const [showProcessDialog, setShowProcessDialog] = useState(false);

  if (!product || !id) {
    return (
      <div className="app-container flex flex-col min-h-screen">
        <PageHeader title="商品详情" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">商品不存在</div>
        </div>
      </div>
    );
  }

  const remaining = getRemainingDays(product.expiryDate);
  const status = getExpiryStatus(product.expiryDate);
  const statusCfg = STATUS_CONFIG[status];

  const remainingDisplay =
    remaining < 0
      ? `-${-remaining}`
      : remaining === 0
      ? '今天'
      : `${remaining}`;

  const remainingUnit =
    remaining < 0 || remaining === 0 ? '' : '天';

  const handleStartEdit = (field: EditableField, currentValue: string | number) => {
    setEditingField(field);
    setEditValue(String(currentValue));
  };

  const handleSaveEdit = () => {
    if (!editingField) return;

    let updates: Partial<Product> = {};

    switch (editingField) {
      case 'name':
        if (editValue.trim()) {
          updates.name = editValue.trim();
        }
        break;
      case 'category':
        if (editValue) {
          updates.category = editValue as ProductCategory;
        }
        break;
      case 'quantity': {
        const qty = parseInt(editValue);
        if (!isNaN(qty) && qty > 0) {
          updates.quantity = qty;
        }
        break;
      }
      case 'unitPrice': {
        const price = parseFloat(editValue);
        if (!isNaN(price) && price >= 0) {
          updates.unitPrice = price;
        }
        break;
      }
      case 'productionDate':
        if (editValue) {
          updates.productionDate = editValue;
          updates.expiryDate = addDays(editValue, product.shelfLifeDays);
        }
        break;
      case 'shelfLifeDays': {
        const days = parseInt(editValue);
        if (!isNaN(days) && days > 0) {
          updates.shelfLifeDays = days;
          updates.expiryDate = addDays(product.productionDate, days);
        }
        break;
      }
      case 'expiryDate':
        if (editValue) {
          updates.expiryDate = editValue;
        }
        break;
      case 'note':
        updates.note = editValue;
        break;
    }

    if (Object.keys(updates).length > 0) {
      updateProduct(id, updates);
    }

    setEditingField(null);
    setEditValue('');
  };

  const handleSaveNote = () => {
    updateProduct(id, { note: noteText });
  };

  const handleMarkProcessed = () => {
    updateProduct(id, { isProcessed: true });
    setShowProcessDialog(false);
    navigate(-1);
  };

  const receipt = getReceiptById(product.receiptId);

  const categoryOptions = Object.entries(CATEGORY_LABELS) as [ProductCategory, string][];

  const renderEditContent = () => {
    switch (editingField) {
      case 'name':
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            className="w-full bg-gray-50 border border-primary-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'category':
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            className="w-full bg-gray-50 border border-primary-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {categoryOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        );
      case 'quantity':
      case 'shelfLifeDays':
      case 'unitPrice':
        return (
          <input
            type={editingField === 'unitPrice' ? 'number' : 'number'}
            step={editingField === 'unitPrice' ? '0.01' : '1'}
            min={editingField === 'unitPrice' ? '0' : '1'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            className="w-full bg-gray-50 border border-primary-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'productionDate':
      case 'expiryDate':
        return (
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            className="w-full bg-gray-50 border border-primary-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        );
      default:
        return null;
    }
  };

  const daysUntilFinish = consumption?.estimatedFinishDate
    ? getDaysBetween(getTodayStr(), consumption.estimatedFinishDate)
    : null;

  const expiryVsConsumption = consumption?.estimatedFinishDate
    ? (() => {
        const eDays = getDaysBetween(getTodayStr(), product.expiryDate);
        const cDays = daysUntilFinish ?? 999;
        if (eDays < cDays) return 'expireFirst' as const;
        if (eDays > cDays + 7) return 'consumeFirst' as const;
        return 'ok' as const;
      })()
    : null;

  return (
    <div className="app-container flex flex-col min-h-screen">
      <PageHeader title="商品详情" showBack />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-4 pb-3">
          <div
            className={`rounded-3xl p-6 ${statusCfg.bg} bg-opacity-10 relative overflow-hidden`}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className="text-5xl font-bold"
                    style={{ color: statusCfg.color }}
                  >
                    {remainingDisplay}
                  </span>
                  <span
                    className="text-xl font-semibold"
                    style={{ color: statusCfg.color }}
                  >
                    {remainingUnit}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} bg-opacity-20`}
                  style={{ color: statusCfg.color }}
                >
                  {statusCfg.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">到期日</div>
                <div className="text-sm font-semibold text-gray-700">
                  {formatCNDate(product.expiryDate)}
                </div>
              </div>
            </div>
            <div
              className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10"
              style={{ backgroundColor: statusCfg.color }}
            />
          </div>
        </div>

        {consumption && (
          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-1.5">
              <Sparkles size={12} />
              智能消耗分析
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-emerald-600" />
                    <span className="text-[11px] text-emerald-700 font-medium">
                      平均消耗周期
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900 mt-0.5">
                    {consumption.avgConsumptionCycleDays != null
                      ? `${consumption.avgConsumptionCycleDays} 天`
                      : '数据积累中'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShoppingCart size={12} className="text-sky-600" />
                    <span className="text-[11px] text-sky-700 font-medium">
                      历史购买
                    </span>
                  </div>
                  <p className="text-lg font-bold text-sky-900 mt-0.5">
                    {consumption.purchaseHistory.length} 次
                  </p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-violet-600" />
                      <span className="text-[11px] text-violet-700 font-medium">
                        预计消耗完
                      </span>
                    </div>
                    {daysUntilFinish != null && daysUntilFinish <= 5 && (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                        即将用完
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <div>
                      <p className="text-lg font-bold text-violet-900">
                        {consumption.estimatedFinishDate
                          ? formatCNDate(consumption.estimatedFinishDate)
                          : consumption.lastPurchaseDate && consumption.avgConsumptionCycleDays
                          ? formatCNDate(
                              addDays(
                                consumption.lastPurchaseDate,
                                consumption.avgConsumptionCycleDays
                              )
                            )
                          : '数据积累中'}
                      </p>
                      {daysUntilFinish != null && (
                        <p className="text-[11px] text-violet-600 mt-0.5">
                          还有 <span className="font-bold">{Math.max(0, daysUntilFinish)} 天</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {expiryVsConsumption === 'expireFirst' && (
                    <div className="mt-3 flex items-start gap-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-xl p-2.5 animate-pulse-soft">
                      <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-700 leading-snug">
                        到期前可能消耗不完，建议加速食用或减少采购量
                      </p>
                    </div>
                  )}
                  {expiryVsConsumption === 'consumeFirst' && remaining > 0 && (
                    <div className="mt-3 flex items-start gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-2.5">
                      <span className="text-green-500 flex-shrink-0 mt-0.5 text-lg">✓</span>
                      <p className="text-xs text-green-700 leading-snug">
                        预计消耗完日期早于到期日，无需担心浪费
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {consumption.purchaseHistory.length >= 2 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-3 font-medium flex items-center gap-1">
                    <TrendingDown size={12} />
                    近 {Math.min(consumption.purchaseHistory.length, 8)} 次购买数量趋势
                  </p>
                  {purchaseChart && (
                    <LineChart data={purchaseChart} yUnit="件" height={140} />
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    {consumption.purchaseHistory.slice(-4).map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-lg"
                      >
                        <span>{h.date.slice(5)}</span>
                        <span className="text-gray-700 font-medium">×{h.quantity}件</span>
                        <span className="text-primary-600 font-bold">¥{h.unitPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {consumption.purchaseHistory.length < 2 && (
                <div className="mt-4 py-6 text-center bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400">
                  <Sparkles size={14} className="inline mr-1" />
                  再买几次即可获得消耗分析更准确
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-4 py-3 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            商品信息
          </div>

          <InfoItem
            icon={<Package size={18} />}
            label="商品名称"
            value={product.name}
            editing={editingField === 'name'}
            onEdit={() => handleStartEdit('name', product.name)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Tag size={18} />}
            label="分类"
            value={CATEGORY_LABELS[product.category]}
            editing={editingField === 'category'}
            onEdit={() => handleStartEdit('category', product.category)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Hash size={18} />}
            label="数量"
            value={`x${product.quantity}`}
            editing={editingField === 'quantity'}
            onEdit={() => handleStartEdit('quantity', product.quantity)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Tag size={18} />}
            label="单价"
            value={`¥${product.unitPrice.toFixed(2)}`}
            editing={editingField === 'unitPrice'}
            onEdit={() => handleStartEdit('unitPrice', product.unitPrice)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Calendar size={18} />}
            label="生产日期"
            value={formatCNDate(product.productionDate)}
            editing={editingField === 'productionDate'}
            onEdit={() => handleStartEdit('productionDate', product.productionDate)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Calendar size={18} />}
            label="到期日"
            value={formatCNDate(product.expiryDate)}
            editing={editingField === 'expiryDate'}
            onEdit={() => handleStartEdit('expiryDate', product.expiryDate)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Clock size={18} />}
            label="保质期天数"
            value={`${product.shelfLifeDays} 天`}
            editing={editingField === 'shelfLifeDays'}
            onEdit={() => handleStartEdit('shelfLifeDays', product.shelfLifeDays)}
            onSave={handleSaveEdit}
            editContent={renderEditContent()}
          />

          <InfoItem
            icon={<Store size={18} />}
            label="来源小票"
            value={receipt ? receipt.storeName : product.storeName}
            editing={false}
            onEdit={() => {}}
            onSave={() => {}}
            clickable={true}
            onClick={() => navigate(`/receipts/${product.receiptId}`)}
          />
        </div>

        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">
            备注
          </div>
          <div className="bg-white rounded-2xl p-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={handleSaveNote}
              placeholder="添加备注信息..."
              rows={4}
              className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        <div className="px-4 py-6 space-y-3">
          {!product.isProcessed && (
            <button
              onClick={() => setShowProcessDialog(true)}
              className="w-full btn-secondary flex items-center justify-center gap-2 text-gray-700"
            >
              <Check size={18} />
              <span>标记已处理</span>
            </button>
          )}
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-medium text-red-500 bg-red-50 active:scale-95 transition-all">
            <Trash2 size={18} />
            <span>删除商品</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showProcessDialog}
        title="标记已处理"
        message="确定要将此商品标记为已处理吗？标记后将不会在商品清单中显示。"
        confirmText="确认标记"
        cancelText="取消"
        onConfirm={handleMarkProcessed}
        onCancel={() => setShowProcessDialog(false)}
      />
    </div>
  );
}
