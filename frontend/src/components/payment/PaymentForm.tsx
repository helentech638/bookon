import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { toast } from 'react-hot-toast';
import StripePayment from './StripePayment';
import TFCPaymentOption from './TFCPaymentOption';
import { CreditCardIcon, BuildingOfficeIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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

interface WalletBalance {
  totalCredits: number;
  availableCredits: number;
  usedCredits: number;
  expiredCredits: number;
  creditsByProvider: Record<string, number>;
  credits: any[];
}

interface TFCConfig {
  enabled: boolean;
  holdPeriod: number;
  instructions: string;
  payeeDetails: {
    name: string;
    reference: string;
    sortCode: string;
    accountNumber: string;
  };
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [tfcConfig, setTfcConfig] = useState<TFCConfig | null>(null);
  const [useWalletCredit, setUseWalletCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tfcData, setTfcData] = useState<any>(null);

  useEffect(() => {
    fetchPaymentOptions();
  }, [venueId]);

  const fetchPaymentOptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch wallet balance
      const walletResponse = await fetch('/api/v1/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWalletBalance(walletData.data);
      }

      // Fetch TFC configuration if venue is provided
      if (venueId) {
        const tfcResponse = await fetch(`/api/v1/tfc/config/${venueId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (tfcResponse.ok) {
          const tfcData = await tfcResponse.json();
          setTfcConfig(tfcData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching payment options:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleTFCSelected = (data: any) => {
    setTfcData(data);
    // Redirect to pending payment page
    window.location.href = `/pending-payment/${bookingId}`;
  };

  const handleWalletCreditChange = (useCredit: boolean, amount: number) => {
    setUseWalletCredit(useCredit);
    setCreditAmount(amount);
  };

  const calculateFinalAmount = () => {
    if (useWalletCredit && walletBalance) {
      const creditToUse = Math.min(creditAmount, walletBalance.availableCredits, amount);
      return Math.max(0, amount - creditToUse);
    }
    return amount;
  };

  const finalAmount = calculateFinalAmount();

  if (showStripePayment) {
    return (
      <StripePayment
        amount={finalAmount}
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

        {/* Wallet Credits Section */}
        {walletBalance && walletBalance.availableCredits > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-900">Wallet Credits Available</h3>
              <span className="text-lg font-bold text-green-700">
                £{walletBalance.availableCredits.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useWalletCredit"
                checked={useWalletCredit}
                onChange={(e) => handleWalletCreditChange(e.target.checked, Math.min(creditAmount, walletBalance.availableCredits))}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="useWalletCredit" className="text-sm text-green-800">
                Use wallet credits for this payment
              </label>
            </div>
            {useWalletCredit && (
              <div className="mt-3">
                <label htmlFor="creditAmount" className="block text-sm font-medium text-green-800 mb-1">
                  Amount to use (£{Math.min(creditAmount, walletBalance.availableCredits, amount).toFixed(2)})
                </label>
                <input
                  type="range"
                  id="creditAmount"
                  min="0"
                  max={Math.min(walletBalance.availableCredits, amount)}
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => handleWalletCreditChange(true, parseFloat(e.target.value))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-green-600 mt-1">
                  <span>£0</span>
                  <span>£{Math.min(walletBalance.availableCredits, amount).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Select Payment Method</h3>
          <div className="space-y-3">
            {/* Card Payment */}
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
                  <CreditCardIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Credit or Debit Card</div>
                  <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                  {finalAmount < amount && (
                    <div className="text-sm text-green-600 mt-1">
                      Final amount: £{finalAmount.toFixed(2)} (after credits)
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    £{finalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </button>

            {/* TFC Payment */}
            {tfcConfig && tfcConfig.enabled && (
              <TFCPaymentOption
                selected={selectedPaymentMethod === 'tfc'}
                onSelect={() => handlePaymentMethodSelect('tfc')}
                amount={finalAmount}
                venueId={venueId || ''}
                onTFCSelected={handleTFCSelected}
                disabled={loading}
              />
            )}
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
          {selectedPaymentMethod === 'card' && (
            <Button
              type="button"
              onClick={() => handlePaymentMethodSelect('card')}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Loading...' : `Pay £${finalAmount.toFixed(2)}`}
            </Button>
          )}
          {selectedPaymentMethod === 'tfc' && (
            <Button
              type="button"
              onClick={() => handlePaymentMethodSelect('tfc')}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Creating TFC Booking...' : `Create TFC Booking (£${finalAmount.toFixed(2)})`}
            </Button>
          )}
          {!selectedPaymentMethod && (
            <Button
              type="button"
              disabled
              className="flex-1 opacity-50"
            >
              Select Payment Method
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
