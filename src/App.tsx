import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from './components/layout/AppLayout';
import { SuperadminLayout } from './components/layout/SuperadminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Sessions from './pages/Sessions';
import Menu from './pages/Menu';
import Categories from './pages/Categories';
import Addons from './pages/Addons';
import CompanyProfile from './pages/CompanyProfile';
import Amenities from './pages/Amenities';
import DeliveryBoys from './pages/DeliveryBoys';
import Notifications from './pages/Notifications';
import InterventionsPage from './pages/InterventionsPage';
import AdminChat from './pages/AdminChat';
import SuperadminBusinesses from './pages/SuperadminBusinesses';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminAuditLogs from './pages/SuperAdminAuditLogs';
import SuperAdminTenantFeatures from './pages/SuperAdminTenantFeatures';
import SuperAdminDataClear from './pages/SuperAdminDataClear';
import { UsageDashboard } from './components/usage/UsageDashboard';
import { BusinessUsageDetail } from './components/usage/BusinessUsageDetail';
import { CostManagement } from './components/usage/CostManagement';
import NotFound from "./pages/NotFound";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import AiSettings from "./pages/AiSettings";
import { FeatureGate } from "./components/FeatureGate";

const App = () => (
  <Provider store={store}>
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Superadmin routes */}
          <Route path="/superadmin" element={<SuperadminLayout />}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="businesses" element={<SuperadminBusinesses />} />
            <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
            <Route path="tenant-features" element={<SuperAdminTenantFeatures />} />
            <Route path="data-clear" element={<SuperAdminDataClear />} />
            <Route path="usage" element={<UsageDashboard />} />
            <Route path="usage/business/:businessId" element={<BusinessUsageDetail />} />
            <Route path="usage/costs" element={<CostManagement />} />
          </Route>
          {/* Regular admin routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/addons" element={<FeatureGate feature="menu_addons"><Addons /></FeatureGate>} />
            <Route path="/company" element={<CompanyProfile />} />
            <Route path="/amenities" element={<FeatureGate feature="amenities"><Amenities /></FeatureGate>} />
            <Route path="/delivery-boys" element={<FeatureGate feature="delivery_management"><DeliveryBoys /></FeatureGate>} />
            <Route path="/notifications" element={<FeatureGate feature="notifications"><Notifications /></FeatureGate>} />
            <Route path="/interventions" element={<FeatureGate feature="interventions"><InterventionsPage /></FeatureGate>} />
            <Route path="/chat/:sessionId?" element={<AdminChat />} />
            <Route path="/campaigns" element={<FeatureGate feature="campaigns"><Campaigns /></FeatureGate>} />
            <Route path="/analytics" element={<FeatureGate feature="analytics"><Analytics /></FeatureGate>} />
            <Route path="/customers" element={<FeatureGate feature="crm_customers"><Customers /></FeatureGate>} />
            <Route path="/settings/ai" element={<FeatureGate feature="ai_settings"><AiSettings /></FeatureGate>} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </Provider>
);

export default App;
