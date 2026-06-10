import { ExpiryStatus } from '@/types';

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function getDaysBetween(from: string, to: string): number {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const diff = toDate.getTime() - fromDate.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function getRemainingDays(expiryDate: string): number {
  const today = formatDate(new Date());
  return getDaysBetween(today, expiryDate);
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const remaining = getRemainingDays(expiryDate);
  if (remaining < 0) return 'expired';
  if (remaining === 0) return 'today';
  if (remaining <= 7) return 'urgent';
  if (remaining <= 30) return 'warning';
  return 'normal';
}

export const STATUS_CONFIG: Record<ExpiryStatus, { label: string; color: string; bg: string; text: string }> = {
  expired: {
    label: '已过期',
    color: '#EF4444',
    bg: 'bg-red-500',
    text: 'text-red-500',
  },
  today: {
    label: '今日到期',
    color: '#F97316',
    bg: 'bg-orange-600',
    text: 'text-orange-600',
  },
  urgent: {
    label: '临期',
    color: '#F59E0B',
    bg: 'bg-amber-500',
    text: 'text-amber-500',
  },
  warning: {
    label: '注意',
    color: '#EAB308',
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
  },
  normal: {
    label: '正常',
    color: '#10B981',
    bg: 'bg-emerald-500',
    text: 'text-emerald-500',
  },
};

export function getMonthLabel(dateStr: string): string {
  const date = parseDate(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function getMonthKey(dateStr: string): string {
  const date = parseDate(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function randomDaysBack(maxDays: number): string {
  const today = new Date();
  const days = Math.floor(Math.random() * maxDays) + 1;
  today.setDate(today.getDate() - days);
  return formatDate(today);
}

export function formatCNDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

export function getTodayStr(): string {
  return formatDate(new Date());
}

export function getThisMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}
