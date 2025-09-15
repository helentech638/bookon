import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyPoundIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { bookingService, Booking } from '../../services/bookingService';
import { formatPrice } from '../../utils/formatting';

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load bookings');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback - remove this when API is fully implemented
  const mockBookings: Booking[] = [
    {
      id: 1,
      bookingNumber: 'BK-2024-001',
      childName: 'Emma Johnson',
      activity: 'Swimming Lessons',
      venue: 'Aqua Sports Centre',
      date: '2024-01-20',
      time: '14:00-15:00',
      status: 'confirmed',
      amount: 25.00,
      paymentStatus: 'paid',
      createdAt: '2024-01-15T10:30:00Z',
      notes: 'First swimming lesson, please bring swimwear and towel'
    },
    {
      id: 2,
      bookingNumber: 'BK-2024-002',
      childName: 'Liam Smith',
      activity: 'Football Training',
      venue: 'City Football Club',
      date: '2024-01-21',
      time: '16:30-17:30',
      status: 'pending',
      amount: 18.50,
      paymentStatus: 'pending',
      createdAt: '2024-01-16T14:20:00Z',
      notes: 'Returning player, needs new kit'
    },
    {
      id: 3,
      bookingNumber: 'BK-2024-003',
      childName: 'Sophia Brown',
      activity: 'Dance Class',
      venue: 'Star Dance Academy',
      date: '2024-01-22',
      time: '15:00-16:00',
      status: 'confirmed',
      amount: 22.00,
      paymentStatus: 'paid',
      createdAt: '2024-01-17T09:15:00Z',
      notes: 'Ballet shoes required'
    },
    {
      id: 4,
      bookingNumber: 'BK-2024-004',
      childName: 'Noah Wilson',
      activity: 'Art Workshop',
      venue: 'Creative Arts Studio',
      date: '2024-01-23',
      time: '10:00-12:00',
      status: 'cancelled',
      amount: 30.00,
      paymentStatus: 'refunded',
      createdAt: '2024-01-18T11:45:00Z',
      notes: 'Cancelled due to illness, refund processed'
    },
    {
      id: 5,
      bookingNumber: 'BK-2024-005',
      childName: 'Olivia Davis',
      activity: 'Science Discovery Lab',
      venue: 'Discovery Science Centre',
      date: '2024-01-24',
      time: '13:00-15:00',
      status: 'confirmed',
      amount: 35.00,
      paymentStatus: 'paid',
      createdAt: '2024-01-19T16:30:00Z',
      notes: 'Lab coat provided, closed-toe shoes required'
    },
    {
      id: 6,
      bookingNumber: 'BK-2024-006',
      childName: 'William Taylor',
      activity: 'Music & Instrument Lessons',
      venue: 'Harmony Music School',
      date: '2024-01-25',
      time: '14:00-15:00',
      status: 'pending',
      amount: 28.00,
      paymentStatus: 'pending',
      createdAt: '2024-01-20T13:20:00Z',
      notes: 'Piano lesson, sheet music will be provided'
    }
  ];

  const statuses = ['all', 'confirmed', 'pending', 'cancelled', 'completed'];
  const venues = ['all', 'Aqua Sports Centre', 'City Football Club', 'Creative Arts Studio', 'Star Dance Academy', 'Discovery Science Centre', 'Harmony Music School'];

  // Use mock data if API fails
  const displayBookings = bookings.length > 0 ? bookings : mockBookings;

  const filteredBookings = displayBookings.filter(booking => {
    const matchesSearch = 
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
    const matchesVenue = selectedVenue === 'all' || booking.venue === selectedVenue;
    
    return matchesSearch && matchesStatus && matchesVenue;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XMarkIcon className="w-4 h-4" />;
      case 'completed':
        return <CheckIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Action handlers
  const handleViewBooking = (bookingId: number) => {
    navigate(`/bookings/${bookingId}`);
  };

  const handleEditBooking = (bookingId: number) => {
    navigate(`/bookings/${bookingId}/edit`);
  };

  const handleConfirmBooking = async (bookingId: number) => {
    try {
      await bookingService.confirmBooking(bookingId);
      // Reload bookings to get updated status
      await loadBookings();
      setSuccessMessage('Booking confirmed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to confirm booking');
      console.error('Error confirming booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await bookingService.cancelBooking(bookingId);
      // Reload bookings to get updated status
      await loadBookings();
      setSuccessMessage('Booking cancelled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    try {
      await bookingService.deleteBooking(bookingId);
      // Reload bookings to get updated list
      await loadBookings();
      setShowDeleteModal(false);
      setBookingToDelete(null);
      setSuccessMessage('Booking deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete booking');
      console.error('Error deleting booking:', err);
    }
  };

  const openDeleteModal = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
          <div className="mt-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg mx-auto" style={{ width: isMobile ? '90%' : '600px' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-900 text-lg font-medium mb-2">Error Loading Bookings</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadBookings} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-gray-600">Manage and track all your activity bookings</p>
            </div>
            <Link to="/bookings/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00806a] hover:bg-[#006d5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Booking
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className={`flex flex-col gap-4 ${isMobile ? 'space-y-3' : 'lg:flex-row'}`}>
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings, children, or activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                  style={{ fontSize: isMobile ? '16px' : '14px' }} // Prevent zoom on iOS
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center ${isMobile ? 'w-full justify-center py-3' : ''}`}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mt-4 p-6">
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Venue Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                  >
                    {venues.map(venue => (
                      <option key={venue} value={venue}>
                        {venue === 'all' ? 'All Venues' : venue}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedStatus('all');
                      setSelectedVenue('all');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredBookings.length} of {displayBookings.length} bookings
          </p>
        </div>

        {/* Bookings Table */}
        <Card>
          <div className={`${isMobile ? 'block' : 'overflow-x-auto'}`}>
            {isMobile ? (
              // Mobile card layout
              <div className="space-y-4 p-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{booking.childName || 'Loading...'}</h3>
                        <p className="text-sm text-gray-600">{booking.activity || 'Loading...'}</p>
                        <p className="text-sm text-gray-500">{booking.venue || 'Loading...'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status || 'pending')}`}>
                          {getStatusIcon(booking.status || 'pending')}
                          <span className="ml-1">{(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-medium">{booking.date ? formatDate(booking.date) : 'Loading...'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <p className="font-medium">{booking.time ? formatTime(booking.time) : 'Loading...'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p className="font-medium">{formatPrice(booking.amount || 0)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus || 'pending')}`}>
                          {(booking.paymentStatus || 'pending').charAt(0).toUpperCase() + (booking.paymentStatus || 'pending').slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBooking(booking.id)}
                        className="flex-1 justify-center py-2"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {(booking.status || 'pending') === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBooking(booking.id)}
                            className="flex-1 justify-center py-2"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmBooking(booking.id)}
                            className="flex-1 justify-center py-2 text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                        </>
                      )}
                      {(booking.status || 'pending') === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex-1 justify-center py-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(booking)}
                        className="flex-1 justify-center py-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop table layout
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity & Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#00806a] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {booking.childName ? booking.childName.split(' ').map(n => n[0]).join('') : '?'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{booking.childName || 'Loading...'}</div>
                          <div className="text-sm text-gray-500">{booking.bookingNumber || 'Loading...'}</div>
                          <div className="text-xs text-gray-400">
                            Booked {booking.createdAt ? formatDate(booking.createdAt) : 'Loading...'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.activity || 'Loading...'}</div>
                        <div className="text-sm text-gray-500">{booking.venue || 'Loading...'}</div>
                        {booking.notes && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center">
                            <DocumentTextIcon className="w-3 h-3 mr-1" />
                            {booking.notes && booking.notes.length > 50 ? `${booking.notes.substring(0, 50)}...` : booking.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.date ? formatDate(booking.date) : 'Loading...'}</div>
                      <div className="text-sm text-gray-500">{booking.time ? formatTime(booking.time) : 'Loading...'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatPrice(booking.amount || 0)}</div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus || 'pending')}`}>
                        {(booking.paymentStatus || 'pending').charAt(0).toUpperCase() + (booking.paymentStatus || 'pending').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status || 'pending')}`}>
                        {getStatusIcon(booking.status || 'pending')}
                        <span className="ml-1">{(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBooking(booking.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {(booking.status || 'pending') === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBooking(booking.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConfirmBooking(booking.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50 inline-flex items-center"
                            >
                              <CheckIcon className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                          </>
                        )}
                        {(booking.status || 'pending') === 'confirmed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50 inline-flex items-center"
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(booking)}
                          className="text-red-600 border-red-300 hover:bg-red-50 inline-flex items-center"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </Card>

        {/* No Results */}
        {filteredBookings.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">No bookings found</p>
              <p className="text-sm">Try adjusting your search criteria or filters</p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center mx-auto mb-4">
              <PlusIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Booking</h3>
            <p className="text-gray-600 mb-4">Book an activity for your child</p>
            <Link to="/bookings/new" className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00806a] hover:bg-[#006d5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
              New Booking
            </Link>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-[#041c30] rounded-lg flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">View Reports</h3>
            <p className="text-gray-600 mb-4">Generate booking reports and analytics</p>
            <Link to="/reports" className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
              View Reports
            </Link>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Actions</h3>
            <p className="text-gray-600 mb-4">Manage multiple bookings at once</p>
            <Link to="/bookings/bulk" className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
              Bulk Actions
            </Link>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && bookingToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Booking</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the booking for <strong>{bookingToDelete.childName || 'this child'}</strong>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBookingToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteBooking(bookingToDelete.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
