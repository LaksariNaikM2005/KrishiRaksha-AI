import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import FarmsPage from './pages/FarmsPage';
import FarmDetailPage from './pages/FarmDetailPage';
import AdvisoryPage from './pages/AdvisoryPage';
import RiskMapPage from './pages/RiskMapPage';
import VoicePage from './pages/VoicePage';
import SOSPage from './pages/SOSPage';
import MarketPage from './pages/MarketPage';
import MarketProductPage from './pages/MarketProductPage';
import CartPage from './pages/CartPage';
import ForumPage from './pages/ForumPage';
import ForumNewPage from './pages/ForumNewPage';
import ForumPostPage from './pages/ForumPostPage';
import SettingsPage from './pages/SettingsPage';
import OfficerDashboard from './pages/OfficerDashboard';
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes — all wrapped in AppLayout */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="farms" element={<FarmsPage />} />
          <Route path="farms/:id" element={<FarmDetailPage />} />
          <Route path="advisory/:id" element={<AdvisoryPage />} />
          <Route path="risk-map" element={<RiskMapPage />} />
          <Route path="voice" element={<VoicePage />} />
          <Route path="sos" element={<SOSPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="market/:id" element={<MarketProductPage />} />
          <Route path="market/cart" element={<CartPage />} />
          <Route path="forum" element={<ForumPage />} />
          <Route path="forum/new" element={<ForumNewPage />} />
          <Route path="forum/:id" element={<ForumPostPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="officer" element={<OfficerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
