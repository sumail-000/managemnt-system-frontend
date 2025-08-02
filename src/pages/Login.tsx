import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { AuthLayout } from "@/components/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [sessionExpired, setSessionExpired] = useState(false)
  const [fromPayment, setFromPayment] = useState(false)

  // Check for session expiration and registration success on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const reason = urlParams.get('reason')
    const registrationSuccess = urlParams.get('registration')
    const redirect = urlParams.get('redirect')
    const sessionExpiredParam = urlParams.get('sessionExpired')
    const paymentSessionExpired = localStorage.getItem('payment_session_expired')
    
    if (registrationSuccess === 'success') {
      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Please log in to continue.",
        variant: "default",
      })
    }
    
    // Handle payment page redirects
    if (redirect === 'payment') {
      setFromPayment(true)
      if (sessionExpiredParam === 'true') {
        setSessionExpired(true)
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again to continue with your payment.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the payment page.",
          variant: "default",
        })
      }
    }
    
    if (reason === 'session_expired' || paymentSessionExpired) {
      setSessionExpired(true)
      localStorage.removeItem('payment_session_expired')
      
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again to continue.",
        variant: "destructive",
      })
    }
  }, [location.search, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    console.log('[LOGIN] Form submission started', {
      email: formData.email,
      timestamp: new Date().toISOString()
    });
    
    try {
      await login(formData.email, formData.password)
      
      console.log('[LOGIN] Login successful, showing success toast');
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      })
      
      console.log('[LOGIN] Login successful, AuthContext will handle redirection');
      // Note: AuthContext.login() handles all redirection logic based on payment status
    } catch (error: any) {
      const errorMessage = error.message || "Login failed. Please try again."
      
      console.error('[LOGIN] Login failed', {
        email: formData.email,
        error: errorMessage,
        validationErrors: error.response?.data?.errors
      });
      
      toast({
        title: "Login Failed",
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
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your FoodManager account"
    >
      <Card className="card-elevated">
        <CardContent className="p-6">
          {sessionExpired && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-orange-50 border border-orange-200 rounded-md text-orange-800 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Your session expired{fromPayment ? ' during payment' : ''}. Please log in to continue.</span>
            </div>
          )}
          {fromPayment && !sessionExpired && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Please log in to continue with your payment.</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
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
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}