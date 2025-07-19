import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  AlertTriangle,
  CreditCard, 
  Crown, 
  Star, 
  Check, 
  AlertCircle, 
  Calendar,
  Receipt,
  Settings,
  Zap,
  Shield,
  Infinity,
  TrendingUp,
  Download,
  MapPin,
  User,
  Edit3,
  Trash2,
  Plus,
  X,
  CheckCircle2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { billingAPI } from "@/services/api"

export default function Billing() {
  const { user, usage, usagePercentages, refreshUsage } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [autoRenew, setAutoRenew] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [editingBilling, setEditingBilling] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    full_name: "",
    email: "",
    company_name: "",
    street_address: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "",
    phone: ""
  })
  const [paymentMethods, setPaymentMethods] = useState([])
  const [billingHistory, setBillingHistory] = useState([])
  
  // Load billing data on component mount
  useEffect(() => {
    const loadBillingData = async () => {
      try {
        const [billingInfoResponse, paymentMethodsResponse, billingHistoryResponse] = await Promise.all([
          billingAPI.getBillingInformation(),
          billingAPI.getPaymentMethods(),
          billingAPI.getBillingHistory()
        ])
        
        // Handle billing information response
        if (billingInfoResponse && billingInfoResponse.data && billingInfoResponse.data.data) {
          setBillingInfo(billingInfoResponse.data.data)
        }
        
        // Handle payment methods response
        if (paymentMethodsResponse && paymentMethodsResponse.data) {
          setPaymentMethods(paymentMethodsResponse.data.data || [])
        }
        
        // Handle billing history response
        if (billingHistoryResponse && billingHistoryResponse.data) {
          setBillingHistory(billingHistoryResponse.data.data || [])
        }
      } catch (error) {
        console.error('Failed to load billing data:', error)
        toast({
          title: "Error",
          description: "Failed to load billing information.",
          variant: "destructive",
        })
      }
    }
    
    loadBillingData()
  }, [toast])
  
  // Get current membership info
  const currentPlan = user?.membershipPlan || { name: 'Basic', product_limit: 3, label_limit: 10, features: [] }
  const currentUsage = {
    products: usage?.products?.current_month || 0,
    labels: usage?.labels?.current_month || 0
  }



  // Transform API plans to match the home page structure
  const getTransformedPlans = () => {
    const homePlansStructure = {
      'Basic': {
        price: 0,
        period: '14 days',
        description: 'Perfect for small food businesses getting started',
        features: [
          'Manual product entry only',
          'Max 3 product submissions/14 days',
          'Standard label templates',
          'Basic compliance feedback',
          'Self-help support',
          'Email notifications',
          'Basic nutrition analysis'
        ],
        limitations: [
          'No API access',
          'No bulk operations',
          'Limited templates'
        ],
        productLimit: 3,
        labelLimit: 10,
        popular: false
      },
      'Pro': {
        price: 79,
        period: 'month',
        description: 'Ideal for growing businesses with advanced needs',
        features: [
          '20 product limit/month',
          'Advanced label templates',
          'Priority label validation',
          'Label validation PDF reports',
          'Product dashboard & history',
          'Email + chat support',
          'Nutritionist support',
          'QR code generation',
          'Multi-language labels',
          'Allergen detection'
        ],
        limitations: [
          'Limited API calls',
          'No team collaboration'
        ],
        productLimit: 20,
        labelLimit: 100,
        popular: true
      },
      'Enterprise': {
        price: 199,
        period: 'month',
        description: 'Complete solution for large organizations',
        features: [
          'Unlimited products',
          'Bulk upload via Excel/CSV/API',
          'Dedicated account manager',
          'Full API access',
          'Custom badges & certificates',
          'Compliance dashboard',
          'Role-based team access',
          'Private label management',
          'Regulatory update access',
          '24/7 priority support',
          'Custom integrations',
          'White-label options'
        ],
        limitations: [],
        productLimit: 999,
        labelLimit: 9999,
        popular: false
      }
    }

    return Object.keys(homePlansStructure).map(planName => ({
      name: planName,
      ...homePlansStructure[planName],
      current: currentPlan.name === planName
    }))
  }

  const plans = getTransformedPlans()



  const handleUpgrade = async (planName: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      await refreshUsage()
      toast({
        title: "Plan Updated",
        description: `Successfully upgraded to ${planName} plan!`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = () => {
    toast({
      title: "Redirecting",
      description: "Opening billing portal...",
    })
    // In real implementation, this would redirect to Stripe Customer Portal
  }

  const downloadInvoice = (invoice: string) => {
    toast({
      title: "Download Started",
      description: `Downloading invoice ${invoice}`,
    })
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setShowCancelModal(false)
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePaymentMethod = () => {
    toast({
      title: "Redirecting",
      description: "Opening payment method update...",
    })
  }

  const handleSaveBilling = async () => {
    try {
      setIsLoading(true)
      await billingAPI.saveBillingInformation(billingInfo)
      setEditingBilling(false)
      toast({
        title: "Updated",
        description: "Billing information updated successfully!",
      })
    } catch (error) {
      console.error('Failed to save billing information:', error)
      toast({
        title: "Error",
        description: "Failed to save billing information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
            Billing & Plans
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing information, and view usage
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleManageBilling} className="hover-scale">
            <Settings className="w-4 h-4 mr-2" />
            Manage Billing
          </Button>
          {currentPlan.name !== 'Basic' && (
            <Button 
              variant="destructive" 
              onClick={() => setShowCancelModal(true)}
              className="hover-scale"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Plan
            </Button>
          )}
        </div>
      </div>

      {/* Current Plan Overview */}
      <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 bg-gradient-primary rounded-lg hover:scale-110 transition-transform duration-200">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {currentPlan.name} Plan
                  {currentPlan.name === 'Pro' && (
                    <Badge variant="secondary" className="ml-2">Popular</Badge>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {currentPlan.name === 'Basic' ? 'Free for 14 days' : 
                   currentPlan.name === 'Pro' ? '$79/month' : '$199/month'}
                </p>
              </div>
            </div>
            <div className="text-right animate-fade-in">
              <p className="text-sm text-muted-foreground">Next billing</p>
              <p className="font-medium">February 15, 2024</p>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="auto-renew" className="text-sm">Auto-renew</Label>
                <Switch 
                  id="auto-renew"
                  checked={autoRenew}
                  onCheckedChange={setAutoRenew}
                  className="data-[state=checked]:bg-gradient-primary"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">{/* Added billing info section */}
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Usage This Month
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Products</span>
                    <span>{currentUsage.products}/{usage?.products?.unlimited ? '∞' : (currentPlan.product_limit === 999 ? '∞' : currentPlan.product_limit)}</span>
                  </div>
                  <Progress value={usage?.products?.unlimited ? 0 : (usagePercentages?.products || 0)} className="h-3 rounded-full shadow-inner" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Labels Generated</span>
                    <span>{currentUsage.labels}/{usage?.labels?.unlimited ? '∞' : (currentPlan.label_limit === 9999 ? '∞' : currentPlan.label_limit)}</span>
                  </div>
                  <Progress value={usage?.labels?.unlimited ? 0 : (usagePercentages?.labels || 0)} className="h-3 rounded-full shadow-inner" />
                </div>
                {currentPlan.name === 'Basic' && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Trial Period Active
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          You have {usage?.trial_days_remaining || 0} days remaining in your free trial.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Plan Features
              </h4>
              <div className="space-y-2">
                {currentPlan.features?.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm hover:bg-muted/50 p-2 rounded transition-colors">
                    <Check className="w-4 h-4 text-success animate-pulse" />
                    <span>{feature}</span>
                  </div>
                ))}
                {currentPlan.features?.length > 4 && (
                  <p className="text-sm text-muted-foreground">
                    +{currentPlan.features.length - 4} more features
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-accent" />
          Available Plans
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl animate-scale-in ${
                plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
              } ${plan.current ? 'ring-2 ring-accent' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-pulse">
                  <Badge className="bg-gradient-primary shadow-lg">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {plan.current && (
                <div className="absolute -top-3 right-4 animate-bounce">
                  <Badge variant="outline" className="bg-background shadow-md">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm hover:bg-muted/30 p-1 rounded transition-colors">{/* Added hover effect */}
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  
                  {/* Limitations */}
                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                      <div className="space-y-1">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <div key={limitIndex} className="flex items-center space-x-2">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                            <span className="text-xs text-muted-foreground">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full hover-scale" 
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={plan.current || isLoading}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {isLoading ? (
                    <div className="animate-pulse">Processing...</div>
                  ) : plan.current ? (
                    'Current Plan'
                  ) : plan.name === 'Basic' ? (
                    'Downgrade'
                  ) : (
                    'Upgrade'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Details */}
      <Card className="hover:shadow-lg transition-all duration-300 animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Billing Information
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditingBilling(!editingBilling)}
              className="hover-scale"
            >
              {editingBilling ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {editingBilling ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="billing-name">Full Name</Label>
                {editingBilling ? (
                  <Input 
                    id="billing-name" 
                    value={billingInfo.full_name} 
                    onChange={(e) => setBillingInfo({...billingInfo, full_name: e.target.value})}
                    className="mt-1" 
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted/30 rounded">{billingInfo.full_name || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-email">Email Address</Label>
                {editingBilling ? (
                  <Input 
                    id="billing-email" 
                    value={billingInfo.email} 
                    onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                    className="mt-1" 
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted/30 rounded">{billingInfo.email || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-company">Company Name</Label>
                {editingBilling ? (
                  <Input 
                    id="billing-company" 
                    value={billingInfo.company_name} 
                    onChange={(e) => setBillingInfo({...billingInfo, company_name: e.target.value})}
                    className="mt-1" 
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted/30 rounded">{billingInfo.company_name || 'Not provided'}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="billing-address">Street Address</Label>
                {editingBilling ? (
                  <Input 
                    id="billing-address" 
                    value={billingInfo.street_address} 
                    onChange={(e) => setBillingInfo({...billingInfo, street_address: e.target.value})}
                    className="mt-1" 
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted/30 rounded">{billingInfo.street_address || 'Not provided'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="billing-city">City</Label>
                  {editingBilling ? (
                    <Input 
                      id="billing-city" 
                      value={billingInfo.city} 
                      onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                      className="mt-1" 
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted/30 rounded text-sm">{billingInfo.city || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billing-zip">ZIP Code</Label>
                  {editingBilling ? (
                    <Input 
                      id="billing-zip" 
                      value={billingInfo.postal_code} 
                      onChange={(e) => setBillingInfo({...billingInfo, postal_code: e.target.value})}
                      className="mt-1" 
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted/30 rounded text-sm">{billingInfo.postal_code || 'Not provided'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="billing-state">State/Province</Label>
                  {editingBilling ? (
                    <Input 
                      id="billing-state" 
                      value={billingInfo.state_province} 
                      onChange={(e) => setBillingInfo({...billingInfo, state_province: e.target.value})}
                      className="mt-1" 
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted/30 rounded text-sm">{billingInfo.state_province || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="billing-country">Country</Label>
                  {editingBilling ? (
                    <Input 
                      id="billing-country" 
                      value={billingInfo.country} 
                      onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                      className="mt-1" 
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-muted/30 rounded text-sm">{billingInfo.country || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Payment Method Section */}
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Method
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleUpdatePaymentMethod}
                className="hover-scale"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            
            {paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.filter(pm => pm.is_default).map((paymentMethod) => (
                  <div key={paymentMethod.id} className="p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        {paymentMethod.brand?.toUpperCase() || 'CARD'}
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• {paymentMethod.last_four}</p>
                        <p className="text-xs text-muted-foreground">
                          {paymentMethod.expiry_month && paymentMethod.expiry_year ? 
                            `Expires ${paymentMethod.expiry_month.toString().padStart(2, '0')}/${paymentMethod.expiry_year}` : 
                            'No expiry info'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {paymentMethods.filter(pm => pm.is_default).length === 0 && (
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <p className="text-muted-foreground text-sm">No default payment method set</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border">
                <p className="text-muted-foreground text-sm">No payment methods added</p>
              </div>
            )}
          </div>
          
          {editingBilling && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingBilling(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBilling} className="hover-scale">
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="hover:shadow-lg transition-all duration-300 animate-scale-in">{/* Added hover effect */}
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Billing History
            </CardTitle>
            <Button variant="outline" size="sm" className="hover-scale">
              <Download className="w-4 h-4 mr-2" />{/* Added hover effect */}
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.length > 0 ? (
              billingHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-all duration-200 hover:scale-[1.01]">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.billing_date).toLocaleDateString()} • {item.invoice_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${parseFloat(item.amount).toFixed(2)} {item.currency?.toUpperCase()}</p>
                      <Badge variant={item.status === 'paid' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'}>
                        {item.status}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => downloadInvoice(item.invoice_number)}
                      className="hover-scale"
                      disabled={!item.invoice_url}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No billing history available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <div className="grid md:grid-cols-2 gap-6 animate-fade-in">{/* Added animation */}
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader>{/* Added hover effects */}
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This month</span>
                <span className="font-medium">+23% from last month</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Products created</span>
                  <span>{currentUsage.products}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Labels generated</span>
                  <span>{currentUsage.labels}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>QR codes created</span>
                  <span>{usage?.qr_codes?.current_month || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader>{/* Added hover effects */}
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPlan.name === 'Basic' && (usagePercentages?.products || 0) > 70 && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg hover:bg-warning/20 transition-colors animate-pulse">{/* Added hover and pulse */}
                  <p className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Consider upgrading
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You're using {Math.round(usagePercentages?.products || 0)}% of your product limit
                  </p>
                </div>
              )}
              <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg hover:from-muted/70 hover:to-muted/50 transition-all duration-300">{/* Enhanced styling */}
                <p className="font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" />
                  Save 20% with annual billing
                </p>
                <p className="text-sm text-muted-foreground">
                  Switch to annual payments and save money
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-full max-w-md mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Cancel Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to cancel your {currentPlan.name} subscription? 
                  You'll lose access to premium features at the end of your current billing period.
                </p>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">You'll lose access to:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {currentPlan.features?.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <X className="w-3 h-3 text-destructive" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleCancelSubscription}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Cancel Subscription'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}