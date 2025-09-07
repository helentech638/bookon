import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { CreditCardIcon, BuildingOfficeIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface TFCPaymentOptionProps {
  selected: boolean;
  onSelect: () => void;
  amount: number;
  venueId: string;
  onTFCSelected: (data: {
    reference: string;
    deadline: Date;
    instructions: string;
  }) => void;
  disabled?: boolean;
}

const TFCPaymentOption: React.FC<TFCPaymentOptionProps> = ({
  selected,
  onSelect,
  amount,
  venueId,
  onTFCSelected,
  disabled = false
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [tfcConfig, setTfcConfig] = useState<any>(null);

  const handleTFCSelection = async () => {
    if (disabled || isCreating) return;
    
    setIsCreating(true);
    try {
      // First, get TFC configuration for this venue
      const configResponse = await fetch(`/api/v1/tfc/config/${venueId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!configResponse.ok) {
        throw new Error('Failed to get TFC configuration');
      }

      const config = await configResponse.json();
      setTfcConfig(config.data);

      // Create TFC booking
      const response = await fetch('/api/v1/tfc/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venueId,
          amount,
          holdPeriod: config.data.holdPeriod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create TFC booking');
      }

      const result = await response.json();
      
      onTFCSelected(result.data);
      onSelect();
    } catch (error) {
      console.error('Error creating TFC booking:', error);
      // Handle error - show toast or error message
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 ${
      selected 
        ? 'border-blue-500 bg-blue-50 shadow-md' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <CardHeader 
        className="pb-3"
        onClick={() => !disabled && !selected && handleTFCSelection()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="tfc-payment"
              name="payment-method"
              checked={selected}
              onChange={() => !disabled && handleTFCSelection()}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <Label htmlFor="tfc-payment" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Tax-Free Childcare</span>
              </div>
            </Label>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>5 days to pay</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900 mb-1">Payment Instructions Required</p>
              <p>You'll receive detailed payment instructions with a unique reference number. Payment must be made within 5 days to secure your place.</p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-lg">£{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">Payment Method:</span>
              <span className="text-gray-900">Tax-Free Childcare Account</span>
            </div>
          </div>

          {isCreating && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Setting up TFC payment...</span>
            </div>
          )}

          {!tfcConfig && (
            <div className="text-xs text-gray-500">
              <p>• Booking will be held as pending payment</p>
              <p>• You'll receive email instructions with payment reference</p>
              <p>• Payment must be made within the deadline</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TFCPaymentOption;
