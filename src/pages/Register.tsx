import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AuthLayout } from "@/components/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { authAPI, membershipAPI } from '../services/api'
import { logService } from '@/services/logService'
import { Eye, EyeOff, Loader2 } from "lucide-react"

interface MembershipPlan {
  id: number
  name: string
  price: number
  features: string[]
}

export default function Register() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const { register, isLoading } = useAuth()
  const selectedPlanFromState = location.state?.selectedPlan || ""
  const selectedPlanFromURL = searchParams.get('plan') || ""
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([])
  
  // Debug state changes
  useEffect(() => {
    logService.debug('MembershipPlans state changed', {
      planCount: membershipPlans.length,
      plans: membershipPlans.map(p => ({ id: p.id, name: p.name }))
    }, 'Register')
  }, [membershipPlans])
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    taxId: "",
    planType: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePrivacy: false
  })

  // Set default plan based on navigation source
  useEffect(() => {
    const setDefaultPlan = () => {
      if (membershipPlans.length === 0) return
      
      let defaultPlanId = ""
      
      // Priority: state > URL params > default to basic
      const planSource = selectedPlanFromState || selectedPlanFromURL
      
      if (planSource) {
        // Find plan by name (from pricing section or URL)
        const selectedPlan = membershipPlans.find(plan => 
          plan.name.toLowerCase() === planSource.toLowerCase()
        )
        if (selectedPlan) {
          defaultPlanId = selectedPlan.id.toString()
        }
      } else {
        // Default to Basic plan for "Get Started" or "Free Trial" buttons
        const basicPlan = membershipPlans.find(plan => 
          plan.name.toLowerCase() === 'basic'
        )
        if (basicPlan) {
          defaultPlanId = basicPlan.id.toString()
        }
      }
      
      if (defaultPlanId && !formData.planType) {
        setFormData(prev => ({ ...prev, planType: defaultPlanId }))
      }
    }
    
    setDefaultPlan()
  }, [membershipPlans, selectedPlanFromState, selectedPlanFromURL, formData.planType])

  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        logService.info('Fetching membership plans', {}, 'Register')
        const response = await membershipAPI.getPlans()
        
        // Debug the response structure
        logService.debug('API response structure', {
          responseKeys: Object.keys(response),
          dataType: typeof response.data,
          dataIsArray: Array.isArray(response.data),
          dataLength: response.data?.length,
          responseIsArray: Array.isArray(response),
          responseLength: Array.isArray(response) ? response.length : 'not array'
        }, 'Register')
        
        // Extract plans from response - the API returns the array directly, not wrapped in data
        let plans = []
        if (Array.isArray(response)) {
          // Direct array response
          plans = response
        } else if (Array.isArray(response.data)) {
          // Wrapped in data property
          plans = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          // Nested data structure
          plans = response.data.data
        } else if (response.data && typeof response.data === 'object') {
          // Named properties
          plans = response.data.plans || response.data.membership_plans || []
        }
        
        logService.debug('Extracted plans', {
          plansType: typeof plans,
          plansIsArray: Array.isArray(plans),
          plansLength: plans?.length,
          firstPlan: plans[0]
        }, 'Register')
        
        setMembershipPlans(plans)
        logService.info('Successfully retrieved membership plans', {
          planCount: plans.length,
          plans: plans.map(p => ({ id: p.id, name: p.name }))
        }, 'Register')
      } catch (error) {
        logService.error('Failed to fetch membership plans', { error }, 'Register')
        setMembershipPlans([])
      }
    }
    
    fetchMembershipPlans()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    logService.info('Registration form submission started', {
      email: formData.email,
      name: `${formData.firstName} ${formData.lastName}`,
      company: formData.company,
      planType: formData.planType,
      timestamp: new Date().toISOString()
    }, 'Register');
    
    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      logService.warning('Registration password confirmation mismatch', {}, 'Register');
      setErrors({ confirmPassword: "Passwords do not match" })
      return
    }
    
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      logService.warning('Registration terms/privacy agreement missing', {
        agreeTerms: formData.agreeTerms,
        agreePrivacy: formData.agreePrivacy
      }, 'Register');
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms and privacy policy.",
        variant: "destructive",
      })
      return
    }
    
    try {
      const registrationData = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        company: formData.company,
        contact_number: formData.phone,
        tax_id: formData.taxId,
        membership_plan_id: parseInt(formData.planType)
      }
      
      logService.info('Sending registration data', {
        email: registrationData.email,
        name: registrationData.name,
        company: registrationData.company,
        membership_plan_id: registrationData.membership_plan_id
      }, 'Register');
      
      await register(registrationData)
      
      logService.info('Registration successful, showing success toast', {}, 'Register');
      
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      })
      
      // Navigation is handled by AuthContext based on payment requirements
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed. Please try again."
      
      logService.error('Registration failed', {
        email: formData.email,
        error: errorMessage,
        validationErrors: error.response?.data?.errors
      }, 'Register');
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      planType: value
    }))
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join FoodManager and streamline your food business"
    >
      <Card className="card-elevated">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.name ? "border-red-500" : ""}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Business Information */}
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                name="company"
                placeholder="Your Company Ltd."
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID (Optional)</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  placeholder="123-45-6789"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <Label htmlFor="planType">Membership Plan</Label>
              <Select onValueChange={handleSelectChange} value={formData.planType}>
                <SelectTrigger className={errors.membership_plan_id ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {membershipPlans && membershipPlans.length > 0 ? (
                    membershipPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - ${plan.price}/{plan.name === 'Basic' ? '14 days' : 'month'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading plans...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.membership_plan_id && (
                <p className="text-sm text-red-500 mt-1">{errors.membership_plan_id}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "border-red-500" : ""}
                  required
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeTerms: !!checked }))}
                required
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy"
                checked={formData.agreePrivacy}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreePrivacy: !!checked }))}
                required
              />
              <Label htmlFor="privacy" className="text-sm">
                I agree to the{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}