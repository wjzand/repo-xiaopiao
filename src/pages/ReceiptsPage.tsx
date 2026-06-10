import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt as ReceiptIcon, MapPin, Calendar, Hash, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/store';
import { formatCNDate, getMonthKey, getMonthLabel } from '@/utils/date';
import PageHeader from '@/components/PageHeader';
import SwipeableCard from '@/components/SwipeableCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import type { Receipt, MonthlyReceipts } from '@/types';

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const receipts = useAppStore((state) => state.receipts);
  const deleteReceipt = useAppStore((state) => state.deleteReceipt);
  const getProductsByReceiptId = useAppStore((state) => state.getProductsByReceiptId);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteReceipt(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
  };

  const sortedReceipts = [...receipts].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const groupedReceipts: MonthlyReceipts[] = sortedReceipts.reduce<MonthlyReceipts[]>((groups, receipt) => {
    const key = getMonthKey(receipt.purchaseDate);
    const existing = groups.find((g) => g.month === key);
    if (existing) {
      existing.receipts.push(receipt);
    } else {
      groups.push({
        month: key,
        label: getMonthLabel(receipt.purchaseDate),
        receipts: [receipt],
      });
    }
    return groups;
  }, []);

  return (
    <div className="app-container min-h-screen flex flex-col">
      <PageHeader
        title="我的小票"
        right={
          <button
            onClick={() => navigate('/scan')}
            className="w-9 h-9 -mr-1.5 flex items-center justify-center rounded-full active:bg-black/10"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/scan')}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              <Plus size={18} />
              <span>拍照录入</span>
            </button>
            <button
              onClick={() => navigate('/manual')}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
            >
              <ReceiptIcon size={18} />
              <span>手动录入</span>
            </button>
          </div>
        </div>

        {receipts.length === 0 ? (
          <EmptyState type="receipts" onAction={() => navigate('/scan')} />
        ) : (
          <div className="px-4 pt-5 pb-24">
            {groupedReceipts.map((group) => (
              <div key={group.month} className="mb-6">
                <div className="flex items-center gap-3 mb-3 pl-1">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-primary-500 to-primary-300 flex-shrink-0" />
                  <h2 className="text-sm font-semibold text-gray-700">{group.label}</h2>
                </div>
                <div className="space-y-3">
                  {group.receipts.map((receipt) => (
                    <ReceiptCard
                      key={receipt.id}
                      receipt={receipt}
                      productCount={getProductsByReceiptId(receipt.id).length}
                      onDelete={() => handleDeleteClick(receipt.id)}
                      onClick={() => navigate(`/receipts/${receipt.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pb-24" />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除小票"
        message="删除后，该小票及其关联的所有商品记录将无法恢复，确定要删除吗？"
        confirmText="删除"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

interface ReceiptCardProps {
  receipt: Receipt;
  productCount: number;
  onDelete: () => void;
  onClick: () => void;
}

function ReceiptCard({ receipt, productCount, onDelete, onClick }: ReceiptCardProps) {
  return (
    <SwipeableCard onDelete={onDelete}>
      <button
        onClick={onClick}
        className="w-full text-left p-4 rounded-2xl card-hover"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center">
            <ReceiptIcon size={22} className="text-primary-500" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
                <span className="truncate">{receipt.storeName}</span>
              </h3>
              <span className="flex-shrink-0 font-bold text-lg text-gray-900">
                ¥{receipt.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} strokeWidth={2} />
                <span>{formatCNDate(receipt.purchaseDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash size={13} strokeWidth={2} />
                <span>{productCount} 件商品</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </SwipeableCard>
  );
}
