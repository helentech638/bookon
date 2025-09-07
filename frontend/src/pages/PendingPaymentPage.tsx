import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ClipboardDocumentIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import TFCInstructionPanel from '../components/payment/TFCInstructionPanel';

interface TFCBookingData {
  id: string;
  reference: string;
  deadline: string;
  instructions: string;
  amount: number;
  status: string;
  daysRemaining: number;
  activity: string;
  venue: string;
  child: string;
  createdAt: string;
}

const PendingPaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<TFCBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBookingDetails(id);
    }
  }, [id]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/tfc/booking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const result = await response.json();
      setBooking(result.data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = () => {
    if (booking) {
      navigator.clipboard.writeText(booking.reference);
      toast.success('Payment reference copied to clipboard');
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this booking? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleContactSupport = () => {
    // Open email client or show contact information
    window.location.href = 'mailto:support@bookon.com?subject=TFC Payment Support';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
              <p className="text-gray-600 mb-4">{error || 'The booking you are looking for could not be found.'}</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deadline = new Date(booking.deadline);
  const isExpired = booking.daysRemaining <= 0;
  const isUrgent = booking.daysRemaining <= 2 && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Pending</h1>
          <p className="text-gray-600">Complete your Tax-Free Childcare payment to confirm your booking</p>
        </div>

        {/* Status Alert */}
        <Card className={`mb-6 ${
          isExpired 
            ? 'border-red-200 bg-red-50' 
            : isUrgent 
            ? 'border-orange-200 bg-orange-50' 
            : 'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
                          {isExpired ? (
              <XCircleIcon className="h-6 w-6 text-red-600" />
            ) : isUrgent ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
            ) : (
              <ClockIcon className="h-6 w-6 text-blue-600" />
            )}
              <div>
                <h3 className={`font-semibold ${
                  isExpired ? 'text-red-800' : isUrgent ? 'text-orange-800' : 'text-blue-800'
                }`}>
                  {isExpired 
                    ? 'Payment Deadline Expired' 
                    : isUrgent 
                    ? 'Payment Required Soon' 
                    : 'Payment Pending'
                  }
                </h3>
                <p className={`text-sm ${
                  isExpired ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-blue-700'
                }`}>
                  {isExpired 
                    ? 'Your booking may have been cancelled due to missed payment deadline'
                    : isUrgent 
                    ? `Only ${booking.daysRemaining} day${booking.daysRemaining !== 1 ? 's' : ''} remaining to make payment`
                    : `${booking.daysRemaining} days remaining to make payment`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Child</label>
                  <p className="text-gray-900">{booking.child}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Activity</label>
                  <p className="text-gray-900">{booking.activity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Venue</label>
                  <p className="text-gray-900">{booking.venue}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">£{booking.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Booking Date</label>
                  <p className="text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleCopyReference}
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copy Payment Reference
                  </Button>
                  
                  <Button 
                    onClick={handleContactSupport}
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    Contact Support
                  </Button>
                  
                  <Button 
                    onClick={handleCancelBooking}
                    variant="destructive" 
                    className="w-full"
                  >
                    Cancel Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Instructions */}
          <div className="lg:col-span-2">
            <TFCInstructionPanel
              reference={booking.reference}
              deadline={deadline}
              amount={booking.amount}
              instructions={booking.instructions}
              payeeDetails={{
                name: 'BookOn Platform',
                reference: 'BOOKON-TFC',
                sortCode: '20-00-00',
                accountNumber: '12345678'
              }}
              onCopyReference={handleCopyReference}
            />
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5 text-blue-600" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Payment Issues</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Having trouble with your Tax-Free Childcare payment? We're here to help.
                </p>
                <p className="text-sm text-gray-600">
                  Email: <a href="mailto:support@bookon.com" className="text-blue-600 hover:underline">support@bookon.com</a>
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Technical Support</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Need assistance with the booking system or have questions about your account?
                </p>
                <p className="text-sm text-gray-600">
                  Phone: <a href="tel:+441234567890" className="text-blue-600 hover:underline">0123 456 7890</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingPaymentPage;
