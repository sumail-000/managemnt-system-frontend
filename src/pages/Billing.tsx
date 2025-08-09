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
  CheckCircle2,
  Lock
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { billingAPI, paymentAPI, membershipAPI } from '@/services/api'
import { useNavigate } from "react-router-dom"
import { PaymentMethodUpdateDialog } from "@/components/payment/PaymentMethodUpdateDialog"

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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCancellationStatus, setShowCancellationStatus] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cancel' | null>(null)
  const [password, setPassword] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationInfo, setCancellationInfo] = useState<any>(null)
  const [cancellationStep, setCancellationStep] = useState<'initial' | 'password' | 'confirmed'>('initial')
  const [editingBilling, setEditingBilling] = useState(false)
  const [planRecommendations, setPlanRecommendations] = useState<any>(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
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
  
  // Sync autoRenew state with backend data
  useEffect(() => {
    if (subscriptionDetails?.auto_renew !== undefined) {
      setAutoRenew(subscriptionDetails.auto_renew)
    }
  }, [subscriptionDetails?.auto_renew])
  
  // Get current membership info from real API data
  const currentPlan = user?.membership_plan || { name: 'Basic', product_limit: 3, label_limit: 10, features: [] }
  
  // Fetch cancellation status on component mount
  useEffect(() => {
    const fetchCancellationStatus = async () => {
      try {
        const response = await paymentAPI.getCancellationStatus()
        if (response.success && response.data) {
          setCancellationInfo(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch cancellation status:', error)
      }
    }
    
    if (user?.payment_status !== 'expired' && currentPlan.name !== 'Basic') {
      fetchCancellationStatus()
    }
  }, [user?.payment_status, currentPlan.name])

  // Fetch plan recommendations on component mount
  useEffect(() => {
    fetchPlanRecommendations()
  }, [])
  const currentUsage = {
    products: usage?.products?.current_month || 0,
    labels: usage?.labels?.current_month || 0
  }
  
  // Use billing data from AuthContext (already destructured above)

  const handleCancelPlan = () => {
    setCancellationStep('initial')
    setCancellationReason('')
    setPassword('')
    setShowCancelModal(true)
  }

  const handleRequestCancellation = async () => {
    setIsLoading(true)
    try {
      const response = await paymentAPI.requestCancellation({ reason: cancellationReason })
      
      if (response.success) {
        if (response.requires_confirmation) {
          setCancellationStep('password')
          setCancellationInfo(response.cancellation_info)
        } else {
          // Trial cancellation - immediate
          await refreshUsage()
          setShowCancelModal(false)
          toast({
            title: "Trial Cancelled",
            description: response.message,
          })
        }
      } else {
        throw new Error(response.message || 'Failed to request cancellation')
      }
    } catch (error: any) {
      console.error('Request cancellation error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to request cancellation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmCancellation = async () => {
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
      const response = await paymentAPI.confirmCancellation({ password })
      
      if (response.success) {
        setCancellationStep('confirmed')
        setCancellationInfo(response.cancellation_info)
        setPassword('')
        
        toast({
          title: "Cancellation Confirmed",
          description: response.message,
        })
      } else {
        throw new Error(response.message || 'Failed to confirm cancellation')
      }
    } catch (error: any) {
      console.error('Confirm cancellation error:', error)
      
      // Handle specific error cases
      let errorMessage = "Invalid password or confirmation failed. Please try again."
      
      if (error.response?.status === 422) {
        // Password validation error - show user-friendly message
        errorMessage = error.response?.data?.message || "The password you entered is incorrect. Please check your password and try again."
      } else if (error.response?.status === 404) {
        errorMessage = "No pending cancellation request found. Please try again."
      } else if (error.response?.status === 500) {
        errorMessage = "A server error occurred. Please try again later or contact support."
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelCancellationRequest = async () => {
    setIsLoading(true)
    try {
      const response = await paymentAPI.cancelCancellationRequest()
      
      if (response.success) {
        setCancellationInfo(null)
        setShowCancelModal(false)
        setShowCancellationStatus(false)
        await refreshUsage()
        
        toast({
          title: "Cancellation Cancelled",
          description: response.message,
        })
      } else {
        throw new Error(response.message || 'Failed to cancel cancellation request')
      }
    } catch (error: any) {
      console.error('Cancel cancellation request error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel cancellation request. Please try again.",
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

  const fetchPlanRecommendations = async () => {
    try {
      setLoadingRecommendations(true)
      const response = await membershipAPI.getRecommendations()
      
      // Extract the actual recommendation data from the API response
      if (response.data && response.data.type) {
        setPlanRecommendations(response.data)
      } else {
        setPlanRecommendations(null)
      }
    } catch (error: any) {
      console.error('Failed to fetch plan recommendations:', error)
      setPlanRecommendations(null)
    } finally {
      setLoadingRecommendations(false)
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
        type: 'text/csv' 
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`
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

  const handlePaymentMethodUpdate = async (paymentMethodData: any) => {
    try {
      // paymentMethodData is the API response that contains the updated payment method data
      // The backend now returns the payment method data in the 'data' field
      const updatedPaymentMethod = paymentMethodData.data || paymentMethodData;
      
      const updatedPaymentMethods = paymentMethods.map(pm => 
        pm.is_default ? {
          ...pm,
          brand: updatedPaymentMethod.brand,
          last_four: updatedPaymentMethod.last_four,
          expiry_month: updatedPaymentMethod.expiry_month,
          expiry_year: updatedPaymentMethod.expiry_year,
          cardholder_name: updatedPaymentMethod.cardholder_name
        } : pm
      )
      
      setPaymentMethods(updatedPaymentMethods)
      
      // Refresh user data to sync with backend
      await refreshUsage()
      
      toast({
        title: "Success",
        description: "Payment method updated successfully!",
      })
      
    } catch (error) {
      console.error('Failed to update payment method:', error)
      toast({
        title: "Error",
        description: "Failed to update payment method. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAutoRenewChange = async (checked: boolean) => {
    setIsLoading(true)
    try {
      // Call API to update auto-renew setting
      const response = await paymentAPI.updateAutoRenew({ auto_renew: checked })
      
      if (response.success) {
        // Refresh user data to sync with backend - this will update autoRenew via useEffect
        await refreshUsage()
        
        toast({
          title: "Auto-renew Updated",
          description: response.message || `Auto-renew has been ${checked ? 'enabled' : 'disabled'}.`,
        })
      } else {
        throw new Error(response.message || 'Failed to update auto-renew setting')
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
    <div className="flex-1 animate-fade-in">
      <div className="container mx-auto px-6 py-8 max-w-6xl space-y-8">
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
          {/* Show cancellation status if there's a pending/confirmed cancellation */}
          {cancellationInfo && (cancellationInfo.status === 'pending' || cancellationInfo.status === 'confirmed') && (
            <Button 
              variant="outline" 
              onClick={() => setShowCancellationStatus(true)}
              className="hover-scale border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {cancellationInfo.status === 'pending' ? 'Cancellation Pending' : 
               `Cancelling in ${cancellationInfo.days_remaining} days`}
            </Button>
          )}
          
          {/* Show cancel button only if no pending cancellation */}
          {currentPlan.name !== 'Basic' && user?.payment_status !== 'expired' && 
           (!cancellationInfo || cancellationInfo.status === 'none') && (
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
                  {user?.payment_status === 'expired' && (
                    <Badge variant="destructive" className="ml-2">Cancelled</Badge>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {currentPlan.name === 'Basic' ? 'Free for 14 days' : 
                   currentPlan.name === 'Pro' ? '$79/month' : '$199/month'}
                </p>
              </div>
            </div>
            <div className="text-right animate-fade-in">
              <p className="text-sm text-muted-foreground">
                {user?.payment_status === 'expired' ? 'Subscription Status' : 'Next billing'}
              </p>
              <p className="font-medium">
                {user?.payment_status === 'expired' 
                  ? 'Cancelled'
                  : subscriptionDetails?.next_renewal_date 
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
                  disabled={currentPlan.name === 'Basic' || isLoading || user?.payment_status === 'expired'}
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
              <PaymentMethodUpdateDialog
                currentPaymentMethod={paymentMethods.find(pm => pm.is_default)}
                onUpdate={handlePaymentMethodUpdate}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover-scale"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </PaymentMethodUpdateDialog>
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
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="space-y-4 pr-2">
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
              
              {/* Plan Recommendations */}
              {planRecommendations && !loadingRecommendations && (
                <div className="space-y-3">
                  {planRecommendations.type === 'upgrade' && planRecommendations.recommended_plan && (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg hover:from-primary/20 hover:to-accent/20 transition-all duration-300 border border-primary/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-2 text-primary">
                            <Crown className="w-4 h-4" />
                            {planRecommendations.recommended_plan.name} Plan Recommended
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {planRecommendations.upgrade_reason}
                          </p>
                          <div className="mt-2 space-y-1">
                            {planRecommendations.recommended_plan.key_benefits?.slice(0, 2).map((benefit: string, index: number) => (
                              <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-600" />
                                {benefit}
                              </p>
                            ))}
                          </div>
                          {planRecommendations.savings_message && (
                            <p className="text-xs text-green-600 font-medium mt-2">
                              {planRecommendations.savings_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {planRecommendations.type === 'message' && planRecommendations.message && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="font-medium flex items-center gap-2 text-green-800 dark:text-green-200">
                        <Shield className="w-4 h-4" />
                        You're on the best plan!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {planRecommendations.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Upgrade suggestion for free users (fallback) */}
              {currentPlan.name === 'Basic' && !trialInfo?.is_trial && planRecommendations?.type !== 'upgrade' && (
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



      {/* 3-Step Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-full max-w-md mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {cancellationStep === 'initial' && 'Cancel Subscription'}
                {cancellationStep === 'password' && 'Confirm Cancellation'}
                {cancellationStep === 'confirmed' && 'Cancellation Scheduled'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1: Initial confirmation and reason */}
                {cancellationStep === 'initial' && (
                  <>
                    <p className="text-muted-foreground">
                      Are you sure you want to cancel your {currentPlan.name} subscription? 
                      This action will start a 3-day waiting period before your subscription ends.
                    </p>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">You'll lose access to:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {currentPlan.features?.slice(0, 3).map((feature, index) => (
                          <li key={`cancel-feature-${index}`} className="flex items-center gap-2">
                            <X className="w-3 h-3 text-destructive" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cancellation-reason">Reason for cancellation (optional)</Label>
                      <Input
                        id="cancellation-reason"
                        placeholder="Help us improve by sharing why you're cancelling..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        maxLength={500}
                      />
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
                        onClick={handleRequestCancellation}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Continue'}
                      </Button>
                    </div>
                  </>
                )}
                
                {/* Step 2: Password verification */}
                {cancellationStep === 'password' && (
                  <>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-orange-600" />
                        <h4 className="font-medium text-orange-800 dark:text-orange-200">Security Verification Required</h4>
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Please enter your password to confirm the cancellation request.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmCancellation()}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => {
                          setCancellationStep('initial')
                          setPassword('')
                        }}
                      >
                        Back
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={handleConfirmCancellation}
                        disabled={isLoading || !password}
                      >
                        {isLoading ? 'Verifying...' : 'Confirm Cancellation'}
                      </Button>
                    </div>
                  </>
                )}
                
                {/* Step 3: Cancellation confirmed */}
                {cancellationStep === 'confirmed' && (
                  <>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-green-800 dark:text-green-200">Cancellation Confirmed</h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your subscription will end in 3 days on {cancellationInfo?.effective_date}. 
                        You can still use all features until then.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Changed your mind?</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        You can cancel this cancellation request anytime during the 3-day waiting period.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancelCancellationRequest}
                        disabled={isLoading}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        {isLoading ? 'Processing...' : 'Cancel Cancellation Request'}
                      </Button>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => setShowCancelModal(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Cancellation Status Modal */}
      {showCancellationStatus && cancellationInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="w-full max-w-md mx-4 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                Cancellation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">
                    {cancellationInfo.status === 'pending' ? 'Cancellation Pending' : 'Cancellation Confirmed'}
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {cancellationInfo.status === 'pending' 
                      ? 'Your cancellation request is pending password confirmation.'
                      : `Your subscription will end in ${cancellationInfo.days_remaining} days on ${cancellationInfo.effective_date}.`
                    }
                  </p>
                  {cancellationInfo.reason && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                      <strong>Reason:</strong> {cancellationInfo.reason}
                    </p>
                  )}
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Changed your mind?</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    You can cancel this cancellation request anytime during the waiting period.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelCancellationRequest}
                    disabled={isLoading}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {isLoading ? 'Processing...' : 'Cancel Cancellation Request'}
                  </Button>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowCancellationStatus(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}
