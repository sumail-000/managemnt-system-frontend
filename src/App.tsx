import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { DashboardLayout } from './components/DashboardLayout'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/toaster'
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import ProductTrash from "./pages/ProductTrash";
import PublicProductView from "./pages/PublicProductView";

import CategoryManagement from "./pages/CategoryManagement";
import LabelGeneratorPage from "./pages/LabelGenerator";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import SampleLabel from "./pages/SampleLabel";
import NotFound from "./pages/NotFound";
import QRCodes from "./pages/QRCodes";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";

import { PaymentForm } from "./components/payment/PaymentForm";

// Admin Panel Components
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReports from "./pages/admin/AdminReports";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import { AdminAuthGuard } from "./components/admin/AdminAuthGuard";

// Enterprise Components
import { EnterpriseLayout } from "./components/enterprise/EnterpriseLayout";
import { EnterpriseDashboard } from "./pages/enterprise/EnterpriseDashboard";
import { TeamManagement } from "./pages/enterprise/TeamManagement";
import { BulkOperations } from "./pages/enterprise/BulkOperations";
import { ComplianceCenter } from "./pages/enterprise/ComplianceCenter";
import { BrandCenter } from "./pages/enterprise/BrandCenter";
import { APIManagement } from "./pages/enterprise/APIManagement";
import { EnterpriseAnalytics } from "./pages/enterprise/EnterpriseAnalytics";
import { EnterpriseSettings } from "./pages/enterprise/EnterpriseSettings";
import { Navigate } from 'react-router-dom';

const App = () => {
  console.log('[App] Application initialized');
  
  return (
    <Router>
      <AuthProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment" element={<PaymentForm />} />
      <Route path="/forgot-password" element={<ResetPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/sample-label" element={<SampleLabel />} />
      <Route path="/public/product/:id" element={<PublicProductView />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/products/new" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProductForm />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/products/:id" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProductDetail />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/products/:id/edit" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProductForm />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/products/trash" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProductTrash />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      

      
      <Route path="/categories" element={
        <ProtectedRoute>
          <DashboardLayout>
            <CategoryManagement />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      

      
      <Route path="/labels" element={
        <ProtectedRoute>
          <DashboardLayout>
            <LabelGeneratorPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/qr-codes" element={
        <ProtectedRoute requiredPlan="pro">
          <DashboardLayout>
            <QRCodes />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      

      
      <Route path="/favorites" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Favorites />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/billing" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Billing />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin Panel Routes */}
      <Route path="/admin-panel" element={
        <AdminAuthGuard>
          <AdminPanel />
        </AdminAuthGuard>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="support" element={<AdminSupport />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
      </Route>

      {/* Enterprise Routes */}
      <Route path="/enterprise/*" element={
        <ProtectedRoute requiredPlan="enterprise">
          <EnterpriseLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/enterprise/dashboard" replace />} />
        <Route path="dashboard" element={<EnterpriseDashboard />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="products" element={<BulkOperations />} />
        <Route path="compliance" element={<ComplianceCenter />} />
        <Route path="brand" element={<BrandCenter />} />
        <Route path="api" element={<APIManagement />} />
        <Route path="analytics" element={<EnterpriseAnalytics />} />
        <Route path="settings" element={<EnterpriseSettings />} />
      </Route>
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;
