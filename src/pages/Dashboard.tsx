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
  Info
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { productsAPI } from "@/services/api"
import { Product } from "@/types/product"

export default function Dashboard() {
  const { user, usage, usagePercentages: usage_percentages, trialInfo: trial_info, subscriptionDetails: subscription_details } = useAuth()
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  
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
        {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Create New Product
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start" 
              asChild
              disabled={membershipInfo.name === 'Basic'}
            >
              <Link to="/nutrition">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze Nutrition
                {membershipInfo.name === 'Basic' && (
                  <Badge variant="secondary" className="ml-auto">Pro+</Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/labels">
                <FileText className="w-4 h-4 mr-2" />
                Generate Label
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start" 
              asChild
              disabled={membershipInfo.name === 'Basic'}
            >
              <Link to="/qr-codes">
                <QrCode className="w-4 h-4 mr-2" />
                Create QR Code
                {membershipInfo.name === 'Basic' && (
                  <Badge variant="secondary" className="ml-auto">Pro+</Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 justify-center">
              <Package className="w-5 h-5" />
              Recent Products
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3 min-h-[200px]">
              {isLoadingProducts ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Link 
                        to={`/products/${product.id}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {product.category?.name || 'No Category'} • {formatDate(product.updated_at)}
                      </p>
                    </div>
                    <Badge 
                      variant={product.status === "published" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {product.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full py-8">
                  <div className="text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium text-foreground mb-2">No products available</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't created any products yet. Start by adding your first product to begin managing your inventory.
                    </p>
                    <Button size="sm" asChild>
                      <Link to="/products/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Product
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {/* View All Products button positioned at bottom center */}
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/products">View All Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start space-x-2">
                    {alert.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{alert.message}</p>
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        {alert.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Status */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            Membership Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{membershipInfo.name} Membership</h3>
              <p className="text-sm text-muted-foreground">
              {currentUsage.products}/{usage?.products?.unlimited ? '∞' : membershipInfo.product_limit} products used this month
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
            <Button variant="outline" asChild>
              <Link to="/billing">Manage Plan</Link>
            </Button>
          </div>
          <div className="mt-4 bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full" 
              style={{ 
                width: usage?.products?.unlimited 
                  ? "100%" 
                  : `${usage_percentages?.products || 0}%` 
              }} 
            />
          </div>
          {membershipInfo.name === 'Basic' && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro for advanced features!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}