import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { DashboardLayout } from './components/DashboardLayout'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { StripeProvider } from './components/providers/StripeProvider'
import { Toaster } from './components/ui/toaster'
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import ProductDetail from "./pages/ProductDetail";
import ProductTrash from "./pages/ProductTrash";
import PublicProductView from "./pages/PublicProductView";

import CategoryManagement from "./pages/CategoryManagement";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import NutritionLabel from "./pages/NutritionLabel";
import NotFound from "./pages/NotFound";
import QRCodes from "./pages/QRCodes";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import { CustomIngredientPage } from "./pages/CustomIngredientPage";
import CustomIngredients from "./pages/CustomIngredients";

import PaymentForm from "./components/payment/PaymentForm";

// Admin Panel Components
import AdminPanel from "./pages/AdminPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminReports from "./pages/admin/AdminReports";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import IPRestrictionError from "./pages/admin/IPRestrictionError";
import { AdminAuthGuard } from "./components/admin/AdminAuthGuard";
import { UserAuthGuard } from "./components/UserAuthGuard";

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
    <StripeProvider>
      <Router>
        <AuthProvider>
          <NotificationsProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment" element={<PaymentForm />} />
      <Route path="/forgot-password" element={<ResetPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/nutrition-label" element={<NutritionLabel />} />
      <Route path="/labels" element={<NutritionLabel />} />
      <Route path="/public/product/:id" element={<PublicProductView />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <Products />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/products/new" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <ProductForm />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />

      <Route path="/products/:id" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <ProductDetail />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />

      <Route path="/products/:id/edit" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <ProductForm />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />

      <Route path="/products/trash" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <ProductTrash />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      {/* Custom Ingredient Routes */}
      <Route path="/custom-ingredients" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <CustomIngredients />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/ingredients/create" element={
        <ProtectedRoute>
          <CustomIngredientPage />
        </ProtectedRoute>
      } />
      
      <Route path="/ingredients/edit/:id" element={
        <ProtectedRoute>
          <CustomIngredientPage />
        </ProtectedRoute>
      } />

      <Route path="/categories" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <CategoryManagement />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/qr-codes" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <QRCodes />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/favorites" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <Favorites />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/billing" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      
      {/* IP Restriction Error Route */}
      <Route path="/admin/ip-restricted" element={<IPRestrictionError />} />
      
      {/* Admin Panel Routes */}
      <Route path="/admin-panel" element={
        <AdminAuthGuard>
          <AdminPanel />
        </AdminAuthGuard>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetails />} />
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
        </NotificationsProvider>
        </AuthProvider>
      </Router>
    </StripeProvider>
  );
};

export default App;
