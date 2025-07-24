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
  TrendingDown,
  TrendingUp,
  Download,
  MapPin,
  User,
  Edit3,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Lock
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { billingAPI, paymentAPI, membershipAPI } from '@/services/api'
import { useNavigate } from "react-router-dom"

export default function Billing() {
  const { 
    user, 
    usage, 
    usagePercentages: usage_percentages, 
    refreshUsage,
    billingInformation,
    paymentMethods: contextPaymentMethods,
    billingHistory: contextBillingHistory,
    subscriptionInfo, 
    subscriptionDetails, 
    trialInfo 
  } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [autoRenew, setAutoRenew] = useState(subscriptionDetails?.auto_renew ?? true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cancel' | 'downgrade' | null>(null)
  const [password, setPassword] = useState('')
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
  const [paymentMethods, setPaymentMethods] = useState(contextPaymentMethods || [])
  const [billingHistory, setBillingHistory] = useState(contextBillingHistory || [])
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState(null)
  
  // Update local state when context data changes
  useEffect(() => {
    if (billingInformation) {
      setBillingInfo({
        full_name: billingInformation.full_name || "",
        email: billingInformation.email || user?.email || "",
        company_name: billingInformation.company_name || user?.company || "",
        street_address: billingInformation.street_address || "",
        city: billingInformation.city || "",
        state_province: billingInformation.state_province || "",
        postal_code: billingInformation.postal_code || "",
        country: billingInformation.country || "",
        phone: billingInformation.phone || user?.contact_number || ""
      })
    }
  }, [billingInformation, user])
  
  useEffect(() => {
    if (contextPaymentMethods) {
      setPaymentMethods(contextPaymentMethods)
    }
  }, [contextPaymentMethods])
  
  useEffect(() => {
    if (contextBillingHistory) {
      setBillingHistory(contextBillingHistory)
    }
  }, [contextBillingHistory])
  
  // Get current membership info from real API data
  const currentPlan = user?.membership_plan || { name: 'Basic', product_limit: 3, label_limit: 10, features: [] }
  const currentUsage = {
    products: usage?.products?.current_month || 0,
    labels: usage?.labels?.current_month || 0
  }
  
  // Use billing data from AuthContext (already destructured above)



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
    // Get the plan details to pass to payment page
    const selectedPlan = plans.find(p => p.name === planName)
    if (!selectedPlan) return
    
    // Redirect to payment page with plan information
    navigate('/payment', { 
      state: { 
        planId: planName.toLowerCase(),
        planName: selectedPlan.name,
        price: selectedPlan.price,
        period: selectedPlan.period,
        isUpgrade: true,
        currentPlan: currentPlan.name
      } 
    })
  }

  const handleDowngrade = (planName: string) => {
    setPendingAction('downgrade')
    setShowDowngradeModal(true)
  }

  const handleCancelPlan = () => {
    setPendingAction('cancel')
    setShowCancelModal(true)
  }

  const confirmAction = () => {
    if (pendingAction === 'cancel') {
      setShowCancelModal(false)
    } else if (pendingAction === 'downgrade') {
      setShowDowngradeModal(false)
    }
    setShowPasswordModal(true)
  }

  const executeAction = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password to confirm.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Verify password first (simulate API call)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (pendingAction === 'cancel') {
        await handleCancelSubscription()
      } else if (pendingAction === 'downgrade') {
        if (selectedDowngradePlan) {
          await handleDowngradeSubscription(selectedDowngradePlan)
        }
      }
      
      setShowPasswordModal(false)
      setPassword('')
      setPendingAction(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid password or action failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDowngradeSubscription = async (planId: string) => {
    try {
      // Call API to downgrade to selected plan
      const response = await membershipAPI.upgradePlan(parseInt(planId))
      
      if (response.data.success) {
        // Refresh user data to get updated subscription
        await refreshUsage()
        
        // Find the selected plan name for the success message
        const selectedPlan = plans.find((plan: any) => plan.id === parseInt(planId))
        
        setShowDowngradeModal(false)
        setSelectedDowngradePlan(null)
        
        toast({
          title: "Plan Downgraded",
          description: response.data.message || `Your plan has been downgraded to ${selectedPlan?.name || 'selected plan'}. Changes will take effect at the end of your current billing period.`,
        })
      } else {
        throw new Error(response.data.message || 'Failed to downgrade plan')
      }
    } catch (error: any) {
      console.error('Downgrade subscription error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to downgrade plan. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleManageBilling = () => {
    toast({
      title: "Redirecting",
      description: "Opening billing portal...",
    })
    // In real implementation, this would redirect to Stripe Customer Portal
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true)
      toast({
        title: "Download Started",
        description: `Preparing invoice ${invoiceId} for download...`,
      })
      
      const response = await billingAPI.downloadInvoice(invoiceId)
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download Complete",
        description: `Invoice ${invoiceId} has been downloaded successfully.`,
      })
    } catch (error: any) {
      console.error('Download invoice error:', error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const exportBillingHistory = async () => {
    try {
      setIsLoading(true)
      toast({
        title: "Export Started",
        description: "Preparing billing history export...",
      })
      
      const response = await billingAPI.exportBillingHistory()
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `billing-history-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Export Complete",
        description: "Billing history has been exported successfully.",
      })
    } catch (error: any) {
      console.error('Export billing history error:', error)
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export billing history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      // Call actual API to cancel subscription
      const response = await paymentAPI.cancelSubscription()
      
      // Update local state based on API response
      if (response.data.success) {
        // Refresh user data to get updated subscription status
        await refreshUsage()
        
        setShowCancelModal(false)
        toast({
          title: "Subscription Cancelled",
          description: response.data.message || "Your subscription will remain active until the end of the current billing period.",
        })
      } else {
        throw new Error(response.data.message || 'Failed to cancel subscription')
      }
    } catch (error: any) {
      console.error('Cancel subscription error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePaymentMethod = () => {
    // Navigate to payment form with update context
    navigate('/payment', { 
      state: { 
        isUpdate: true,
        currentPlan: currentPlan.name,
        returnUrl: '/billing'
      } 
    })
    
    toast({
      title: "Redirecting",
      description: "Opening payment method update...",
    })
  }

  const handleAutoRenewChange = async (checked: boolean) => {
    setIsLoading(true)
    try {
      // Call API to update auto-renew setting
      const response = await paymentAPI.updateAutoRenew({ auto_renew: checked })
      
      if (response.data.success) {
        setAutoRenew(checked)
        // Refresh user data to sync with backend
        await refreshUsage()
        
        toast({
          title: "Auto-renew Updated",
          description: response.data.message || `Auto-renew has been ${checked ? 'enabled' : 'disabled'}.`,
        })
      } else {
        throw new Error(response.data.message || 'Failed to update auto-renew setting')
      }
    } catch (error: any) {
      console.error('Auto-renew update error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update auto-renew setting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Billing & Plans
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing information, and view usage
          </p>
        </div>
        <div className="flex gap-3">
          {currentPlan.name !== 'Basic' && (
            <Button 
              variant="destructive" 
              onClick={handleCancelPlan}
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
              <p className="font-medium">
                {subscriptionDetails?.next_renewal_date 
                  ? new Date(subscriptionDetails.next_renewal_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : trialInfo?.trial_ends_at 
                    ? `Trial ends ${new Date(trialInfo.trial_ends_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`
                    : 'No billing date available'
                }
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="auto-renew" className="text-sm">Auto-renew</Label>
                <Switch 
                  id="auto-renew"
                  checked={autoRenew}
                  onCheckedChange={handleAutoRenewChange}
                  className="data-[state=checked]:bg-gradient-primary"
                  disabled={currentPlan.name === 'Basic' || isLoading}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
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
                  <Progress value={usage?.products?.unlimited ? 0 : (usage_percentages?.products || 0)} className="h-3 rounded-full shadow-inner" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Labels Generated</span>
                    <span>{currentUsage.labels}/{usage?.labels?.unlimited ? '∞' : (currentPlan.label_limit === 9999 ? '∞' : currentPlan.label_limit)}</span>
                  </div>
                  <Progress value={usage?.labels?.unlimited ? 0 : (usage_percentages?.labels || 0)} className="h-3 rounded-full shadow-inner" />
                </div>
                {(trialInfo?.is_trial || currentPlan.name === 'Basic') && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          {trialInfo?.is_trial ? 'Trial Period Active' : 'Free Plan Active'}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          {trialInfo?.is_trial 
                            ? `You have ${trialInfo.remaining_days || 0} days remaining in your free trial.`
                            : 'Upgrade to unlock premium features and higher limits.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
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
          {plans.filter(plan => {
            // Show upgrade options based on current plan
            if (currentPlan.name === 'Basic') {
              return plan.name === 'Pro' || plan.name === 'Enterprise'
            } else if (currentPlan.name === 'Pro') {
              return plan.name === 'Enterprise' || plan.name === 'Basic'
            } else if (currentPlan.name === 'Enterprise') {
              return plan.name === 'Pro' || plan.name === 'Basic'
            }
            return true
          }).map((plan, index) => {
            const isUpgrade = (
              (currentPlan.name === 'Basic' && (plan.name === 'Pro' || plan.name === 'Enterprise')) ||
              (currentPlan.name === 'Pro' && plan.name === 'Enterprise')
            )
            const isDowngrade = (
              (currentPlan.name === 'Pro' && plan.name === 'Basic') ||
              (currentPlan.name === 'Enterprise' && (plan.name === 'Pro' || plan.name === 'Basic'))
            )
            
            return (
            <Card 
              key={plan.name} 
              className={`relative transition-all duration-300 hover:scale-105 hover:shadow-xl animate-scale-in ${
                plan.popular && !plan.current ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
              } ${plan.current ? 'ring-2 ring-accent' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && !plan.current && (
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
                    <div key={index} className="flex items-center gap-2 text-sm hover:bg-muted/30 p-1 rounded transition-colors">
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
                  variant={plan.current ? "outline" : isUpgrade ? "default" : "destructive"}
                  disabled={plan.current || isLoading}
                  onClick={() => {
                    if (isUpgrade) {
                      handleUpgrade(plan.name)
                    } else if (isDowngrade) {
                      handleDowngrade(plan.name)
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="animate-pulse">Processing...</div>
                  ) : plan.current ? (
                    'Current Plan'
                  ) : isUpgrade ? (
                    'Upgrade'
                  ) : (
                    'Downgrade'
                  )}
                </Button>
              </CardContent>
            </Card>
            )
          })}
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
      <Card className="hover:shadow-lg transition-all duration-300 animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Billing History
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover-scale"
              onClick={exportBillingHistory}
              disabled={isLoading || billingHistory.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? 'Exporting...' : 'Export All'}
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
                      <p className="font-medium">${parseFloat(item.amount.toString()).toFixed(2)} {item.currency?.toUpperCase()}</p>
                      <Badge variant={item.status === 'paid' ? 'default' : item.status === 'pending' ? 'secondary' : 'destructive'}>
                        {item.status}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => downloadInvoice(item.invoice_number)}
                      className="hover-scale"
                      disabled={isLoading}
                      title="Download Invoice PDF"
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
      <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {usage?.period ? 
                    `${new Date(usage.period.start).toLocaleDateString()} - ${new Date(usage.period.end).toLocaleDateString()}` :
                    'This month'
                  }
                </span>
                <span className="font-medium">
                  {subscriptionInfo?.status === 'active' ? 'Active Subscription' : 
                   trialInfo?.is_trial ? `${trialInfo.remaining_days} days left` :
                   'Free Plan'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Products created</span>
                  <span>{currentUsage.products}/{usage?.products?.unlimited ? '∞' : usage?.products?.limit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Labels generated</span>
                  <span>{currentUsage.labels}/{usage?.labels?.unlimited ? '∞' : usage?.labels?.limit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>QR codes created</span>
                  <span>{usage?.qr_codes?.current_month || 0}/{usage?.qr_codes?.unlimited ? '∞' : usage?.qr_codes?.limit || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total products</span>
                  <span>{usage?.products?.total || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Usage warning based on real data */}
              {(usage_percentages?.products || 0) > 70 && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg hover:bg-warning/20 transition-colors animate-pulse">
                  <p className="font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {(usage_percentages?.products || 0) > 90 ? 'Upgrade urgently needed' : 'Consider upgrading'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You're using {Math.round(usage_percentages?.products || 0)}% of your {currentPlan.name} plan's product limit
                  </p>
                </div>
              )}
              
              {/* Trial expiration warning */}
              {trialInfo?.is_trial && trialInfo.remaining_days <= 7 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors">
                  <p className="font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Trial ending soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your trial expires in {trialInfo.remaining_days} days. Upgrade to continue using premium features.
                  </p>
                </div>
              )}
              
              {/* Subscription renewal reminder */}
              {subscriptionDetails?.remaining_days && subscriptionDetails.remaining_days <= 7 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors">
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Renewal reminder
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your {subscriptionInfo?.plan_name} subscription renews in {subscriptionDetails.remaining_days} days.
                  </p>
                </div>
              )}
              
              {/* Annual billing suggestion for paid users */}
              {subscriptionInfo?.status === 'active' && subscriptionInfo?.type !== 'annual' && (
                <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg hover:from-muted/70 hover:to-muted/50 transition-all duration-300">
                  <p className="font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    Save 20% with annual billing
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch to annual payments and save money on your {subscriptionInfo.plan_name} plan
                  </p>
                </div>
              )}
              
              {/* Upgrade suggestion for free users */}
              {currentPlan.name === 'Basic' && !trialInfo?.is_trial && (
                <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg hover:from-primary/20 hover:to-accent/20 transition-all duration-300">
                  <p className="font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Unlock premium features
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro or Enterprise for unlimited products and advanced features
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downgrade Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-full max-w-lg mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <TrendingDown className="w-5 h-5" />
                Downgrade Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Choose a plan to downgrade to. Changes will take effect at the end of your current billing period.
                </p>
                
                <div className="space-y-3">
                  {plans
                    .filter(plan => {
                      const currentPlanIndex = plans.findIndex(p => p.name === currentPlan.name)
                      const planIndex = plans.findIndex(p => p.name === plan.name)
                      return planIndex < currentPlanIndex
                    })
                    .map((plan) => (
                      <div 
                        key={plan.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedDowngradePlan(plan)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{plan.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              ${plan.price}/month • {plan.features?.length || 0} features
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${plan.price}</div>
                            <div className="text-sm text-muted-foreground">per month</div>
                          </div>
                        </div>
                        
                        {plan.features && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Included features:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {plan.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-green-500" />
                                  {feature}
                                </li>
                              ))}
                              {plan.features.length > 3 && (
                                <li className="text-xs">+{plan.features.length - 3} more features</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
                
                {plans.filter(plan => {
                  const currentPlanIndex = plans.findIndex(p => p.name === currentPlan.name)
                  const planIndex = plans.findIndex(p => p.name === plan.name)
                  return planIndex < currentPlanIndex
                }).length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No downgrade options available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      You're already on the lowest available plan.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => {
                      setShowDowngradeModal(false)
                      setSelectedDowngradePlan(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => {
                      if (selectedDowngradePlan) {
                        handleDowngradeSubscription(selectedDowngradePlan.id)
                      }
                    }}
                    disabled={isLoading || !selectedDowngradePlan}
                  >
                    {isLoading ? 'Processing...' : selectedDowngradePlan ? `Downgrade to ${selectedDowngradePlan.name}` : 'Select a Plan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
