import { useEffect, useRef } from 'react';
import { LineChartData } from '@/types';

interface LineChartProps {
  data: LineChartData;
  width?: number;
  height?: number;
  showDots?: boolean;
  showValues?: boolean;
  yUnit?: string;
  emptyMessage?: string;
}

export default function LineChart({
  data,
  width = 340,
  height = 180,
  showDots = true,
  showValues = true,
  yUnit = '',
  emptyMessage = '暂无数据',
}: LineChartProps) {
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

    const { labels, values, color = '#10B981' } = data;

    if (values.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emptyMessage, width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 16, bottom: 28, left: 36 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...values) * 1.2 || 1;
    const minVal = 0;
    const n = Math.max(labels.length, 1);

    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const val = Math.round(maxVal - ((maxVal - minVal) * i) / gridLines);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${val}${yUnit}`, padding.left - 6, y + 3);
    }

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '03');

    ctx.beginPath();
    values.forEach((v, i) => {
      const x = padding.left + (chartW * i) / (n - 1 || 1);
      const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    const lastX = padding.left + (chartW * (n - 1)) / (n - 1 || 1);
    ctx.lineTo(lastX, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    values.forEach((v, i) => {
      const x = padding.left + (chartW * i) / (n - 1 || 1);
      const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (showDots) {
      values.forEach((v, i) => {
        const x = padding.left + (chartW * i) / (n - 1 || 1);
        const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
      });
    }

    if (showValues) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 10px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      values.forEach((v, i) => {
        const x = padding.left + (chartW * i) / (n - 1 || 1);
        const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH - 10;
        ctx.fillText(`${v}${yUnit}`, x, y);
      });
    }

    ctx.fillStyle = '#6B7280';
    ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(labels.length / 6) || 1;
    labels.forEach((lbl, i) => {
      if (i % labelStep !== 0 && i !== labels.length - 1) return;
      const x = padding.left + (chartW * i) / (n - 1 || 1);
      ctx.fillText(lbl, x, height - 8);
    });
  }, [data, width, height, showDots, showValues, yUnit, emptyMessage, dpr]);

  return (
    <div className="w-full flex justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
}
