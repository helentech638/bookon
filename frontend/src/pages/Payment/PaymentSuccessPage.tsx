import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, CalendarIcon, EnvelopeIcon, ShareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface PaymentSuccessData {
  booking: {
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    activityDate: string;
    activityTime: string;
    activity: {
      title: string;
      venue: {
        name: string;
      };
    };
    child: {
      firstName: string;
      lastName: string;
    };
    parent: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  paymentSuccess: {
    id: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    receiptSent: boolean;
    calendarAdded: boolean;
  };
}

const PaymentSuccessPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<PaymentSuccessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMarkingReceipt, setIsMarkingReceipt] = useState(false);
  const [isMarkingCalendar, setIsMarkingCalendar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(buildApiUrl(`/payment-success/${bookingId}`), {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch payment details');
        const responseData = await response.json();
        setData(responseData.data);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchData();
    }
  }, [bookingId]);

  const handleMarkReceiptSent = async () => {
    if (!bookingId) return;
    
    setIsMarkingReceipt(true);
    
    try {
      const response = await fetch(buildApiUrl(`/payment-success/${bookingId}/receipt-sent`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (response.ok && data) {
        setData({
          ...data,
          paymentSuccess: {
            ...data.paymentSuccess,
            receiptSent: true
          }
        });
      }
    } catch (err) {
      console.error('Error marking receipt as sent:', err);
    } finally {
      setIsMarkingReceipt(false);
    }
  };

  const handleMarkCalendarAdded = async () => {
    if (!bookingId) return;
    
    setIsMarkingCalendar(true);
    
    try {
      const response = await fetch(buildApiUrl(`/payment-success/${bookingId}/calendar-added`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      
      if (response.ok && data) {
        setData({
          ...data,
          paymentSuccess: {
            ...data.paymentSuccess,
            calendarAdded: true
          }
        });
      }
    } catch (err) {
      console.error('Error marking calendar as added:', err);
    } finally {
      setIsMarkingCalendar(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!data) return;
    
    const { booking } = data;
    const startDate = new Date(`${booking.activityDate}T${booking.activityTime}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const eventDetails = {
      title: booking.activity.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      location: booking.activity.venue.name,
      description: `Activity booking for ${booking.child.firstName} ${booking.child.lastName}`
    };
    
    // Create calendar event URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}&location=${encodeURIComponent(eventDetails.location)}&details=${encodeURIComponent(eventDetails.description)}`;
    
    window.open(calendarUrl, '_blank');
    
    // Mark as added
    handleMarkCalendarAdded();
  };

  const handleSendReceipt = () => {
    // In a real implementation, this would trigger an email
    // For now, we'll just mark it as sent
    handleMarkReceiptSent();
  };

  const handleShare = () => {
    if (navigator.share && data) {
      navigator.share({
        title: 'Activity Booking Confirmation',
        text: `Successfully booked ${data.booking.activity.title} for ${data.booking.child.firstName} ${data.booking.child.lastName}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a]"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Payment details not found'}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { booking, paymentSuccess } = data;

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 -ml-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Payment Success</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Success Message */}
        <div className="text-center py-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600">
            Your booking has been confirmed and payment processed
          </p>
        </div>

        {/* Booking Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Activity</span>
              <span className="font-medium">{booking.activity.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Child</span>
              <span className="font-medium">{booking.child.firstName} {booking.child.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-medium">
                {new Date(booking.activityDate).toLocaleDateString('en-GB')} at {booking.activityTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Venue</span>
              <span className="font-medium">{booking.activity.venue.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-[#00806a]">£{booking.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium capitalize">{booking.paymentMethod}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
          <div className="space-y-4">
            {/* Add to Calendar */}
            <button
              onClick={handleAddToCalendar}
              disabled={paymentSuccess.calendarAdded || isMarkingCalendar}
              className={`w-full flex items-center justify-center p-4 border rounded-lg transition-colors ${
                paymentSuccess.calendarAdded
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'border-gray-200 hover:border-[#00806a] hover:bg-green-50'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">
                {paymentSuccess.calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
              </span>
            </button>

            {/* Send Receipt */}
            <button
              onClick={handleSendReceipt}
              disabled={paymentSuccess.receiptSent || isMarkingReceipt}
              className={`w-full flex items-center justify-center p-4 border rounded-lg transition-colors ${
                paymentSuccess.receiptSent
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'border-gray-200 hover:border-[#00806a] hover:bg-green-50'
              }`}
            >
              <EnvelopeIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">
                {paymentSuccess.receiptSent ? 'Receipt Sent' : 'Send Receipt'}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-[#00806a] hover:bg-green-50 transition-colors"
            >
              <ShareIcon className="h-5 w-5 mr-3" />
              <span className="font-medium">Share Booking</span>
            </button>
          </div>
        </Card>

        {/* Important Information */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Important Information</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Please arrive 10 minutes before the activity starts</p>
            <p>• Bring any required equipment or clothing</p>
            <p>• Contact the venue directly if you have any questions</p>
            <p>• You can view all your bookings in the dashboard</p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white py-3 text-lg font-medium"
          >
            View Dashboard
          </Button>
          
          <Button
            onClick={() => navigate('/activities')}
            variant="outline"
            className="w-full py-3 text-lg font-medium"
          >
            Book Another Activity
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
