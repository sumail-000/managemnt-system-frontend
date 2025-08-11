import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AuthLayout } from "@/components/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { authAPI } from "@/services/api"
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, CheckCircle, Shield } from "lucide-react"
import { useNotifications } from "@/contexts/NotificationsContext"
type ResetStep = 'email' | 'otp' | 'password'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState<ResetStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  // Component lifecycle logging
  useEffect(() => {
    console.log('[RESET_PASSWORD] Component mounted', {
      initialStep: currentStep,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
    
    return () => {
      console.log('[RESET_PASSWORD] Component unmounting', {
        finalStep: currentStep,
        timestamp: new Date().toISOString()
      })
    }
  }, [])
  
  // Step change logging
  useEffect(() => {
    console.log('[RESET_PASSWORD] Step changed', {
      newStep: currentStep,
      timestamp: new Date().toISOString()
    })
  }, [currentStep])

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    
    console.log('[RESET_PASSWORD] OTP submission started', { 
      email, 
      otpLength: otp.length, 
      step: currentStep 
    })
    
    if (!otp || otp.length !== 6) {
      console.warn('[RESET_PASSWORD] OTP validation failed', { 
        otpProvided: !!otp, 
        otpLength: otp.length 
      })
      setErrors({ otp: "Please enter a valid 6-digit code" })
      setIsLoading(false)
      return
    }
    
    try {
      console.log('[RESET_PASSWORD] Verifying OTP', { email, otpLength: otp.length })
      await authAPI.verifyOtp({ email, otp })
      
      console.log('[RESET_PASSWORD] OTP verified successfully', { 
        email, 
        nextStep: 'password' 
      })
      
      setCurrentStep('password')
      toast({
        title: "OTP Verified!",
        description: "Please enter your new password.",
      })
    } catch (error: any) {
      console.error('[RESET_PASSWORD] OTP verification failed', {
        email,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      })
      
      toast({
        title: "Invalid OTP",
        description: error.response?.data?.message || "The verification code is invalid or expired.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  // Step 1: Send OTP to email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    
    console.log('[RESET_PASSWORD] Email submission started', { email, step: currentStep })
    
    if (!email) {
      console.warn('[RESET_PASSWORD] Email validation failed - empty email')
      setErrors({ email: "Email is required" })
      setIsLoading(false)
      return
    }
    
    try {
      console.log('[RESET_PASSWORD] Sending OTP request', { email })
      const response = await authAPI.sendPasswordResetOtp(email)
      
      console.log('[RESET_PASSWORD] OTP sent successfully', { 
        email, 
        nextStep: 'otp'
      })
      
      setCurrentStep('otp')
      toast({
        title: "OTP Sent!",
        description: "Check your email for the 6-digit verification code.",
      })
    } catch (error: any) {
      console.error('[RESET_PASSWORD] Failed to send OTP', {
        email,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      })
      
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send verification code.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password step handlers
  const validatePassword = (password: string) => {
    const errors: string[] = []
    if (password.length < 8) errors.push("at least 8 characters")
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter")
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter")
    if (!/\d/.test(password)) errors.push("one number")
    return errors
  }

  // Password requirements for validation display
  const passwordRequirements = [
    { text: "At least 8 characters", met: formData.password.length >= 8 },
    { text: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "One lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "One number", met: /\d/.test(formData.password) }
  ]

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    console.log('[RESET_PASSWORD] Password reset submission started', { 
      email, 
      step: currentStep,
      passwordLength: formData.password.length,
      passwordsMatch: formData.password === formData.confirmPassword
    })
    
    const passwordErrors = validatePassword(formData.password)
    if (passwordErrors.length > 0) {
      console.warn('[RESET_PASSWORD] Password validation failed', { 
        email, 
        errors: passwordErrors 
      })
      setErrors({ password: `Password must contain ${passwordErrors.join(", ")}` })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      console.warn('[RESET_PASSWORD] Password confirmation mismatch', { email })
      setErrors({ confirmPassword: "Passwords do not match" })
      return
    }

    setIsLoading(true)
    
    try {
      console.log('[RESET_PASSWORD] Submitting password reset', { email })
      await authAPI.resetPassword({
        otp,
        email,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      })
      
      console.log('[RESET_PASSWORD] Password reset completed successfully', { 
        email,
        redirectingTo: '/login'
      })
      
      toast({
        title: "Password reset successful!",
        description: "You can now login with your new password.",
      })

      // Record security notification; stores pending by email when not authenticated
      try {
        await addNotification(
          {
            type: "security.password_reset",
            title: "Password changed",
            message: `Password was reset for ${email}`,
            metadata: { email },
            link: "/login"
          },
          { userEmail: email }
        )
      } catch {}

      navigate("/login")
    } catch (error: any) {
      console.error('[RESET_PASSWORD] Password reset failed', {
        email,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      })
      
      toast({
        title: "Reset Failed",
        description: error.response?.data?.message || "Failed to reset password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
                  Sending Code...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        )
        
      case 'otp':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit code to {email}
              </p>
            </div>
            
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  required
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>
              
              <Button 
                type="submit" 
                variant="gradient" 
                size="lg" 
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setCurrentStep('email')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Email
              </Button>
            </form>
          </div>
        )
        
      case 'password':
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your new password for {email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  className={errors.password ? "border-red-500" : ""}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Password requirements:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle 
                        className={`h-3 w-3 ${req.met ? 'text-green-500' : 'text-muted-foreground'}`} 
                      />
                      <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
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
                  Resetting Password...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setCurrentStep('otp')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Verification
            </Button>
          </form>
        )
        
      default:
        return null
    }
  }



  return (
    <AuthLayout 
      title={
        currentStep === 'email' ? 'Forgot Password' :
        currentStep === 'otp' ? 'Enter Verification Code' :
        'Reset Password'
      }
      subtitle={
        currentStep === 'email' ? 'Enter your email to receive a verification code' :
        currentStep === 'otp' ? 'Check your email for the 6-digit code' :
        'Create a new password for your account'
      }
    >
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                {currentStep === 'email' && 'Forgot Password'}
                {currentStep === 'otp' && 'Enter Verification Code'}
                {currentStep === 'password' && 'Reset Password'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {currentStep === 'email' && 'Enter your email to receive a verification code'}
                {currentStep === 'otp' && 'Check your email for the 6-digit code'}
                {currentStep === 'password' && 'Create a new password for your account'}
              </p>
            </div>
            
            {getContent()}
            
            {currentStep === 'email' && (
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}