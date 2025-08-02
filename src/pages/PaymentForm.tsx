import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lock, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PaymentForm() {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    country: 'us',
    addressLine1: '',
    addressLine2: '',
    city: '',
    zip: '',
    state: ''
  })

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

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '')
    }
    return v
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value)
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4)
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

  const getCardType = (number: string) => {
    const firstDigit = number.replace(/\s/g, '')[0]
    if (firstDigit === '4') return 'visa'
    if (firstDigit === '5' || firstDigit === '2') return 'mastercard'
    if (firstDigit === '3') return 'amex'
    return 'generic'
  }

  const renderCardIcons = () => {
    const cardType = getCardType(formData.cardNumber)
    return (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
        <div className={`w-8 h-5 rounded text-xs flex items-center justify-center text-white font-bold ${cardType === 'visa' ? 'bg-blue-600' : 'bg-gray-300'}`}>
          VISA
        </div>
        <div className={`w-8 h-5 rounded text-xs flex items-center justify-center text-white font-bold ${cardType === 'mastercard' ? 'bg-red-500' : 'bg-gray-300'}`}>
          MC
        </div>
        <div className={`w-8 h-5 rounded text-xs flex items-center justify-center text-white font-bold ${cardType === 'amex' ? 'bg-blue-500' : 'bg-gray-300'}`}>
          AE
        </div>
        <div className={`w-8 h-5 rounded-full ${cardType === 'generic' ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center`}>
          <CreditCard className="w-3 h-3 text-white" />
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated.",
      })
    } catch (error) {
      toast({
        title: "Payment Failed", 
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="mx-auto" style={{ width: '45%', height: '80vh' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete payment for your Pro plan subscription
          </p>
        </div>
        
        <Card className="border shadow-lg bg-card/95 backdrop-blur-sm h-full">
          <CardContent className="p-6 h-full overflow-y-auto">
            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Secure Payment</span>
            </div>
            
            {/* Plan Summary */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Pro Plan</h3>
                  <p className="text-xs text-muted-foreground">Billed monthly • Cancel anytime</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground">$79.00</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Information */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Card Information
                </Label>
                
                <div className="space-y-3">
                      <div className="relative">
                        <Input
                          placeholder="1234 1234 1234 1234"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          className="pr-24 font-mono h-10 text-sm bg-background/50"
                          maxLength={19}
                          required
                        />
                        {renderCardIcons()}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="MM / YY"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className="font-mono h-10 text-sm bg-background/50"
                          maxLength={5}
                          required
                        />
                        <div className="relative">
                          <Input
                            placeholder="CVC"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            className="font-mono pr-10 h-10 text-sm bg-background/50"
                            maxLength={4}
                            required
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground font-bold">?</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Name on card */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2">Cardholder Information</Label>
                <Input
                  placeholder="Full name on card"
                  value={formData.nameOnCard}
                  onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                  className="h-10 text-sm bg-background/50"
                  required
                />
              </div>

              {/* Billing address */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2">Billing Address</Label>
                
                <div className="space-y-3">
                      <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                        <SelectTrigger className="h-10 text-sm bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                          <SelectItem value="de">Germany</SelectItem>
                          <SelectItem value="fr">France</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Address line 1"
                        value={formData.addressLine1}
                        onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                        className="h-10 text-sm bg-background/50"
                        required
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="h-10 text-sm bg-background/50"
                          required
                        />
                        <Input
                          placeholder="ZIP"
                          value={formData.zip}
                          onChange={(e) => handleInputChange('zip', e.target.value)}
                          className="h-10 text-sm bg-background/50"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Subscribe to Pro Plan
                      </div>
                    )}
                  </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Secure SSL encrypted payment</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}