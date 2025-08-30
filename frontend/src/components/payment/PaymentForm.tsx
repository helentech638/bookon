import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { toast } from 'react-hot-toast';
import StripePayment from './StripePayment';

interface PaymentFormProps {
  amount: number;
  currency: string;
  bookingId: string;
  venueId?: string;
  activityName?: string;
  venueName?: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  currency,
  bookingId,
  venueId,
  activityName,
  venueName,
  onSuccess,
  onCancel,
}) => {
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    if (method === 'card') {
      setShowStripePayment(true);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    onSuccess(paymentIntentId);
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setShowStripePayment(false);
  };

  const handleCancel = () => {
    setShowStripePayment(false);
    onCancel();
  };

  if (showStripePayment) {
    return (
      <StripePayment
        amount={amount}
        currency={currency}
        bookingId={bookingId}
        venueId={venueId}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
          {activityName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Activity:</span>
              <span className="text-gray-900">{activityName}</span>
            </div>
          )}
          {venueName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Venue:</span>
              <span className="text-gray-900">{venueName}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-gray-900">
              {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: currency.toUpperCase(),
              }).format(amount)}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Select Payment Method</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handlePaymentMethodSelect('card')}
              className={`w-full p-4 border rounded-md text-left transition-colors ${
                selectedPaymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Credit or Debit Card</div>
                  <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePaymentMethodSelect('bank')}
              disabled
              className="w-full p-4 border border-gray-300 rounded-md text-left opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Bank Transfer</div>
                  <div className="text-sm text-gray-500">Coming soon</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium">Secure Payment</p>
              <p>Your payment information is encrypted and secure. We never store your card details.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handlePaymentMethodSelect('card')}
            className="flex-1"
          >
            Continue to Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
