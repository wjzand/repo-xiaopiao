import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import HomePage from '@/pages/HomePage';
import ReceiptsPage from '@/pages/ReceiptsPage';
import ReceiptDetailPage from '@/pages/ReceiptDetailPage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import ScanPage from '@/pages/ScanPage';
import ManualEntryPage from '@/pages/ManualEntryPage';
import SettingsPage from '@/pages/SettingsPage';
import ShelfLifePage from '@/pages/ShelfLifePage';
import ShoppingListsPage from '@/pages/ShoppingListsPage';
import ShoppingEditPage from '@/pages/ShoppingEditPage';
import StatsPage from '@/pages/StatsPage';

function AppLayout() {
  const location = useLocation();
  const showNav = ['/', '/receipts', '/products', '/profile'].includes(location.pathname);

  return (
    <div className="app-container min-h-screen bg-gray-50 relative">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/manual" element={<ManualEntryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/shelf-life" element={<ShelfLifePage />} />
        <Route path="/shopping-lists" element={<ShoppingListsPage />} />
        <Route path="/shopping/:id" element={<ShoppingEditPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
