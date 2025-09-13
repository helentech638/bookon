import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';

interface TFCPendingBooking {
  id: string;
  paymentReference: string;
  amount: number;
  deadline: string;
  status: 'pending' | 'expired' | 'confirmed';
  createdAt: string;
  activity: {
    title: string;
    startDate: string;
    startTime: string;
    venue: {
      name: string;
      city: string;
    };
  };
  child: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  tfcConfig: {
    providerName: string;
    providerNumber: string;
  };
}

const TFCPendingQueuePage: React.FC = () => {
  const [bookings, setBookings] = useState<TFCPendingBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadPendingBookings();
  }, [statusFilter]);

  const loadPendingBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/v1/admin/tfc/pending?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load pending bookings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/admin/tfc-pending/${bookingId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadPendingBookings();
        alert('Booking marked as paid successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as paid');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/admin/tfc-pending/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadPendingBookings();
        alert('Booking cancelled successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const handleConvertToCredit = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/admin/tfc-pending/${bookingId}/convert-credit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadPendingBookings();
        alert('Booking converted to credit successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert to credit');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to convert to credit');
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedBookings.length === 0) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/admin/tfc-pending/bulk-mark-paid', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingIds: selectedBookings })
      });

      if (response.ok) {
        await loadPendingBookings();
        setSelectedBookings([]);
        setShowBulkActions(false);
        alert(`${selectedBookings.length} bookings marked as paid successfully`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark bookings as paid');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark bookings as paid');
    }
  };

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(b => b.id));
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h';
  };

  const getStatusBadge = (status: string, deadline: string) => {
    const timeRemaining = getTimeRemaining(deadline);
    
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Confirmed
        </span>
      );
    }
    
    if (timeRemaining === 'Expired') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }
    
    if (timeRemaining.includes('h') || timeRemaining.includes('Less than')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
          Urgent
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <ClockIcon className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.child.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.child.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.activity.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <AdminLayout title="TFC Pending Queue">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TFC Pending Queue</h1>
            <p className="text-gray-600">Manage Tax-Free Childcare pending payments</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={loadPendingBookings}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            {selectedBookings.length > 0 && (
              <Button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Bulk Actions ({selectedBookings.length})
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Bulk Actions</h3>
                <p className="text-sm text-blue-700">
                  {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleBulkMarkAsPaid}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark All as Paid
                </Button>
                <Button
                  onClick={() => setShowBulkActions(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by reference, child name, email..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                variant="outline"
                className="w-full"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircleIcon className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading pending bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending TFC bookings found</p>
              <p className="text-sm text-gray-500">All bookings are up to date</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child & Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => handleSelectBooking(booking.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {booking.paymentReference}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.child.firstName} {booking.child.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.activity.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.activity.venue.name} - {booking.activity.venue.city}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {booking.parent.firstName} {booking.parent.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.parent.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.parent.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          £{booking.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDeadline(booking.deadline)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTimeRemaining(booking.deadline)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status, booking.deadline)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleMarkAsPaid(booking.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleConvertToCredit(booking.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Convert to Credit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel Booking"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default TFCPendingQueuePage;
