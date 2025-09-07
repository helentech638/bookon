import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon, XCircleIcon, EnvelopeIcon, FunnelIcon, ArrowDownTrayIcon, CurrencyPoundIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { authService } from '../../services/authService';

interface TFCBooking {
  id: string;
  child: string;
  parent: string;
  parentEmail: string;
  activity: string;
  venue: string;
  venueId: string;
  amount: number;
  reference: string;
  deadline: string;
  createdAt: string;
  daysRemaining: number;
}

const TFCQueuePage: React.FC = () => {
  const [bookings, setBookings] = useState<TFCBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<TFCBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    venue: 'all',
    status: 'all',
    sortBy: 'deadline'
  });

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/tfc/pending', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending bookings');
      }

      const result = await response.json();
      setBookings(result.data);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      toast.error('Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.child.toLowerCase().includes(searchLower) ||
        booking.parent.toLowerCase().includes(searchLower) ||
        booking.activity.toLowerCase().includes(searchLower) ||
        booking.reference.toLowerCase().includes(searchLower)
      );
    }

    // Venue filter
    if (filters.venue !== 'all') {
      filtered = filtered.filter(booking => booking.venueId === filters.venue);
    }

    // Status filter (based on days remaining)
    if (filters.status !== 'all') {
      switch (filters.status) {
        case 'urgent':
          filtered = filtered.filter(booking => booking.daysRemaining <= 2 && booking.daysRemaining > 0);
          break;
        case 'expired':
          filtered = filtered.filter(booking => booking.daysRemaining <= 0);
          break;
        case 'normal':
          filtered = filtered.filter(booking => booking.daysRemaining > 2);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'child':
          return a.child.localeCompare(b.child);
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings([...selectedBookings, bookingId]);
    } else {
      setSelectedBookings(selectedBookings.filter(id => id !== bookingId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(filteredBookings.map(booking => booking.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/v1/tfc/confirm/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      toast.success('Payment confirmed successfully');
      fetchPendingBookings();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tfc/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Cancelled by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      fetchPendingBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handlePartPaid = async (bookingId: string) => {
    const amount = prompt('Enter the amount received (in £):');
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    const confirmed = window.confirm(`Mark this booking as part-paid with £${amount} received?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tfc/part-paid/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amountReceived: parseFloat(amount)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark as part-paid');
      }

      toast.success('Booking marked as part-paid successfully');
      fetchPendingBookings();
    } catch (error) {
      console.error('Error marking as part-paid:', error);
      toast.error('Failed to mark as part-paid');
    }
  };

  const handleConvertToCredit = async (bookingId: string) => {
    const confirmed = window.confirm('Convert this booking to wallet credit? The parent will receive credit instead of a refund.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tfc/convert-to-credit/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to convert to credit');
      }

      toast.success('Booking converted to wallet credit successfully');
      fetchPendingBookings();
    } catch (error) {
      console.error('Error converting to credit:', error);
      toast.error('Failed to convert to credit');
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings to confirm');
      return;
    }

    const confirmed = window.confirm(`Confirm payments for ${selectedBookings.length} bookings?`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/v1/tfc/bulk-confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingIds: selectedBookings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk confirm payments');
      }

      const result = await response.json();
      toast.success(result.message);
      setSelectedBookings([]);
      fetchPendingBookings();
    } catch (error) {
      console.error('Error bulk confirming payments:', error);
      toast.error('Failed to bulk confirm payments');
    }
  };

  const handleSendReminder = async (bookingId: string) => {
    try {
      // TODO: Implement reminder email functionality
      toast.success('Reminder sent successfully');
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const getStatusBadge = (daysRemaining: number) => {
    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (daysRemaining <= 2) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (daysRemaining: number) => {
    if (daysRemaining <= 0) {
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    } else if (daysRemaining <= 2) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
    } else {
      return <ClockIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  const uniqueVenues = [...new Set(bookings.map(booking => ({ id: booking.venueId, name: booking.venue })))];

  if (loading) {
    return (
      <AdminLayout title="TFC Payment Queue">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending payments...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="TFC Payment Queue">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.daysRemaining <= 2 && b.daysRemaining > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircleIcon className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired</p>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.daysRemaining <= 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    £{bookings.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              Filters & Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <Input
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, search: e.target.value })}
              />
              
              <select 
                value={filters.venue} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, venue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Venues</option>
                {uniqueVenues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
              
              <select 
                value={filters.status} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="urgent">Urgent (&le;2 days)</option>
                <option value="expired">Expired</option>
                <option value="normal">Normal (&gt;2 days)</option>
              </select>
              
              <select 
                value={filters.sortBy} 
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="deadline">Deadline</option>
                <option value="amount">Amount</option>
                <option value="created">Created Date</option>
                <option value="child">Child Name</option>
              </select>
              
              <Button onClick={handleBulkConfirm} disabled={selectedBookings.length === 0}>
                Confirm Selected ({selectedBookings.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending TFC Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <Checkbox
                        checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-2">Child</th>
                    <th className="text-left p-2">Activity</th>
                    <th className="text-left p-2">Venue</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Reference</th>
                    <th className="text-left p-2">Deadline</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedBookings.includes(booking.id)}
                          onCheckedChange={(checked: boolean) => handleSelectBooking(booking.id, checked)}
                        />
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{booking.child}</p>
                          <p className="text-sm text-gray-600">{booking.parent}</p>
                        </div>
                      </td>
                      <td className="p-2">{booking.activity}</td>
                      <td className="p-2">{booking.venue}</td>
                      <td className="p-2 font-semibold">£{booking.amount.toFixed(2)}</td>
                      <td className="p-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {booking.reference}
                        </code>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(booking.daysRemaining)}
                          <div>
                            <p className="text-sm">{new Date(booking.deadline).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-600">
                              {booking.daysRemaining > 0 ? `${booking.daysRemaining} days left` : 'Expired'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">{getStatusBadge(booking.daysRemaining)}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmPayment(booking.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePartPaid(booking.id)}
                            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300"
                          >
                            <CurrencyPoundIcon className="h-4 w-4 mr-1" />
                            Part Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToCredit(booking.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300"
                          >
                            <CreditCardIcon className="h-4 w-4 mr-1" />
                            To Credit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(booking.id)}
                          >
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            Remind
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredBookings.length === 0 && (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending TFC payments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TFCQueuePage;
