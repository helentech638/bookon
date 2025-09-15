import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  EnvelopeIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface AutomatedEmail {
  id: string;
  name: string;
  trigger: 'registration' | 'booking_confirmation' | 'booking_reminder' | 'payment_received' | 'activity_cancelled';
  subject: string;
  template: string;
  isActive: boolean;
  lastSent?: string;
  totalSent: number;
  createdAt: string;
}

const CommunicationsAutomatedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<AutomatedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAutomatedEmails();
  }, []);

  const fetchAutomatedEmails = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockEmails: AutomatedEmail[] = [
        {
          id: '1',
          name: 'Welcome Email',
          trigger: 'registration',
          subject: 'Welcome to Our Service!',
          template: 'Welcome to our platform! We\'re excited to have you on board.',
          isActive: true,
          lastSent: '2024-01-19T10:00:00Z',
          totalSent: 150,
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Booking Confirmation',
          trigger: 'booking_confirmation',
          subject: 'Your Booking is Confirmed',
          template: 'Your booking has been confirmed. We look forward to seeing you!',
          isActive: true,
          lastSent: '2024-01-19T14:30:00Z',
          totalSent: 75,
          createdAt: '2024-01-16T10:00:00Z'
        },
        {
          id: '3',
          name: 'Booking Reminder',
          trigger: 'booking_reminder',
          subject: 'Reminder: Your Activity Tomorrow',
          template: 'This is a friendly reminder that your activity is scheduled for tomorrow.',
          isActive: true,
          lastSent: '2024-01-18T09:00:00Z',
          totalSent: 200,
          createdAt: '2024-01-17T10:00:00Z'
        },
        {
          id: '4',
          name: 'Payment Confirmation',
          trigger: 'payment_received',
          subject: 'Payment Received - Thank You!',
          template: 'We have received your payment. Thank you for your booking!',
          isActive: false,
          lastSent: '2024-01-15T16:45:00Z',
          totalSent: 50,
          createdAt: '2024-01-18T10:00:00Z'
        },
        {
          id: '5',
          name: 'Activity Cancellation',
          trigger: 'activity_cancelled',
          subject: 'Activity Cancelled - Important Notice',
          template: 'We regret to inform you that your scheduled activity has been cancelled.',
          isActive: true,
          totalSent: 5,
          createdAt: '2024-01-19T10:00:00Z'
        }
      ];
      
      setEmails(mockEmails);
    } catch (error) {
      console.error('Error fetching automated emails:', error);
      toast.error('Failed to load automated emails');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrigger = triggerFilter === 'all' || email.trigger === triggerFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && email.isActive) ||
                         (statusFilter === 'inactive' && !email.isActive);
    
    return matchesSearch && matchesTrigger && matchesStatus;
  });

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'registration':
        return 'User Registration';
      case 'booking_confirmation':
        return 'Booking Confirmation';
      case 'booking_reminder':
        return 'Booking Reminder';
      case 'payment_received':
        return 'Payment Received';
      case 'activity_cancelled':
        return 'Activity Cancelled';
      default:
        return trigger;
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (window.confirm('Are you sure you want to delete this automated email?')) {
      try {
        // Mock delete - replace with actual API call
        setEmails(prev => prev.filter(e => e.id !== emailId));
        toast.success('Automated email deleted successfully');
      } catch (error) {
        console.error('Error deleting automated email:', error);
        toast.error('Failed to delete automated email');
      }
    }
  };

  const handleToggleStatus = async (emailId: string) => {
    try {
      // Mock toggle - replace with actual API call
      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, isActive: !e.isActive } : e
      ));
      toast.success('Automated email status updated');
    } catch (error) {
      console.error('Error updating automated email:', error);
      toast.error('Failed to update automated email');
    }
  };

  if (loading) {
    return (
      <BusinessLayout user={user}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automated Emails</h1>
            <p className="text-gray-600 mt-1">Manage your automated email triggers and templates</p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Create Automated Email
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Emails</p>
                <p className="text-2xl font-bold text-gray-900">{emails.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emails.filter(e => e.isActive).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emails.filter(e => !e.isActive).length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {emails.reduce((sum, e) => sum + e.totalSent, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search automated emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
              <select
                value={triggerFilter}
                onChange={(e) => setTriggerFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Triggers</option>
                <option value="registration">User Registration</option>
                <option value="booking_confirmation">Booking Confirmation</option>
                <option value="booking_reminder">Booking Reminder</option>
                <option value="payment_received">Payment Received</option>
                <option value="activity_cancelled">Activity Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTriggerFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Automated Emails List */}
        <div className="space-y-4">
          {filteredEmails.map((email) => (
            <Card key={email.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <EnvelopeIcon className="h-6 w-6 text-blue-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{email.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          email.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {email.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Trigger: {getTriggerLabel(email.trigger)}</span>
                        <span>Subject: {email.subject}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{email.template}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>{email.totalSent} emails sent</span>
                    {email.lastSent && (
                      <span>Last sent {new Date(email.lastSent).toLocaleDateString()}</span>
                    )}
                    <span>Created {new Date(email.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(email.id)}
                    className="p-2 text-gray-400 hover:text-green-600"
                  >
                    <CogIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteEmail(email.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredEmails.length === 0 && (
          <Card className="p-12 text-center">
            <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No automated emails found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || triggerFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first automated email'
              }
            </p>
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Automated Email
            </Button>
          </Card>
        )}
      </div>
    </BusinessLayout>
  );
};

export default CommunicationsAutomatedPage;
