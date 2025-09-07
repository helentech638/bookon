import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ClipboardDocumentIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TFCInstructionPanelProps {
  reference: string;
  deadline: Date;
  amount: number;
  instructions: string;
  payeeDetails: {
    name: string;
    reference: string;
    sortCode?: string;
    accountNumber?: string;
  };
  onCopyReference: () => void;
}

const TFCInstructionPanel: React.FC<TFCInstructionPanelProps> = ({
  reference,
  deadline,
  amount,
  instructions,
  payeeDetails,
  onCopyReference
}) => {
  const [copied, setCopied] = useState(false);
  
  const daysRemaining = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysRemaining <= 2;
  const isExpired = daysRemaining <= 0;

  const handleCopyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      onCopyReference();
      toast.success('Payment reference copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy reference');
    }
  };

  const formatDeadline = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <ExclamationTriangleIcon className="h-5 w-5" />
          Tax-Free Childcare Payment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Reference */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Payment Reference</h3>
            <Button
              onClick={handleCopyReference}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="bg-gray-100 p-3 rounded font-mono text-lg font-bold text-center">
            {reference}
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Use this exact reference when making your Tax-Free Childcare payment
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">£{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payee:</span>
              <span className="font-semibold">{payeeDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono text-sm">{payeeDetails.reference}</span>
            </div>
            {payeeDetails.sortCode && (
              <div className="flex justify-between">
                <span className="text-gray-600">Sort Code:</span>
                <span className="font-mono">{payeeDetails.sortCode}</span>
              </div>
            )}
            {payeeDetails.accountNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-mono">{payeeDetails.accountNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Deadline Warning */}
        <div className={`p-4 rounded-lg border ${
          isExpired 
            ? 'bg-red-50 border-red-200' 
            : isUrgent 
            ? 'bg-orange-50 border-orange-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isExpired ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            ) : isUrgent ? (
              <ClockIcon className="h-5 w-5 text-orange-600" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            )}
            <h3 className={`font-semibold ${
              isExpired ? 'text-red-800' : isUrgent ? 'text-orange-800' : 'text-green-800'
            }`}>
              Payment Deadline
            </h3>
          </div>
          <p className={`font-bold ${
            isExpired ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-green-700'
          }`}>
            {isExpired 
              ? 'Payment deadline has passed' 
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
            }
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Deadline: {formatDeadline(deadline)}
          </p>
          {isUrgent && !isExpired && (
            <p className="text-sm text-orange-700 mt-2 font-medium">
              ⚠️ Please make your payment immediately to secure your place
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-3">How to Pay</h3>
          <div className="prose prose-sm max-w-none">
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span>Log into your Tax-Free Childcare account at <a href="https://www.gov.uk/help-with-childcare-costs/tax-free-childcare" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">gov.uk</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span>Use the payment reference shown above: <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{reference}</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span>Make payment for the exact amount: <strong>£{amount.toFixed(2)}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span>Payment must be received by the deadline to secure your place</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Custom Instructions */}
        {instructions && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-3">Additional Instructions</h3>
            <div className="text-gray-700 whitespace-pre-line">
              {instructions}
            </div>
          </div>
        )}

        {/* Important Notes */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Your booking is reserved but not confirmed until payment is received</li>
            <li>• If payment is not received by the deadline, your booking will be automatically cancelled</li>
            <li>• You will receive email confirmation once payment is processed</li>
            <li>• Contact us immediately if you have any issues with your payment</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TFCInstructionPanel;
