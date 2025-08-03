import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface SecurePaymentMethodFormProps {
  onSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      backgroundColor: 'transparent',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true,
};

export function SecurePaymentMethodForm({ 
  onSuccess, 
  onError, 
  isLoading = false,
  onCancel 
}: SecurePaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found. Please refresh and try again.');
      return;
    }

    if (!cardholderName.trim()) {
      onError('Please enter the cardholder name.');
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      // Create payment method using Stripe Elements
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName.trim(),
        },
      });

      if (error) {
        onError(error.message || 'Failed to create payment method');
      } else if (paymentMethod) {
        onSuccess(paymentMethod.id);
      }
    } catch (err) {
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardholder-name">Cardholder Name</Label>
        <Input
          id="cardholder-name"
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Enter cardholder name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Card Details</Label>
        <div className="border rounded-md p-3 bg-background">
          <CardElement 
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <Alert variant="destructive">
            <AlertDescription>{cardError}</AlertDescription>
          </Alert>
        )}
      </div>

      {onCancel ? (
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={processing || isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={!stripe || processing || isLoading}
          >
            {processing || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Update Card'
            )}
          </Button>
        </div>
      ) : (
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || processing || isLoading}
        >
          {processing || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Update Payment Method'
          )}
        </Button>
      )}
    </form>
  );
}

export default SecurePaymentMethodForm;