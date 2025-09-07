import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { ExclamationTriangleIcon, ClockIcon, CurrencyPoundIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface CancellationEligibility {
  eligible: boolean;
  refundAmount: number;
  creditAmount: number;
  adminFee: number;
  method: 'cash' | 'credit' | 'mixed';
  reason: string;
  breakdown: {
    totalPaid: number;
    sessionsUsed: number;
    sessionsRemaining: number;
    valuePerSession: number;
    refundableAmount: number;
    creditAmount: number;
    adminFee: number;
  };
}

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingDetails: {
    child: string;
    activity: string;
    venue: string;
    amount: number;
    activityDate: string;
    activityTime: string;
  };
  onCancellationComplete: () => void;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingDetails,
  onCancellationComplete
}) => {
  const [eligibility, setEligibility] = useState<CancellationEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      checkEligibility();
    }
  }, [isOpen, bookingId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/cancellations/check-eligibility/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check cancellation eligibility');
      }

      const result = await response.json();
      setEligibility(result.data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Failed to check cancellation eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleCancellation = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch('/api/v1/cancellations/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId,
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process cancellation');
      }

      const result = await response.json();
      
      toast.success('Cancellation processed successfully');
      onCancellationComplete();
      onClose();
    } catch (error) {
      console.error('Error processing cancellation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process cancellation');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            Cancel Booking
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Child:</span>
                <span className="ml-2 font-medium">{bookingDetails.child}</span>
              </div>
              <div>
                <span className="text-gray-600">Activity:</span>
                <span className="ml-2 font-medium">{bookingDetails.activity}</span>
              </div>
              <div>
                <span className="text-gray-600">Venue:</span>
                <span className="ml-2 font-medium">{bookingDetails.venue}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">{formatCurrency(bookingDetails.amount)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Date & Time:</span>
                <span className="ml-2 font-medium">
                  {formatDateTime(bookingDetails.activityDate, bookingDetails.activityTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking cancellation eligibility...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              <Button 
                onClick={checkEligibility} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Eligibility Results */}
          {eligibility && !loading && (
            <>
              {/* Eligibility Status */}
              <div className={`p-4 rounded-lg border ${
                eligibility.eligible 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {eligibility.eligible ? (
                    <ClockIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <h3 className={`font-semibold ${
                    eligibility.eligible ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {eligibility.eligible ? 'Cancellation Eligible' : 'Cancellation Not Eligible'}
                  </h3>
                </div>
                <p className={`text-sm ${
                  eligibility.eligible ? 'text-green-700' : 'text-red-700'
                }`}>
                  {eligibility.reason}
                </p>
              </div>

              {/* Refund Breakdown */}
              {eligibility.eligible && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-3">Refund Breakdown</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Paid:</span>
                      <span className="font-medium">{formatCurrency(eligibility.breakdown.totalPaid)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessions Remaining:</span>
                      <span className="font-medium">{eligibility.breakdown.sessionsRemaining}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Refundable Amount:</span>
                      <span className="font-medium">{formatCurrency(eligibility.breakdown.refundableAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admin Fee:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(eligibility.breakdown.adminFee)}</span>
                    </div>
                    
                    <hr className="border-gray-300" />
                    
                    {eligibility.refundAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-2">
                          <CreditCardIcon className="h-4 w-4" />
                          Cash Refund:
                        </span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(eligibility.refundAmount)}
                        </span>
                      </div>
                    )}
                    
                    {eligibility.creditAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 flex items-center gap-2">
                          <CurrencyPoundIcon className="h-4 w-4" />
                          Credit to Wallet:
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(eligibility.creditAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancellation Form */}
              {eligibility.eligible && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                      Reason for Cancellation *
                    </Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a reason for cancelling this booking..."
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Cancellation must be made at least 24 hours before the session</li>
                      <li>• Admin fee of £2.00 applies to all cancellations</li>
                      <li>• Card payments are refunded to the original payment method</li>
                      <li>• TFC/voucher payments are issued as wallet credit</li>
                      <li>• Credits expire after 12 months</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={processing}
            >
              {eligibility?.eligible ? 'Keep Booking' : 'Close'}
            </Button>
            
            {eligibility?.eligible && (
              <Button
                onClick={handleCancellation}
                disabled={processing || !reason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancellationModal;
