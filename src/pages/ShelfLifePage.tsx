import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  Trash2,
  Edit2,
  Save,
  Package as PackageIcon,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import PageHeader from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { ProductCategory, ShelfLifeItem } from '@/types';

export default function ShelfLifePage() {
  const shelfLifeDefaults = useAppStore((s) => s.shelfLifeDefaults);
  const addShelfLifeItem = useAppStore((s) => s.addShelfLifeItem);
  const removeShelfLifeItem = useAppStore((s) => s.removeShelfLifeItem);
  const updateShelfLifeDefaults = useAppStore((s) => s.updateShelfLifeDefaults);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [editDays, setEditDays] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('other');
  const [newDays, setNewDays] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return shelfLifeDefaults;
    const q = searchQuery.trim().toLowerCase();
    return shelfLifeDefaults.filter(
      (item) =>
        item.keyword.toLowerCase().includes(q) ||
        CATEGORY_LABELS[item.category]?.toLowerCase().includes(q)
    );
  }, [shelfLifeDefaults, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, ShelfLifeItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleAddItem = () => {
    if (!newKeyword.trim() || !newDays) return;
    const days = parseInt(newDays);
    if (isNaN(days) || days <= 0) return;
    if (shelfLifeDefaults.some((i) => i.keyword === newKeyword.trim())) {
      alert('该关键词已存在');
      return;
    }
    addShelfLifeItem({
      keyword: newKeyword.trim(),
      category: newCategory,
      days,
    });
    setNewKeyword('');
    setNewCategory('other');
    setNewDays('');
    setShowAddForm(false);
  };

  const handleStartEdit = (item: ShelfLifeItem) => {
    setEditingKeyword(item.keyword);
    setEditDays(String(item.days));
  };

  const handleSaveEdit = () => {
    if (!editingKeyword) return;
    const days = parseInt(editDays);
    if (isNaN(days) || days <= 0) return;
    const updated = shelfLifeDefaults.map((item) =>
      item.keyword === editingKeyword ? { ...item, days } : item
    );
    updateShelfLifeDefaults(updated);
    setEditingKeyword(null);
    setEditDays('');
  };

  const handleCancelEdit = () => {
    setEditingKeyword(null);
    setEditDays('');
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      removeShelfLifeItem(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const categoryOrder: ProductCategory[] = [
    'dairy',
    'meat',
    'vegetable',
    'fruit',
    'snack',
    'beverage',
    'seasoning',
    'other',
  ];

  return (
    <div className="app-container min-h-screen flex flex-col">
      <PageHeader
        title="默认保质期库"
        showBack
        right={
          <button
            onClick={() => setShowAddForm(true)}
            className="w-9 h-9 -mr-1.5 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        }
        variant="primary"
      />

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品关键词"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-11"
            />
          </div>
        </div>

        {showAddForm && (
          <div className="px-4 pt-2 pb-3 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-card p-4 border border-primary-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <PackageIcon size={18} className="text-primary-500" />
                  添加保质期规则
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    商品关键词
                  </label>
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="例如：牛奶"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    分类
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="input-field"
                  >
                    {categoryOrder.map((key) => (
                      <option key={key} value={key}>
                        {CATEGORY_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    保质期（天）
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    placeholder="例如：7"
                    className="input-field"
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!newKeyword.trim() || !newDays}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>添加</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 pt-2 space-y-5">
          {categoryOrder.map((catKey) => {
            const items = groupedByCategory[catKey];
            if (!items || items.length === 0) return null;
            return (
              <div key={catKey}>
                <div className="flex items-center gap-2 mb-2 pl-1">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-primary-500 to-primary-300" />
                  <h2 className="text-sm font-semibold text-gray-700">
                    {CATEGORY_LABELS[catKey]}
                  </h2>
                  <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {items.map((item) => (
                    <div
                      key={item.keyword}
                      className="flex items-center gap-3 p-3.5 active:bg-gray-50"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-600">
                          {item.keyword.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {item.keyword}
                        </div>
                        {editingKeyword === item.keyword ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <input
                              type="number"
                              min={1}
                              value={editDays}
                              onChange={(e) => setEditDays(e.target.value)}
                              autoFocus
                              className="w-24 bg-gray-50 border border-primary-300 rounded-lg px-2 py-1 text-xs font-medium text-gray-800 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-gray-500">天</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                              className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center"
                            >
                              <Save size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-0.5">
                            默认保质期 <span className="font-semibold text-primary-600">{item.days} 天</span>
                          </div>
                        )}
                      </div>
                      {editingKeyword !== item.keyword && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center active:bg-gray-100"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.keyword)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center active:bg-red-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Search size={28} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">没有找到相关规则</p>
            </div>
          )}

          <div className="pt-2 pb-4 text-center text-xs text-gray-400 leading-relaxed">
            共 {shelfLifeDefaults.length} 条默认保质期规则
            <br />
            录入商品时，系统会根据名称关键词自动匹配保质期
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除保质期规则"
        message={`确定要删除关键词「${deleteTarget}」的保质期规则吗？删除后录入该类商品时将使用默认 30 天保质期。`}
        confirmText="删除"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
