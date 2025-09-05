import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Booking {
  id: string;
  activity_name: string;
  venue_name: string;
  child_name: string;
  start_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  activity: {
    id: string;
    title: string;
    description: string;
    price: number;
    max_capacity: number;
    current_capacity: number;
  };
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  child: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface BookingActionsProps {
  booking: Booking;
  onActionComplete: () => void;
  className?: string;
}

const BookingActions: React.FC<BookingActionsProps> = ({ 
  booking, 
  onActionComplete, 
  className = '' 
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [amendmentNotes, setAmendmentNotes] = useState('');

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const canReschedule = booking.status === 'confirmed';
  const canAmend = booking.status === 'pending' || booking.status === 'confirmed';

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      const token = authService.getToken();
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(buildApiUrl(`/bookings/${booking.id}/cancel`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason,
          refundRequested: true
        }),
      });

      if (response.ok) {
        toast.success('Booking cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        onActionComplete();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to cancel booking');
      }
    } catch (error) {
      toast.error('Error cancelling booking');
      console.error('Error cancelling booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleBooking = async (newDate: string, newTime: string) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(buildApiUrl(`/bookings/${booking.id}/reschedule`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newDate,
          newTime,
          notes: amendmentNotes
        }),
      });

      if (response.ok) {
        toast.success('Booking rescheduled successfully');
        setShowRescheduleModal(false);
        setAmendmentNotes('');
        onActionComplete();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to reschedule booking');
      }
    } catch (error) {
      toast.error('Error rescheduling booking');
      console.error('Error rescheduling booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmendBooking = async (amendmentData: any) => {
    setLoading(true);
    try {
      const token = authService.getToken();
      
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(buildApiUrl(`/bookings/${booking.id}/amend`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...amendmentData,
          notes: amendmentNotes
        }),
      });

      if (response.ok) {
        toast.success('Booking amended successfully');
        setShowAmendModal(false);
        setAmendmentNotes('');
        onActionComplete();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to amend booking');
      }
    } catch (error) {
      toast.error('Error amending booking');
      console.error('Error amending booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      case 'completed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* View Details Button - Always available */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          // This would typically open a detail view modal
          toast('View booking details', { icon: 'ℹ️' });
        }}
      >
        <InformationCircleIcon className="h-4 w-4 mr-1" />
        Details
      </Button>

      {/* Reschedule Button - Only for confirmed bookings */}
      {canReschedule && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRescheduleModal(true)}
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
          Reschedule
        </Button>
      )}

      {/* Amend Button - For pending and confirmed bookings */}
      {canAmend && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAmendModal(true)}
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Amend
        </Button>
      )}

      {/* Cancel Button - For pending and confirmed bookings */}
      {canCancel && (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:text-red-700"
          onClick={() => setShowCancelModal(true)}
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      )}

      {/* Status Display */}
      <div className={`flex items-center ${getStatusColor(booking.status)}`}>
        {getStatusIcon(booking.status)}
        <span className="ml-1 text-sm font-medium capitalize">
          {booking.status}
        </span>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Booking"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Cancellation Policy</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Cancellations made within 24 hours of the activity may not be eligible for a full refund.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel your booking for <strong>{booking.activity_name}</strong>?
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Please provide a reason for cancellation..."
                required
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Activity:</strong> {booking.activity_name}</p>
              <p><strong>Date:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {booking.start_time} - {booking.end_time}</p>
              <p><strong>Amount:</strong> £{booking.total_amount.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
              }}
              disabled={loading}
            >
              Keep Booking
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelBooking}
              disabled={loading || !cancelReason.trim()}
            >
              {loading ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Booking"
      >
        <RescheduleForm
          booking={booking}
          onSubmit={handleRescheduleBooking}
          onCancel={() => {
            setShowRescheduleModal(false);
            setAmendmentNotes('');
          }}
          notes={amendmentNotes}
          onNotesChange={setAmendmentNotes}
          loading={loading}
        />
      </Modal>

      {/* Amend Modal */}
      <Modal
        isOpen={showAmendModal}
        onClose={() => setShowAmendModal(false)}
        title="Amend Booking"
        size="lg"
      >
        <AmendForm
          booking={booking}
          onSubmit={handleAmendBooking}
          onCancel={() => {
            setShowAmendModal(false);
            setAmendmentNotes('');
          }}
          notes={amendmentNotes}
          onNotesChange={setAmendmentNotes}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

// Reschedule Form Component
interface RescheduleFormProps {
  booking: Booking;
  onSubmit: (newDate: string, newTime: string) => void;
  onCancel: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  loading: boolean;
}

const RescheduleForm: React.FC<RescheduleFormProps> = ({ 
  booking, 
  onSubmit, 
  onCancel, 
  notes, 
  onNotesChange, 
  loading 
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDate || !newTime) {
      toast.error('Please select both date and time');
      return;
    }

    await onSubmit(newDate, newTime);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Current Booking</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Activity:</strong> {booking.activity_name}</p>
          <p><strong>Date:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {booking.start_time} - {booking.end_time}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Date
          </label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Time
          </label>
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Any special requests or notes for the reschedule..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !newDate || !newTime}
        >
          {loading ? 'Rescheduling...' : 'Reschedule Booking'}
        </Button>
      </div>
    </form>
  );
};

// Amend Form Component
interface AmendFormProps {
  booking: Booking;
  onSubmit: (amendmentData: any) => void;
  onCancel: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  loading: boolean;
}

const AmendForm: React.FC<AmendFormProps> = ({ 
  booking, 
  onSubmit, 
  onCancel, 
  notes, 
  onNotesChange, 
  loading 
}) => {
  const [amendments, setAmendments] = useState({
    childId: booking.child.id,
    specialRequirements: '',
    dietaryRestrictions: '',
    medicalNotes: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(amendments);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Current Booking Details</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Activity:</strong> {booking.activity_name}</p>
          <p><strong>Venue:</strong> {booking.venue_name}</p>
          <p><strong>Date:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {booking.start_time} - {booking.end_time}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requirements
          </label>
          <textarea
            value={amendments.specialRequirements}
            onChange={(e) => setAmendments(prev => ({ ...prev, specialRequirements: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Any special requirements or accommodations needed..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Restrictions
          </label>
          <textarea
            value={amendments.dietaryRestrictions}
            onChange={(e) => setAmendments(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Any dietary restrictions or allergies..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical Notes
        </label>
        <textarea
          value={amendments.medicalNotes}
          onChange={(e) => setAmendments(prev => ({ ...prev, medicalNotes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Any medical conditions or medications..."
        />
      </div>

      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Emergency Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={amendments.emergencyContact.name}
              onChange={(e) => setAmendments(prev => ({ 
                ...prev, 
                emergencyContact: { ...prev.emergencyContact, name: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emergency contact name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={amendments.emergencyContact.phone}
              onChange={(e) => setAmendments(prev => ({ 
                ...prev, 
                emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emergency contact phone"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={amendments.emergencyContact.relationship}
              onChange={(e) => setAmendments(prev => ({ 
                ...prev, 
                emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Parent, Guardian"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Any other notes or special requests..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingActions;
