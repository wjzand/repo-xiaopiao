import { NavLink } from 'react-router-dom';
import { Home, Receipt, Package, User } from 'lucide-react';

const tabs = [
  { path: '/', label: '首页', icon: Home, end: true },
  { path: '/receipts', label: '小票', icon: Receipt },
  { path: '/products', label: '商品', icon: Package },
  { path: '/profile', label: '我的', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
