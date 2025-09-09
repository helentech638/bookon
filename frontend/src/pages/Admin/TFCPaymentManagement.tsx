import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  CurrencyPoundIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TFCBooking {
  id: string;
  reference: string;
  deadline: string;
  amount: number;
  status: 'pending_payment' | 'part_paid' | 'paid' | 'cancelled';
  createdAt: string;
  activity: {
    name: string;
    venue: {
      name: string;
      id: string;
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
}

interface TFCStats {
  totalPending: number;
  totalAmount: number;
  expiringToday: number;
  overdue: number;
}

const TFCPaymentManagement: React.FC = () => {
  const [bookings, setBookings] = useState<TFCBooking[]>([]);
  const [stats, setStats] = useState<TFCStats>({
    totalPending: 0,
    totalAmount: 0,
    expiringToday: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVenue, setFilterVenue] = useState<string>('all');

  useEffect(() => {
    fetchTFCBookings();
  }, [filterStatus, filterVenue]);

  const fetchTFCBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bookon_token');
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterVenue !== 'all') params.append('venueId', filterVenue);
      
      const response = await fetch(`/api/v1/admin/tfc/pending?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch TFC bookings');
      }

      const data = await response.json();
      setBookings(data.data.bookings || []);
      setStats(data.data.stats || stats);
    } catch (error) {
      console.error('Error fetching TFC bookings:', error);
      toast.error('Failed to load TFC bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('bookon_token');
      const response = await fetch(`/api/v1/tfc/confirm/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark as paid');
      }

      toast.success('Booking marked as paid');
      fetchTFCBookings();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark booking as paid');
    }
  };

  const handleMarkAsPartPaid = async (bookingId: string, amountReceived: number) => {
    try {
      const token = localStorage.getItem('bookon_token');
      const response = await fetch(`/api/v1/tfc/part-paid/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amountReceived })
      });

      if (!response.ok) {
        throw new Error('Failed to mark as part-paid');
      }

      toast.success('Booking marked as part-paid');
      fetchTFCBookings();
    } catch (error) {
      console.error('Error marking as part-paid:', error);
      toast.error('Failed to mark booking as part-paid');
    }
  };

  const handleCancelUnpaid = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this unpaid booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('bookon_token');
      const response = await fetch(`/api/v1/tfc/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Cancelled by admin - payment not received' })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Booking cancelled');
      fetchTFCBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleConvertToCredit = async (bookingId: string) => {
    if (!confirm('Convert this booking to wallet credit for the parent?')) {
      return;
    }

    try {
      const token = localStorage.getItem('bookon_token');
      const response = await fetch(`/api/v1/tfc/convert-to-credit/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to convert to credit');
      }

      toast.success('Booking converted to wallet credit');
      fetchTFCBookings();
    } catch (error) {
      console.error('Error converting to credit:', error);
      toast.error('Failed to convert to credit');
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings to mark as paid');
      return;
    }

    if (!confirm(`Mark ${selectedBookings.length} bookings as paid?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('bookon_token');
      const response = await fetch('/api/v1/tfc/bulk-mark-paid', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookingIds: selectedBookings })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk mark as paid');
      }

      toast.success(`${selectedBookings.length} bookings marked as paid`);
      setSelectedBookings([]);
      fetchTFCBookings();
    } catch (error) {
      console.error('Error bulk marking as paid:', error);
      toast.error('Failed to bulk mark bookings as paid');
    }
  };

  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success('Reference copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy reference');
    }
  };

  const getStatusBadge = (status: string, deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const isOverdue = deadlineDate < now;
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (status === 'paid') {
      return <Badge variant="success">Paid</Badge>;
    } else if (status === 'part_paid') {
      return <Badge variant="secondary">Part Paid</Badge>;
    } else if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (hoursUntilDeadline <= 24) {
      return <Badge variant="secondary">Expiring Soon</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TFC Payment Management</h1>
          <p className="text-gray-600">Manage Tax-Free Childcare payments and pending bookings</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleBulkMarkAsPaid}
            disabled={selectedBookings.length === 0}
            variant="default"
          >
            Bulk Mark as Paid ({selectedBookings.length})
          </Button>
          <Button onClick={fetchTFCBookings} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CurrencyPoundIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Expiring Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="part_paid">Part Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <select
                value={filterVenue}
                onChange={(e) => setFilterVenue(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Venues</option>
                {/* Add venue options dynamically */}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>TFC Bookings Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length === bookings.length && bookings.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBookings(bookings.map(b => b.id));
                        } else {
                          setSelectedBookings([]);
                        }
                      }}
                      className="rounded border-gray-300"
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
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings([...selectedBookings, booking.id]);
                          } else {
                            setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {booking.reference}
                        </code>
                        <button
                          onClick={() => copyReference(booking.reference)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.child.firstName} {booking.child.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{booking.activity.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <BuildingOfficeIcon className="h-3 w-3" />
                          {booking.activity.venue.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.parent.firstName} {booking.parent.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{booking.parent.email}</div>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status, booking.deadline)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {booking.status === 'pending_payment' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleMarkAsPaid(booking.id)}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const amount = prompt('Enter amount received:');
                                if (amount && !isNaN(parseFloat(amount))) {
                                  handleMarkAsPartPaid(booking.id, parseFloat(amount));
                                }
                              }}
                            >
                              Part Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToCredit(booking.id)}
                            >
                              To Credit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelUnpaid(booking.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {booking.status === 'part_paid' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleMarkAsPaid(booking.id)}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToCredit(booking.id)}
                            >
                              To Credit
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TFCPaymentManagement;
