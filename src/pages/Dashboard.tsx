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
  Crown
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

export default function Dashboard() {
  const { user, usage, usagePercentages } = useAuth()
  
  // Get membership plan features from user data
  const getMembershipFeatures = () => {
    if (!user?.membershipPlan) {
      return { 
        name: 'Basic', 
        limit: 3, 
        features: [],
        product_limit: 3,
        label_limit: 10
      }
    }
    
    const plan = user.membershipPlan
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
  const stats = [
    {
      title: "Total Products",
      value: "142",
      change: "+12%",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Labels Generated",
      value: "89",
      change: "+8%",
      icon: FileText,
      color: "text-accent"
    },
    {
      title: "QR Codes Active",
      value: "67",
      change: "+15%",
      icon: QrCode,
      color: "text-success"
    },
    {
      title: "Compliance Rate",
      value: "98.5%",
      change: "+2%",
      icon: CheckCircle,
      color: "text-success"
    }
  ]

  const recentProducts = [
    {
      id: 1,
      name: "Organic Greek Yogurt",
      category: "Dairy",
      status: "Published",
      updatedAt: "2 hours ago"
    },
    {
      id: 2,
      name: "Gluten-Free Crackers",
      category: "Snacks",
      status: "Draft",
      updatedAt: "5 hours ago"
    },
    {
      id: 3,
      name: "Premium Olive Oil",
      category: "Oils",
      status: "Published",
      updatedAt: "1 day ago"
    }
  ]

  const alerts = [
    {
      type: "warning",
      message: "3 products need label updates due to regulation changes",
      action: "Review Products"
    },
    {
      type: "info",
      message: "Monthly nutrition analysis report is ready",
      action: "Download Report"
    }
  ]

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
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-medium">{membershipInfo.name} Plan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {membershipInfo.limit === 999 ? 'Unlimited' : `${membershipInfo.limit} products/month`}
            </p>
          </div>
          <Button variant="gradient" size="lg" asChild>
            <Link to="/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </Button>
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
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category} • {product.updatedAt}
                    </p>
                  </div>
                  <Badge 
                    variant={product.status === "Published" ? "default" : "secondary"}
                  >
                    {product.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/products">View All Products</Link>
            </Button>
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
              {membershipInfo.name !== 'Basic' && ' • Expires in 23 days'}
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
                  : `${usagePercentages?.products || 0}%` 
              }} 
            />
          </div>
          {membershipInfo.name === 'Basic' && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro for 20 products/month and advanced features!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}