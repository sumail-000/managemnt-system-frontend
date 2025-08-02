import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Plus, 
  BarChart3, 
  QrCode, 
  FileText, 
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Crown,
  Info,
  Zap,
  ArrowUpRight
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { productsAPI } from "@/services/api"
import { Product } from "@/types/product"
import { ProductSelector } from "@/components/ProductSelector"
import { ComplianceFeedback } from "@/components/ComplianceFeedback"

export default function Dashboard() {
  const { user, usage, usagePercentages: usage_percentages, trialInfo: trial_info, subscriptionDetails: subscription_details } = useAuth()
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Debug logging
  console.log('[DASHBOARD] Debug data:', {
    user: user,
    membershipPlan: user?.membership_plan,
    trialInfo: trial_info,
    subscriptionDetails: subscription_details,
    usage: usage,
    usagePercentages: usage_percentages
  });
  
  // Fetch recent products
  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        setIsLoadingProducts(true)
        const response = await productsAPI.getAll({ per_page: 2, sort_by: 'updated_at', sort_order: 'desc' })
        setRecentProducts(response.data || [])
      } catch (error) {
        console.error('Error fetching recent products:', error)
        setRecentProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }
    
    fetchRecentProducts()
  }, [])
  
  // Get membership plan features from user data
  const getMembershipFeatures = () => {
    if (!user?.membership_plan) {
      return { 
        name: 'Basic', 
        limit: 3, 
        features: [],
        product_limit: 3,
        label_limit: 10
      }
    }
    
    const plan = user.membership_plan
    return {
      name: plan.name,
      limit: plan.product_limit || (plan.name === 'Basic' ? 3 : plan.name === 'Pro' ? 20 : 999),
      features: plan.features || [],
      product_limit: plan.product_limit || (plan.name === 'Basic' ? 3 : plan.name === 'Pro' ? 20 : 999),
      label_limit: plan.label_limit || (plan.name === 'Basic' ? 10 : plan.name === 'Pro' ? 100 : 9999)
    }
  }

  const membershipInfo = getMembershipFeatures()
  
  // Get current usage from context
  const currentUsage = {
    products: usage?.products?.current_month || 0,
    labels: usage?.labels?.current_month || 0
  }
  // Real-time stats from API data
  const stats = [
    {
      title: "Total Products",
      value: (usage?.products?.total || 0).toString(),
      change: usage?.products?.total > 0 ? "+" + Math.round((currentUsage.products / usage.products.total) * 100) + "% this month" : "No data",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Labels Generated",
      value: currentUsage.labels.toString(),
      change: usage?.labels?.limit ? `${Math.round((currentUsage.labels / usage.labels.limit) * 100)}% of limit used` : "This month",
      icon: FileText,
      color: "text-accent"
    },
    {
      title: "QR Codes Created",
      value: (usage?.qr_codes?.current_month || 0).toString(),
      change: usage?.qr_codes?.total ? `${usage.qr_codes.total} total` : "This month",
      icon: QrCode,
      color: "text-success"
    },
    {
      title: "Plan Usage",
      value: `${Math.round(usage_percentages?.products || 0)}%`,
      change: `${currentUsage.products}/${usage?.products?.unlimited ? '∞' : membershipInfo.product_limit} used`,
      icon: CheckCircle,
      color: (usage_percentages?.products || 0) > 80 ? "text-warning" : "text-success"
    }
  ]

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }
  
  // Show message if no products exist
  const hasProducts = (usage?.products?.total || 0) > 0

  // Dynamic alerts based on real user data
  const alerts = []
  
  // Usage warning alerts
  if ((usage_percentages?.products || 0) > 80) {
    alerts.push({
      type: "warning",
      message: `You're using ${Math.round(usage_percentages?.products || 0)}% of your ${membershipInfo.name} plan's product limit`,
      action: "Upgrade Plan"
    })
  }
  
  // Trial expiration alerts
  if (trial_info?.is_trial && trial_info.remaining_days <= 7) {
    alerts.push({
      type: "warning",
      message: `Your trial expires in ${trial_info.remaining_days} days. Upgrade to continue using premium features.`,
      action: "Upgrade Now"
    })
  }
  
  // Subscription renewal alerts
  if (subscription_details?.remaining_days && subscription_details.remaining_days <= 7) {
    alerts.push({
      type: "info",
      message: `Your subscription renews in ${subscription_details.remaining_days} days`,
      action: "Manage Billing"
    })
  }
  
  // Welcome message for new users
  if ((usage?.products?.total || 0) === 0) {
    alerts.push({
      type: "info",
      message: "Welcome! Start by creating your first product to unlock the full potential of our platform.",
      action: "Create Product"
    })
  }
  
  // Default alert if no specific alerts
  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      message: "Everything looks good! Your account is active and ready to use.",
      action: "View Products"
    })
  }

  return (
    <div className="flex-1">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Here's what's happening with your food products.
            </p>
          </div>
          <div className="flex items-center gap-4">

            <Button variant="gradient" size="lg" asChild>
              <Link to="/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 p-6">
      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-background/50 to-background/30 group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-300">
                <stat.icon className={`h-5 w-5 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {stat.value}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-success font-medium">{stat.change.split(' ')[0]}</span>
                </div>
                <span className="text-xs text-muted-foreground">from last month</span>
              </div>
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, (parseInt(stat.value.replace(/[^0-9]/g, '')) / 1000) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Enhanced Quick Actions */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="relative grid gap-3 pt-6">
            <Button variant="outline" className="group/btn justify-start h-12 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200" asChild>
              <Link to="/products/new">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-green-100 to-green-50 mr-3 group-hover/btn:from-green-200 group-hover/btn:to-green-100 transition-all">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                Create New Product
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="group/btn justify-start h-12 border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-all duration-200" 
              asChild
              disabled={membershipInfo.name === 'Basic'}
            >
              <Link to="/nutrition">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 mr-3 group-hover/btn:from-blue-200 group-hover/btn:to-blue-100 transition-all">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                Analyze Nutrition
                {membershipInfo.name === 'Basic' && (
                  <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700">Pro+</Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="group/btn justify-start h-12 border-border/50 hover:border-purple-400/50 hover:bg-purple-400/5 transition-all duration-200" asChild>
              <Link to="/labels">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-100 to-purple-50 mr-3 group-hover/btn:from-purple-200 group-hover/btn:to-purple-100 transition-all">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                Generate Label
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="group/btn justify-start h-12 border-border/50 hover:border-orange-400/50 hover:bg-orange-400/5 transition-all duration-200" 
              asChild
              disabled={membershipInfo.name === 'Basic'}
            >
              <Link to="/qr-codes">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-orange-100 to-orange-50 mr-3 group-hover/btn:from-orange-200 group-hover/btn:to-orange-100 transition-all">
                  <QrCode className="w-4 h-4 text-orange-600" />
                </div>
                Create QR Code
                {membershipInfo.name === 'Basic' && (
                  <Badge variant="secondary" className="ml-auto bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700">Pro+</Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced Recent Products */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Recent Products
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-6">
            <div className="space-y-3 min-h-[200px]">
              {isLoadingProducts ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="group/item flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border border-border/30">
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-muted to-muted/70 rounded-md w-32 animate-pulse"></div>
                        <div className="h-3 bg-gradient-to-r from-muted to-muted/70 rounded-md w-24 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gradient-to-r from-muted to-muted/70 rounded-full w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <div key={product.id} className="group/item flex items-center justify-between p-4 bg-gradient-to-r from-background/50 to-background/30 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex-1">
                      <Link 
                        to={`/products/${product.id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200 block"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {product.category?.name || 'No Category'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatDate(product.updated_at)}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={product.status === "published" ? "default" : "secondary"}
                      className={`text-xs ${product.status === "published" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0" 
                        : "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      {product.status === "published" ? "✓ Published" : "⏳ Draft"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-muted/20 to-muted/40 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">No products available</h4>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      You haven't created any products yet. Start by adding your first product to begin managing your inventory.
                    </p>
                    <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0" asChild>
                      <Link to="/products/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Product
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {/* Enhanced View All Products button */}
            <div className="flex justify-center mt-6 pt-4 border-t border-border/30">
              <Button variant="outline" size="sm" className="w-full bg-gradient-to-r from-background to-background/80 hover:from-primary/5 hover:to-accent/5 border-border/50 hover:border-primary/30 transition-all duration-300" asChild>
                <Link to="/products" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  View All Products
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Alerts & Notifications */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-6">
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="group/alert p-4 rounded-xl border border-border/30 bg-gradient-to-r from-background/50 to-background/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${alert.type === "warning" 
                      ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20" 
                      : "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20"
                    }`}>
                      {alert.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">{alert.message}</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-primary hover:text-accent transition-colors duration-200 font-medium"
                      >
                        {alert.action} →
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Feedback Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Compliance Feedback</h2>
            <p className="text-muted-foreground">
              Select a product to view detailed nutritional compliance metrics and analysis.
            </p>
          </div>
        </div>
        
        {/* Product Selection */}
        <ProductSelector 
          onProductSelect={setSelectedProduct}
          selectedProductId={selectedProduct?.id}
        />
        
        {/* Compliance Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Key Nutrition Metrics</h3>
          <ComplianceFeedback product={selectedProduct} />
        </div>
      </div>

      {/* Enhanced Membership Status */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardHeader className="relative border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
              <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent className="relative pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-xl text-foreground">{membershipInfo.name}</h3>
                <Badge className={`${membershipInfo.name === 'Basic' 
                  ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300' 
                  : membershipInfo.name === 'Pro'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0'
                  : 'bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white border-0'
                }`}>
                  {membershipInfo.name === 'Enterprise' ? '✨ Enterprise' : membershipInfo.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{currentUsage.products}</span>
              <span className="text-muted-foreground">/{usage?.products?.unlimited ? '∞' : membershipInfo.product_limit}</span>
              <span className="text-muted-foreground"> products used this month</span>
              {(() => {
                // Show trial info if user is on trial (any plan)
                if (trial_info && trial_info.remaining_days !== undefined) {
                   return ` • Trial expires in ${trial_info.remaining_days} day${trial_info.remaining_days !== 1 ? 's' : ''}`;
                 }
                 
                 // Show subscription info if user has paid subscription
                 if (subscription_details && subscription_details.remaining_days !== undefined) {
                   return ` • Subscription expires in ${subscription_details.remaining_days} day${subscription_details.remaining_days !== 1 ? 's' : ''}`;
                 }
                
                // For Basic plan users without trial/subscription data
                if (membershipInfo.name === 'Basic') {
                  return ' • Free plan active';
                }
                
                // For paid plans without subscription data, show generic active status
                return ' • Active subscription';
              })()}
            </p>
            </div>
            <Button variant="outline" className="bg-gradient-to-r from-background to-background/80 hover:from-primary/5 hover:to-accent/5 border-border/50 hover:border-primary/30 transition-all duration-300" asChild>
              <Link to="/billing" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Manage Plan
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usage Progress</span>
              <span className="font-medium text-foreground">
                {usage?.products?.unlimited ? '100%' : `${Math.round(usage_percentages?.products || 0)}%`}
              </span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-purple-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ 
                  width: usage?.products?.unlimited 
                    ? "100%" 
                    : `${usage_percentages?.products || 0}%` 
                }} 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full" />
            </div>
          </div>
          {membershipInfo.name === 'Basic' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 via-accent/5 to-purple-500/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Upgrade to unlock more!</p>
                  <p className="text-sm text-muted-foreground">Get unlimited products, advanced analytics, and priority support.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}