import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import { formatPrice } from '../../utils/formatting';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface BankFeedStats {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  pendingTransactions: number;
  totalMatchedAmount: number;
  totalUnmatchedAmount: number;
}

interface BankTransaction {
  id: string;
  bankReference: string;
  amount: number;
  currency: string;
  paymentReference?: string;
  description?: string;
  transactionDate: string;
  bankAccount?: string;
  status: 'pending' | 'matched' | 'unmatched' | 'processed';
  matchedBookingId?: string;
  matchedAt?: string;
  processedAt?: string;
  createdAt: string;
}

interface PendingTFCBooking {
  id: string;
  tfcReference: string;
  amount: number;
  tfcDeadline: string;
  parent: {
    firstName: string;
    lastName: string;
    email: string;
  };
  child: {
    firstName: string;
    lastName: string;
  };
  activity: {
    title: string;
    venue: {
      name: string;
    };
  };
  createdAt: string;
}

const BankFeedManagement: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<BankFeedStats | null>(null);
  const [unmatchedTransactions, setUnmatchedTransactions] = useState<BankTransaction[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingTFCBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unmatched' | 'pending'>('unmatched');
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<PendingTFCBooking | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      if (!token) return;

      const [statsRes, unmatchedRes, pendingRes] = await Promise.all([
        fetch(buildApiUrl('/bank-feed/stats'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(buildApiUrl('/bank-feed/unmatched'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(buildApiUrl('/bank-feed/pending-tfc'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (unmatchedRes.ok) {
        const unmatchedData = await unmatchedRes.json();
        setUnmatchedTransactions(unmatchedData.data);
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingBookings(pendingData.data);
      }

    } catch (error) {
      console.error('Error fetching bank feed data:', error);
      toast.error('Failed to fetch bank feed data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (!selectedTransaction || !selectedBooking) return;

    try {
      const token = authService.getToken();
      const response = await fetch(
        buildApiUrl(`/bank-feed/match/${selectedTransaction.id}/${selectedBooking.id}`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('Payment matched successfully!');
        setShowMatchModal(false);
        setSelectedTransaction(null);
        setSelectedBooking(null);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to match payment');
      }
    } catch (error) {
      console.error('Error matching payment:', error);
      toast.error('Failed to match payment');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'yellow', icon: ClockIcon, text: 'Pending' },
      matched: { color: 'green', icon: CheckCircleIcon, text: 'Matched' },
      unmatched: { color: 'red', icon: XCircleIcon, text: 'Unmatched' },
      processed: { color: 'blue', icon: CheckCircleIcon, text: 'Processed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge color={config.color as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const filteredTransactions = unmatchedTransactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.bankReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredBookings = pendingBookings.filter(booking => {
    const matchesSearch = !searchTerm ||
      booking.tfcReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${booking.parent.firstName} ${booking.parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${booking.child.firstName} ${booking.child.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.activity.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <AdminLayout title="Bank Feed Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Bank Feed Management">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bank Feed Management</h1>
          <p className="text-gray-600 mt-1">Auto-match TFC payments with incoming bank transactions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Matched</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.matchedTransactions}</p>
                  <p className="text-sm text-gray-600">{formatPrice(stats.totalMatchedAmount)}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unmatched</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unmatchedTransactions}</p>
                  <p className="text-sm text-gray-600">{formatPrice(stats.totalUnmatchedAmount)}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingTransactions}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('unmatched')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'unmatched'
                    ? 'border-[#00806a] text-[#00806a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Unmatched Transactions ({unmatchedTransactions.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-[#00806a] text-[#00806a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending TFC Bookings ({pendingBookings.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search transactions or bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {activeTab === 'unmatched' && (
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="unmatched">Unmatched</option>
            </Select>
          )}
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'unmatched' ? (
          <Card className="bg-white">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Unmatched Bank Transactions</h2>
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bank Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
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
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.bankReference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.paymentReference || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {transaction.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowMatchModal(true);
                              }}
                            >
                              Match Manually
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No unmatched transactions found</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="bg-white">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending TFC Bookings</h2>
              {filteredBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          TFC Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Parent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Child
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deadline
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.tfcReference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.parent.firstName} {booking.parent.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.child.firstName} {booking.child.lastName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{booking.activity.title}</div>
                              <div className="text-gray-500">{booking.activity.venue.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(booking.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.tfcDeadline).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowMatchModal(true);
                              }}
                            >
                              Match Payment
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending TFC bookings found</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Match Modal */}
        <Modal
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            setSelectedTransaction(null);
            setSelectedBooking(null);
          }}
          title="Manual Payment Match"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Match a bank transaction with a pending TFC booking to confirm payment.
            </p>
            
            {selectedTransaction && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Bank Transaction</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Reference:</strong> {selectedTransaction.bankReference}</p>
                  <p><strong>Amount:</strong> {formatPrice(selectedTransaction.amount)}</p>
                  <p><strong>Date:</strong> {new Date(selectedTransaction.transactionDate).toLocaleDateString()}</p>
                  {selectedTransaction.paymentReference && (
                    <p><strong>Payment Ref:</strong> {selectedTransaction.paymentReference}</p>
                  )}
                </div>
              </div>
            )}

            {selectedBooking && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">TFC Booking</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Reference:</strong> {selectedBooking.tfcReference}</p>
                  <p><strong>Amount:</strong> {formatPrice(selectedBooking.amount)}</p>
                  <p><strong>Parent:</strong> {selectedBooking.parent.firstName} {selectedBooking.parent.lastName}</p>
                  <p><strong>Child:</strong> {selectedBooking.child.firstName} {selectedBooking.child.lastName}</p>
                  <p><strong>Activity:</strong> {selectedBooking.activity.title}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMatchModal(false);
                  setSelectedTransaction(null);
                  setSelectedBooking(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualMatch}
                disabled={!selectedTransaction || !selectedBooking}
              >
                Confirm Match
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default BankFeedManagement;
