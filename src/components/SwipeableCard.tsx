import { useRef, useState, TouchEvent } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  className?: string;
  deleteLabel?: string;
}

export default function SwipeableCard({
  children,
  onDelete,
  className = '',
  deleteLabel = '删除',
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const DELETE_WIDTH = 80;

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientX - startX.current;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -DELETE_WIDTH));
    } else {
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (translateX < -DELETE_WIDTH / 2) {
      setTranslateX(-DELETE_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  const resetPosition = () => setTranslateX(0);

  return (
    <div className={`swipe-container rounded-2xl ${className}`}>
      <div
        className="swipe-content rounded-2xl"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div onClick={resetPosition}>{children}</div>
      </div>
      <button
        className="swipe-delete rounded-r-2xl"
        onClick={onDelete}
        style={{ opacity: translateX < 0 ? 1 : 0, pointerEvents: translateX < 0 ? 'auto' : 'none' }}
      >
        {deleteLabel}
      </button>
    </div>
  );
}
