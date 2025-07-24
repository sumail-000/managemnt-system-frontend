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
import Ingredients from "./pages/Ingredients";
import NutritionAnalysis from "./pages/NutritionAnalysis";
import LabelGeneratorPage from "./pages/LabelGenerator";
import Billing from "./pages/Billing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import QRCodes from "./pages/QRCodes";
import Favorites from "./pages/Favorites";
import { PaymentForm } from "./components/payment/PaymentForm";

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
      
      <Route path="/ingredients" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Ingredients />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/nutrition" element={
        <ProtectedRoute>
          <DashboardLayout>
            <NutritionAnalysis />
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
            <div className="p-6">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </div>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;
