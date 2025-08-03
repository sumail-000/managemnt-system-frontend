import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Lock, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { paymentAPI } from "@/services/api"
import { SecurePaymentMethodForm } from "@/components/billing/SecurePaymentMethodForm"
import { StripeProvider } from "@/components/providers/StripeProvider"

interface PaymentMethodUpdateDialogProps {
  children: React.ReactNode
  currentPaymentMethod?: {
    id: number
    brand: string
    last_four: string
    expiry_month: number
    expiry_year: number
  }
  onUpdate?: (paymentMethodData: any) => void
}

export function PaymentMethodUpdateDialog({ 
  children, 
  currentPaymentMethod, 
  onUpdate 
}: PaymentMethodUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePaymentMethodSuccess = async (paymentMethodId: string) => {
    setIsLoading(true)
    
    try {
      // Send the payment method token to backend
      const response = await paymentAPI.updatePaymentMethod({
        payment_method_id: paymentMethodId
      })
      
      // Call the onUpdate callback with the response data
      onUpdate?.(response.data)
      
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been successfully updated.",
      })
      
      setOpen(false)
      
    } catch (error: any) {
      console.error('Payment method update error:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update payment method. Please try again.'
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentMethodError = (error: string) => {
    toast({
      title: "Update Failed",
      description: error,
      variant: "destructive"
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Update Card Details
          </DialogTitle>
          <DialogDescription>
            Update your card information securely. Your data is encrypted and protected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secured with 256-bit SSL encryption</span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Current Payment Method */}
          {currentPaymentMethod && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      {currentPaymentMethod.brand?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• {currentPaymentMethod.last_four}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires {currentPaymentMethod.expiry_month.toString().padStart(2, '0')}/{currentPaymentMethod.expiry_year.toString().slice(-2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Current</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Secure Payment Form */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              New Card Information
            </h3>
            
            <StripeProvider>
              <SecurePaymentMethodForm
                onSuccess={handlePaymentMethodSuccess}
                onError={handlePaymentMethodError}
                isLoading={isLoading}
                onCancel={() => setOpen(false)}
              />
            </StripeProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
