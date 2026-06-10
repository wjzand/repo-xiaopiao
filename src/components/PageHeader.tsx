import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
  variant?: 'default' | 'primary';
}

export default function PageHeader({
  title,
  showBack = false,
  right,
  variant = 'default',
}: PageHeaderProps) {
  const isPrimary = variant === 'primary';
  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between px-4 py-3 ${
        isPrimary
          ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white'
          : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
      }`}
      style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)` }}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <Link to=".." className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full active:bg-black/10">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </Link>
        )}
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div>{right}</div>
    </header>
  );
}
