import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { 
  CreditCard, 
  Shield, 
  Lock, 
  User,
  Mail,
  AlertCircle,
  MapPin
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { paymentAPI } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { PaymentIntentResponse } from "@/types/api"
import { useLocation, useNavigate } from "react-router-dom"
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { StripeProvider } from "@/components/providers/StripeProvider"

// Main component that wraps the form with StripeProvider


// Separate component for the form content that uses Stripe hooks
function PaymentFormContent() {
  const { toast } = useToast()
  const { user, refreshUsage } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  
  // Get navigation state for different payment contexts
  const navigationState = location.state as {
    planId?: string;
    planName?: string;
    price?: number;
    period?: string;
    isUpgrade?: boolean;
    isUpdate?: boolean;
    currentPlan?: string;
    returnUrl?: string;
  } || {}
  
  const [formData, setFormData] = useState({
    email: user?.email || "",
    cardholderName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [paymentStep, setPaymentStep] = useState<'payment' | 'processing' | 'success'>('payment')
  const [isLoading, setIsLoading] = useState(true)
  const [cardError, setCardError] = useState<string | null>(null)

  // Get user's selected plan from their membership
  const userPlan = user?.membership_plan
  
  useEffect(() => {
    // Determine if we were sent here for an explicit upgrade or update
    const upgrading = !!navigationState.isUpgrade;
    const updatingMethod = !!navigationState.isUpdate;

    if (user) {
      // If user exists but no membership plan yet, wait a bit for complete data
      if (!userPlan) {
        const timeout = setTimeout(() => {
          setIsLoading(false)
        }, 3000)
        return () => clearTimeout(timeout)
      }

      // If the user is explicitly upgrading or updating payment method,
      // do NOT redirect away, even if on Basic or already paid.
      if (upgrading || updatingMethod) {
        setIsLoading(false)
        return
      }

      // Otherwise keep original behavior
      if (user.payment_status === 'paid' || userPlan?.name === 'Basic') {
        window.location.href = '/dashboard'
        return
      }

      setIsLoading(false)
    }
  }, [user, userPlan, navigationState.isUpgrade, navigationState.isUpdate])

  // Show loading while checking user status
  if (isLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading payment information...</p>
      </div>
    )
  }

  // If user exists but no membership plan data, show error
  if (!userPlan) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-red-600">Payment Setup Error</h1>
        <p className="text-muted-foreground">
          Unable to load your membership plan information. Please try refreshing the page or contact support.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // If user is on Basic plan, they shouldn't be here
  if (userPlan.name === 'Basic' && !navigationState.isUpgrade) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold">No Payment Required</h1>
        <p className="text-muted-foreground">
          You're on the Basic plan which includes a free trial. No payment is needed.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    )
  }



  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = "Please enter the cardholder name"
    }
    
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Please enter your address"
    }
    
    if (!formData.city.trim()) {
      newErrors.city = "Please enter your city"
    }
    
    if (!formData.state.trim()) {
      newErrors.state = "Please enter your state/province"
    }
    
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Please enter your postal code"
    }
    
    if (!formData.country) {
      newErrors.country = "Please select your country"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }



  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value
    
    if (field === "postalCode") {
      // Allow alphanumeric postal codes for international support
      formattedValue = value.replace(/[^a-zA-Z0-9\s-]/g, "").substring(0, 10)
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Stripe has not loaded yet. Please try again.",
        variant: "destructive",
      })
      return
    }
    
    if (!validateForm()) {
      return
    }
    
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast({
        title: "Payment Error",
        description: "Card element not found. Please refresh and try again.",
        variant: "destructive",
      })
      return
    }
    
    setIsProcessing(true)
    setPaymentStep('processing')
    setCardError(null)
    
    try {
      // Create payment method using Stripe Elements
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.cardholderName.trim(),
          email: formData.email,
          address: {
            line1: formData.addressLine1,
            line2: formData.addressLine2 || undefined,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            country: formData.country,
          },
        },
      })
      
      if (error) {
        throw new Error(error.message || 'Failed to create payment method')
      }
      
      if (!paymentMethod) {
        throw new Error('No payment method created')
      }
      
      let response;
      
      if (navigationState.isUpdate) {
        // Update payment method
        const updateData = {
          payment_method_id: paymentMethod.id,
          cardholder_name: formData.cardholderName,
          billing_address: {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            country: formData.country
          }
        }
        
        response = await paymentAPI.updatePaymentMethod(updateData)
        
        if (response.success) {
          await refreshUsage()
          
          toast({
            title: "Payment Method Updated!",
            description: "Your payment method has been successfully updated.",
          })
          
          // Redirect back to billing page or specified return URL
          const returnUrl = navigationState.returnUrl || '/billing'
          navigate(returnUrl)
          return
        }
      } else {
        // Create payment intent for subscription (upgrade or new subscription)
        const paymentData = {
          email: formData.email,
          cardholder_name: formData.cardholderName,
          billing_address: {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            country: formData.country
          },
          membership_plan_id: navigationState.planId ? parseInt(navigationState.planId) : userPlan.id,
          payment_method_id: paymentMethod.id,
          is_upgrade: navigationState.isUpgrade || false
        }
        
        response = await paymentAPI.createPaymentIntent(paymentData)
      }
      
      if (response.success) {
        // Simulate successful payment processing
        // In a real implementation, you would integrate with Stripe Elements here
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Refresh user data to get updated payment status
        await refreshUsage()
        
        console.log('[PaymentForm] Payment completed successfully')
        
        const successMessage = navigationState.isUpgrade ? 
          `You've successfully upgraded to the ${navigationState.planName} plan!` :
          `You've successfully subscribed to the ${navigationState.planName || userPlan.name} plan.`
        
        toast({
          title: "Payment Successful!",
          description: successMessage,
        })
        
        // Redirect to dashboard after successful payment
        navigate('/dashboard')
      } else {
        throw new Error(response.message || 'Payment failed')
      }
    } catch (error: any) {
      console.error('[PaymentForm] Payment failed:', error.message)
      setPaymentStep('payment')
      
      // Handle specific case where user already has this subscription
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already subscribed')) {
        toast({
          title: "Already Subscribed",
          description: error.response.data.message,
          variant: "default",
        })
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        toast({
          title: "Payment Failed",
          description: error.response?.data?.message || error.message || "There was an error processing your payment. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }



  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center p-2">
        <div className="w-full max-w-md mx-auto space-y-3" style={{width: '30%', minWidth: '400px', maxHeight: '95vh', overflowY: 'auto'}}>
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">
          {paymentStep === 'processing' ? 'Processing...' : 
           navigationState.isUpdate ? 'Update Payment Method' :
           navigationState.isUpgrade ? `Upgrade to ${navigationState.planName}` :
           'Complete Your Subscription'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {paymentStep === 'processing' ? 'Please wait while we process your request' : 
           navigationState.isUpdate ? 'Update your payment information' :
           navigationState.isUpgrade ? `Upgrade from ${navigationState.currentPlan} to ${navigationState.planName}` :
           `Complete payment for your ${userPlan.name} plan subscription`}
        </p>
      </div>

      {/* Payment Form */}
      <Card>
        <CardHeader className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <CardTitle className="text-base">Secure Payment</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Your payment information is encrypted and secure.
          </CardDescription>
          
          {/* Selected Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">
                {navigationState.isUpdate ? 'Payment Method Update' :
                 navigationState.planName ? `${navigationState.planName} Plan` :
                 `${userPlan.name} Plan`}
              </span>
              {!navigationState.isUpdate && (
                <span className="font-bold text-sm">
                  ${navigationState.price || userPlan.price}/month
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {navigationState.isUpdate ? 'Update your card information' :
               'Billed monthly • Cancel anytime'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="flex items-center gap-1 text-sm">
                <Mail className="h-3 w-3" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`h-8 text-sm ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <Separator className="my-1" />

            {/* Card Information */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <CreditCard className="h-3 w-3" />
                Card Information
              </Label>
              
              {/* Stripe Card Element */}
              <div className="border rounded-md p-3 bg-background">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '14px',
                        color: 'hsl(var(--foreground))',
                        fontFamily: 'inherit',
                        '::placeholder': {
                          color: 'hsl(var(--muted-foreground))',
                        },
                      },
                      invalid: {
                        color: 'hsl(var(--destructive))',
                      },
                    },
                    hidePostalCode: true,
                  }}
                  onChange={(event) => {
                    setCardError(event.error ? event.error.message : null)
                  }}
                />
              </div>
              {cardError && (
                <p className="text-xs text-destructive">{cardError}</p>
              )}
            </div>

                <Separator className="my-1" />

                {/* Cardholder Information */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    <User className="h-3 w-3" />
                    Cardholder Information
                  </Label>
                  
                  <div className="space-y-1">
                    <Input
                      placeholder="Full name on card"
                      value={formData.cardholderName}
                      onChange={(e) => handleInputChange("cardholderName", e.target.value)}
                      className={`h-8 text-sm ${errors.cardholderName ? "border-destructive" : ""}`}
                    />
                    {errors.cardholderName && (
                      <p className="text-xs text-destructive">{errors.cardholderName}</p>
                    )}
                  </div>
                </div>

                <Separator className="my-1" />

                {/* Billing Address */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-sm font-medium">
                    <MapPin className="h-3 w-3" />
                    Billing Address
                  </Label>

                  {/* Address Line 1 */}
                  <div className="space-y-1">
                    <Input
                      placeholder="Address Line 1"
                      value={formData.addressLine1}
                      onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                      className={`h-8 text-sm ${errors.addressLine1 ? "border-destructive" : ""}`}
                    />
                    {errors.addressLine1 && (
                      <p className="text-xs text-destructive">{errors.addressLine1}</p>
                    )}
                  </div>

                  {/* City and State */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className={`h-8 text-sm ${errors.city ? "border-destructive" : ""}`}
                      />
                      {errors.city && (
                        <p className="text-xs text-destructive">{errors.city}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Input
                        placeholder="State/Province"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        className={`h-8 text-sm ${errors.state ? "border-destructive" : ""}`}
                      />
                      {errors.state && (
                        <p className="text-xs text-destructive">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  {/* Postal Code and Country */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input
                        placeholder="Postal Code"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className={`h-8 text-sm ${errors.postalCode ? "border-destructive" : ""}`}
                      />
                      {errors.postalCode && (
                        <p className="text-xs text-destructive">{errors.postalCode}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                        <SelectTrigger className={`h-8 text-sm ${errors.country ? "border-destructive" : ""}`}>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="gb">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                          <SelectItem value="jp">Japan</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.country && (
                        <p className="text-xs text-destructive">{errors.country}</p>
                      )}
                    </div>
                  </div>
                </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
              <Lock className="h-3 w-3" />
              <span>Your payment information is encrypted and processed securely.</span>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-10 text-sm font-medium"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                navigationState.isUpdate ? 'Update Payment Method' :
                navigationState.isUpgrade ? `Upgrade to ${navigationState.planName} • $${navigationState.price}/month` :
                `Subscribe to ${userPlan.name} • $${userPlan.price}/month`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
    </AnimatedBackground>
  )
}

// Main component that wraps the form with StripeProvider
const PaymentForm: React.FC = () => {
  return (
    <StripeProvider>
      <PaymentFormContent />
    </StripeProvider>
  )
}

export default PaymentForm