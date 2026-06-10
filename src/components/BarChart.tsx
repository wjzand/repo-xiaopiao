import { useEffect, useRef } from 'react';
import { BarChartData } from '@/types';

interface BarChartProps {
  data: BarChartData;
  width?: number;
  height?: number;
  showValues?: boolean;
  yUnit?: string;
  emptyMessage?: string;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  width = 340,
  height = 200,
  showValues = true,
  yUnit = '',
  emptyMessage = '暂无数据',
  horizontal = false,
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const { labels, values, colors } = data;

    if (values.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emptyMessage, width / 2, height / 2);
      return;
    }

    const defaultColors = [
      '#10B981',
      '#34D399',
      '#6EE7B7',
      '#A7F3D0',
      '#D1FAE5',
      '#93C5FD',
      '#60A5FA',
    ];

    const padding = horizontal
      ? { top: 12, right: 40, bottom: 12, left: 70 }
      : { top: 20, right: 16, bottom: 40, left: 36 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const n = Math.max(values.length, 1);
    const maxVal = Math.max(...values) * 1.15 || 1;

    if (!horizontal) {
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 1;
      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartH * i) / gridLines;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        const val = Math.round(maxVal - (maxVal * i) / gridLines);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${val}${yUnit}`, padding.left - 6, y + 3);
      }

      const barGap = 8;
      const barW = Math.max(12, (chartW - barGap * (n + 1)) / n);
      values.forEach((v, i) => {
        const color = colors?.[i] ?? defaultColors[i % defaultColors.length];
        const x = padding.left + barGap + i * (barW + barGap);
        const barH = (v / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');
        ctx.fillStyle = gradient;
        const radius = Math.min(6, barW / 2);
        roundRect(ctx, x, y, barW, barH, radius, true);

        if (showValues) {
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 10px -apple-system, "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${v}${yUnit}`, x + barW / 2, y - 6);
        }

        ctx.fillStyle = color;
        ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        const label = labels[i].length > 5 ? labels[i].slice(0, 5) : labels[i];
        ctx.fillText(label, x + barW / 2, height - 10);
      });
    } else {
      const barGap = 6;
      const barH = Math.max(14, (chartH - barGap * (n + 1)) / n);
      values.forEach((v, i) => {
        const color = colors?.[i] ?? defaultColors[i % defaultColors.length];
        const y = padding.top + barGap + i * (barH + barGap);
        const barW = (v / maxVal) * chartW;
        const x = padding.left;

        const gradient = ctx.createLinearGradient(x, 0, x + barW, 0);
        gradient.addColorStop(0, color + '90');
        gradient.addColorStop(1, color);
        ctx.fillStyle = gradient;
        const radius = Math.min(6, barH / 2);
        roundRect(ctx, x, y, Math.max(barW, radius * 2), barH, radius, true);

        if (showValues) {
          ctx.fillStyle = '#111827';
          ctx.font = 'bold 11px -apple-system, "PingFang SC", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${v}${yUnit}`, x + barW + 8, y + barH / 2 + 4);
        }

        ctx.fillStyle = color;
        ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
        ctx.textAlign = 'right';
        const label = labels[i].length > 8 ? labels[i].slice(0, 7) + '…' : labels[i];
        ctx.fillText(label, padding.left - 8, y + barH / 2 + 4);
      });
    }
  }, [data, width, height, showValues, yUnit, emptyMessage, horizontal, dpr]);

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: boolean
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, 0);
    ctx.arcTo(x, y + h, x, y, 0);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
  }

  return (
    <div className="w-full flex justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
}
