import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          } />
          
          {/* Placeholder routes for navigation */}
          <Route path="/products" element={
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <p className="text-muted-foreground">Product management coming soon...</p>
              </div>
            </DashboardLayout>
          } />
          
          <Route path="/products/new" element={
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Add New Product</h1>
                <p className="text-muted-foreground">Product creation form coming soon...</p>
              </div>
            </DashboardLayout>
          } />
          
          <Route path="/nutrition" element={
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Nutrition Analysis</h1>
                <p className="text-muted-foreground">Nutrition analysis tools coming soon...</p>
              </div>
            </DashboardLayout>
          } />
          
          <Route path="/labels" element={
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Label Generator</h1>
                <p className="text-muted-foreground">Label generation tools coming soon...</p>
              </div>
            </DashboardLayout>
          } />
          
          <Route path="/qr-codes" element={
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">QR Codes</h1>
                <p className="text-muted-foreground">QR code management coming soon...</p>
              </div>
            </DashboardLayout>
          } />
          
          <Route path="/settings" element={
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </div>
            </DashboardLayout>
          } />
          
          {/* Blog Route */}
          <Route path="/blog" element={<Blog />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
