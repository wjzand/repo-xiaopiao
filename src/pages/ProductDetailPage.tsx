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
} from 'lucide-react';
import { useAppStore } from '@/store';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import {
  formatCNDate,
  getExpiryStatus,
  getRemainingDays,
  STATUS_CONFIG,
  addDays,
} from '@/utils/date';
import { Product, ProductCategory } from '@/types';
import PageHeader from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';

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

  const product = useMemo(() => (id ? getProductWithReceipt(id) : undefined), [id, getProductWithReceipt]);

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
