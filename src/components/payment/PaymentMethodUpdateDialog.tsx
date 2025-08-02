import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Lock, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { paymentAPI } from "@/services/api"

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
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardholderName: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateCard = () => {
    const newErrors: Record<string, string> = {}

    // Card number validation (basic)
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 13) {
      newErrors.cardNumber = 'Please enter a valid card number'
    }

    // Expiry validation
    if (!cardData.expiry) {
      newErrors.expiry = 'Please enter a valid expiry date'
    } else {
      const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
      if (!expiryRegex.test(cardData.expiry)) {
        newErrors.expiry = 'Invalid expiry format (MM/YY)'
      } else {
        const [month, year] = cardData.expiry.split('/')
        const fullYear = 2000 + parseInt(year)
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        
        if (fullYear < currentYear || (fullYear === currentYear && parseInt(month) < currentMonth)) {
          newErrors.expiry = 'Card has expired'
        }
      }
    }

    // CVC validation
    if (!cardData.cvc || cardData.cvc.length < 3) {
      newErrors.cvc = 'Please enter a valid CVC'
    }

    // Cardholder name validation
    if (!cardData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardData({ ...cardData, cardNumber: formatted })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateCard()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Format data for backend API
      const paymentData = {
        card_number: cardData.cardNumber.replace(/\s/g, ''), // Remove spaces
        expiry_date: cardData.expiry,
        cvc: cardData.cvc,
        cardholder_name: cardData.cardholderName.trim()
      }
      
      // Call the backend API
      const response = await paymentAPI.updatePaymentMethod(paymentData)
      
      // Call the onUpdate callback with the response data
      onUpdate?.(response.data)
      
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been successfully updated.",
      })
      
      setOpen(false)
      
      // Reset form
      setCardData({
        cardNumber: '',
        expiry: '',
        cvc: '',
        cardholderName: ''
      })
      
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Card Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              New Card Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardholderName">Cardholder Name *</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={cardData.cardholderName}
                  onChange={(e) => setCardData({ ...cardData, cardholderName: e.target.value })}
                  className={errors.cardholderName ? 'border-destructive' : ''}
                />
                {errors.cardholderName && (
                  <p className="text-sm text-destructive mt-1">{errors.cardholderName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.cardNumber}
                  onChange={handleCardNumberChange}
                  className={errors.cardNumber ? 'border-destructive' : ''}
                  maxLength={19}
                />
                {errors.cardNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date *</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardData.expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4)
                      }
                      if (value.length <= 5) {
                        setCardData({ ...cardData, expiry: value })
                      }
                    }}
                    className={errors.expiry ? 'border-destructive' : ''}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC *</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cardData.cvc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 4) {
                        setCardData({ ...cardData, cvc: value })
                      }
                    }}
                    className={errors.cvc ? 'border-destructive' : ''}
                    maxLength={4}
                  />
                </div>
              </div>
              {errors.expiry && (
                <p className="text-sm text-destructive">{errors.expiry}</p>
              )}
              {errors.cvc && (
                <p className="text-sm text-destructive">{errors.cvc}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
