import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { DashboardLayout } from './components/DashboardLayout'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { StripeProvider } from './components/providers/StripeProvider'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from 'next-themes'
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
import SupportCenter from "./pages/SupportCenter";
import SupportTicketDetail from "./pages/SupportTicketDetail";
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
import AdminProductDetails from "./pages/admin/AdminProductDetails";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSupportTicketDetail from "./pages/admin/AdminSupportTicketDetail";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminMaintenance from "./pages/admin/AdminMaintenance";
import AdminFaqs from "./pages/admin/AdminFaqs";
import IPRestrictionError from "./pages/admin/IPRestrictionError";
import { AdminAuthGuard } from "./components/admin/AdminAuthGuard";
import { UserAuthGuard } from "./components/UserAuthGuard";

// Enterprise Components
import { NewEnterpriseLayout } from "./components/enterprise/NewEnterpriseLayout";
import { NewEnterpriseDashboard } from "./pages/enterprise/NewEnterpriseDashboard";
import { TeamManagement } from "./pages/enterprise/TeamManagement";
import { BulkOperations } from "./pages/enterprise/BulkOperations";
import { ComplianceCenter } from "./pages/enterprise/ComplianceCenter";
import { BrandCenter } from "./pages/enterprise/BrandCenter";
import { APIManagement } from "./pages/enterprise/APIManagement";
import { EnterpriseAnalytics } from "./pages/enterprise/EnterpriseAnalytics";
import { EnterpriseSettings } from "./pages/enterprise/EnterpriseSettings";
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { membershipAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const App = () => {
  console.log('[App] Application initialized');
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
      
      <Route path="/support" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <SupportCenter />
            </DashboardLayout>
          </UserAuthGuard>
        </ProtectedRoute>
      } />
      <Route path="/support/tickets/:id" element={
        <ProtectedRoute>
          <UserAuthGuard>
            <DashboardLayout>
              <SupportTicketDetail />
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
        <Route path="products/:id" element={<AdminProductDetails />} />
        <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="support" element={<AdminSupport />} />
        <Route path="support/:id" element={<AdminSupportTicketDetail />} />
        <Route path="profile" element={<AdminProfile />} />
                <Route path="notifications" element={<AdminNotifications />} />
        <Route path="maintenance" element={<AdminMaintenance />} />
        <Route path="faqs" element={<AdminFaqs />} />
      </Route>

      {/* Enterprise Routes */}
      <Route path="/enterprise/*" element={
        <ProtectedRoute requiredPlan="enterprise">
          <NewEnterpriseLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/enterprise/dashboard" replace />} />
        <Route path="dashboard" element={<NewEnterpriseDashboard />} />
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
            <PlanLimitUpgradeListener />
            </NotificationsProvider>
          </AuthProvider>
        </Router>
      </StripeProvider>
    </ThemeProvider>
  );
};

function PlanLimitUpgradeListener() {
  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail || {};
      setEventData(detail);
      setOpen(true);
      // Load plans and recommendations when event fires
      loadPlansAndRecommendations();
    };
    window.addEventListener('planLimitReached', handler as EventListener);
    return () => window.removeEventListener('planLimitReached', handler as EventListener);
  }, []);

  const loadPlansAndRecommendations = async () => {
    try {
      const rec = await membershipAPI.getRecommendations();
      setRecommendation(rec?.data || null);
    } catch (e) {
      // ignore
    }
    try {
      const res = await membershipAPI.getPlans();
      const arr = res?.data || res; // handle both wrapped/unwrapped
      setPlans(Array.isArray(arr) ? arr : []);
    } catch (e) {
      // ignore
    }
  };

  const getNextPlan = () => {
    const current = user?.membership_plan?.name || 'Basic';
    // Use API recommendation if available
    const recPlan = recommendation?.recommended_plan;
    if (recPlan) return recPlan;
    const targetName = current === 'Basic' ? 'Pro' : current === 'Pro' ? 'Enterprise' : null;
    if (!targetName) return null;
    const found = plans.find((p: any) => p.name === targetName);
    return found || { name: targetName };
  };

  const onUpgrade = () => {
    const next = getNextPlan();
    const currentName = user?.membership_plan?.name || 'Basic';
    if (next) {
      navigate('/payment', {
        state: {
          planId: next.id,
          planName: next.name,
          price: next.price,
          isUpgrade: true,
          currentPlan: currentName,
        }
      });
    } else {
      // Fallback: go to payment without specific plan (UI can select)
      navigate('/payment', { state: { isUpgrade: true, currentPlan: currentName } });
    }
    setOpen(false);
  };

  const message = eventData?.message || 'You have reached the limit of your current plan.';
  const code = eventData?.code || 'PLAN_LIMIT_REACHED';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade required</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 text-sm text-muted-foreground">
          {code === 'PLAN_LIMIT_REACHED' ? 'To continue, please upgrade your plan.' : 'This feature requires a higher plan.'}
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Not now</Button>
          <Button onClick={onUpgrade}>Upgrade</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default App;
