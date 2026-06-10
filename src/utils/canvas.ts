import { ProductWithReceipt } from '@/types';
import { CATEGORY_LABELS } from '@/constants/shelfLife';
import { formatCNDate, getExpiryStatus, getRemainingDays, STATUS_CONFIG } from './date';

export async function generateShareCanvas(
  products: ProductWithReceipt[]
): Promise<string> {
  const width = 750;
  const headerHeight = 220;
  const itemHeight = 130;
  const footerHeight = 120;
  const padding = 40;
  const height =
    headerHeight + products.length * itemHeight + footerHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, headerHeight);
  gradient.addColorStop(0, '#10B981');
  gradient.addColorStop(1, '#34D399');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, headerHeight - 40);
  ctx.quadraticCurveTo(width / 2, headerHeight + 20, 0, headerHeight - 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 48px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🥬 我的冰箱清单', width / 2, 90);

  ctx.font = '26px "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(`共 ${products.length} 件商品需要留意`, width / 2, 145);

  const today = formatCNDate(new Date().toISOString().slice(0, 10));
  ctx.font = '22px "PingFang SC", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`生成于 ${today}`, width / 2, 185);

  let y = headerHeight + padding;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cardX = padding;
    const cardY = y;
    const cardW = width - padding * 2;
    const cardH = itemHeight - 20;
    const radius = 20;

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.moveTo(cardX + radius, cardY);
    ctx.lineTo(cardX + cardW - radius, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + radius);
    ctx.lineTo(cardX + cardW, cardY + cardH - radius);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - radius, cardY + cardH);
    ctx.lineTo(cardX + radius, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - radius);
    ctx.lineTo(cardX, cardY + radius);
    ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';

    const status = getExpiryStatus(p.expiryDate);
    const remaining = getRemainingDays(p.expiryDate);
    const statusColor = STATUS_CONFIG[status].color;

    ctx.fillStyle = statusColor + '15';
    ctx.beginPath();
    ctx.arc(cardX + 55, cardY + cardH / 2, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 28px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const remainingText = remaining < 0 ? '过期' : remaining === 0 ? '今' : remaining > 99 ? '99+' : String(remaining);
    ctx.fillText(remainingText, cardX + 55, cardY + cardH / 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 30px "PingFang SC", sans-serif';
    ctx.fillText(p.name, cardX + 110, cardY + 45);

    ctx.fillStyle = '#6B7280';
    ctx.font = '22px "PingFang SC", sans-serif';
    ctx.fillText(
      `${CATEGORY_LABELS[p.category] || '其他'} · 数量 x${p.quantity}`,
      cardX + 110,
      cardY + 80
    );

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '20px "PingFang SC", sans-serif';
    ctx.fillText(
      `到期：${formatCNDate(p.expiryDate)} · ${p.storeName}`,
      cardX + 110,
      cardY + 110
    );

    ctx.fillStyle = statusColor;
    ctx.font = 'bold 24px "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    let dayLabel = '';
    if (remaining < 0) dayLabel = `已过期 ${-remaining} 天`;
    else if (remaining === 0) dayLabel = '今日到期';
    else dayLabel = `还剩 ${remaining} 天`;
    ctx.fillText(dayLabel, cardX + cardW - 25, cardY + 50);
    ctx.textAlign = 'left';

    y += itemHeight;
  }

  ctx.fillStyle = '#6B7280';
  ctx.font = '22px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('小票管家 · 让每一份食物都不被浪费', width / 2, height - 60);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '18px "PingFang SC", sans-serif';
  ctx.fillText('所有数据仅保存在您的手机本地', width / 2, height - 30);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
