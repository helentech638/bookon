import React, { useState } from 'react';
import { 
  ClipboardDocumentIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TFCConfig {
  enabled: boolean;
  providerName: string;
  providerNumber: string;
  holdPeriodDays: number;
  instructionText: string;
  bankDetails: {
    accountName: string;
    sortCode: string;
    accountNumber: string;
  };
}

interface TFCInstructionPanelProps {
  config: TFCConfig;
  paymentReference: string;
  amount: number;
  deadline: Date;
  onCopyReference: () => void;
  onProceed: () => void;
  onCancel: () => void;
}

const TFCInstructionPanel: React.FC<TFCInstructionPanelProps> = ({
  config,
  paymentReference,
  amount,
  deadline,
  onCopyReference,
  onProceed,
  onCancel
}) => {
  const [referenceCopied, setReferenceCopied] = useState(false);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(paymentReference);
    setReferenceCopied(true);
    onCopyReference();
    setTimeout(() => setReferenceCopied(false), 2000);
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

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  };

  const timeRemaining = getTimeRemaining(deadline);
  const isExpired = timeRemaining === 'Expired';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              Tax-Free Childcare Payment
            </h3>
            <p className="text-sm text-blue-700">
              Your booking is reserved pending payment
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-100"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Payment Reference */}
      <div className="bg-white border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Payment Reference
          </label>
          <button
            onClick={handleCopyReference}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            <span>{referenceCopied ? 'Copied!' : 'Copy Reference'}</span>
          </button>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 font-mono text-lg font-semibold text-gray-900">
          {paymentReference}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Use this reference when making your payment to HMRC
        </p>
      </div>

      {/* Payment Instructions */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Payment Instructions</h4>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Log into your <strong>Tax-Free Childcare account</strong> at{' '}
                <a 
                  href="https://www.gov.uk/apply-tax-free-childcare" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  gov.uk/apply-tax-free-childcare
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Make a payment to <strong>{config.providerName}</strong> using the reference above
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <p className="text-sm text-gray-900">
                Your booking will be confirmed automatically once payment is received
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Provider Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Provider Name:</span>
            <span className="font-medium text-gray-900">{config.providerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Provider Number:</span>
            <span className="font-medium text-gray-900">{config.providerNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Due:</span>
            <span className="font-medium text-gray-900">£{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Deadline Warning */}
      <div className={`border rounded-lg p-4 ${
        isExpired 
          ? 'bg-red-50 border-red-200' 
          : timeRemaining.includes('hour') || timeRemaining.includes('minute')
          ? 'bg-amber-50 border-amber-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isExpired ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          ) : timeRemaining.includes('hour') || timeRemaining.includes('minute') ? (
            <ClockIcon className="w-5 h-5 text-amber-600" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          )}
          <div>
            <p className={`font-medium ${
              isExpired 
                ? 'text-red-900' 
                : timeRemaining.includes('hour') || timeRemaining.includes('minute')
                ? 'text-amber-900'
                : 'text-green-900'
            }`}>
              {isExpired ? 'Payment Deadline Expired' : 'Payment Deadline'}
            </p>
            <p className={`text-sm ${
              isExpired 
                ? 'text-red-700' 
                : timeRemaining.includes('hour') || timeRemaining.includes('minute')
                ? 'text-amber-700'
                : 'text-green-700'
            }`}>
              {isExpired 
                ? 'This booking will be automatically cancelled' 
                : `Please pay by ${formatDeadline(deadline)} (${timeRemaining})`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Custom Instruction Text */}
      {config.instructionText && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Additional Instructions</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {config.instructionText}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-blue-200">
        <button
          onClick={onProceed}
          disabled={isExpired}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            isExpired
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isExpired ? 'Booking Expired' : 'I Understand, Proceed'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TFCInstructionPanel;